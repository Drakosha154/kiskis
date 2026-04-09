package routes

import (
	"net/http"
	"strconv"
	"time"

	"kiskis/database"
	"kiskis/models"

	"github.com/gin-gonic/gin"
)

// GetContractsToPay возвращает список договоров, требующих оплаты
func GetContractsToPay(c *gin.Context) {
	type ContractPaymentInfo struct {
		ID              uint       `json:"id"`
		DocNumber       string     `json:"doc_number"`
		DocDate         string     `json:"doc_date"`
		VendorID        int        `json:"vendor_id"`
		VendorName      string     `json:"vendor_name"`
		TotalAmount     float64    `json:"total_amount"`
		PaidAmount      float64    `json:"paid_amount"`
		RemainingAmount float64    `json:"remaining_amount"`
		PaymentTerms    string     `json:"payment_terms"`
		PaymentStatus   string     `json:"payment_status"`
		DeadlineDate    *time.Time `json:"deadline_date"`
		Status          string     `json:"status"`
		CanReceiveGoods bool       `json:"can_receive_goods"`
		MinPayment      float64    `json:"min_payment"`
		IsOverdue       bool       `json:"is_overdue"`
		DaysUntilDue    int        `json:"days_until_due"`
	}

	var contracts []ContractPaymentInfo

	// Получаем все договоры, которые не полностью оплачены
	query := `
		SELECT 
			d.id,
			d.doc_number,
			d.doc_date,
			d.vendor_id,
			v.company_name as vendor_name,
			d.total_amount,
			d.paid_amount,
			(d.total_amount - d.paid_amount) as remaining_amount,
			d.payment_terms,
			d.payment_status,
			d.deadline_date,
			d.status
		FROM documents d
		LEFT JOIN vendors v ON v.id = d.vendor_id
		WHERE d.doc_type = 'Договор'
			AND d.payment_status != 'fully_paid'
			AND d.status != 'Отменён'
		ORDER BY 
			CASE 
				WHEN d.deadline_date < CURRENT_DATE THEN 0
				WHEN d.deadline_date <= CURRENT_DATE + INTERVAL '3 days' THEN 1
				ELSE 2
			END,
			d.deadline_date ASC,
			d.doc_date ASC
	`

	if err := database.DB.Raw(query).Scan(&contracts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch contracts"})
		return
	}

	// Рассчитываем дополнительные поля для каждого договора
	now := time.Now()
	for i := range contracts {
		contract := &contracts[i]

		// Рассчитываем минимальную сумму оплаты
		switch contract.PaymentTerms {
		case "prepaid":
			contract.MinPayment = contract.TotalAmount
		case "partial":
			contract.MinPayment = contract.TotalAmount * 0.5
		case "postpaid":
			contract.MinPayment = 0
		}

		// Проверяем, можно ли принимать товар
		switch contract.PaymentTerms {
		case "prepaid":
			contract.CanReceiveGoods = contract.PaymentStatus == "fully_paid"
		case "partial":
			contract.CanReceiveGoods = contract.PaidAmount >= contract.TotalAmount*0.5
		case "postpaid":
			contract.CanReceiveGoods = true
		}

		// Проверяем просрочку
		if contract.DeadlineDate != nil {
			contract.IsOverdue = contract.DeadlineDate.Before(now)
			contract.DaysUntilDue = int(contract.DeadlineDate.Sub(now).Hours() / 24)
		}
	}

	// Получаем текущий баланс
	var money models.Money
	database.DB.First(&money)

	c.JSON(http.StatusOK, gin.H{
		"contracts":       contracts,
		"current_balance": money.Money,
		"total_count":     len(contracts),
	})
}

// PayContract проводит оплату договора
func PayContract(c *gin.Context) {
	contractID := c.Param("id")
	id, err := strconv.Atoi(contractID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid contract ID"})
		return
	}

	var input struct {
		Amount float64 `json:"amount" binding:"required,gt=0"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Сумма оплаты обязательна и должна быть больше 0"})
		return
	}

	userID := c.MustGet("userID").(uint)

	// Начинаем транзакцию
	tx := database.DB.Begin()

	// Получаем договор
	var document models.Documents
	if err := tx.First(&document, id).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Договор не найден"})
		return
	}

	// Проверяем, что договор не отменён
	if document.Status == "Отменён" {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Нельзя оплатить отменённый договор"})
		return
	}

	// Проверяем, что договор не переплачен
	remainingAmount := document.Total_amount - document.PaidAmount
	if remainingAmount <= 0 {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Договор уже полностью оплачен"})
		return
	}

	// Проверяем, что сумма оплаты не превышает остаток
	if input.Amount > remainingAmount {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{
			"error":            "Сумма оплаты превышает остаток по договору",
			"remaining_amount": remainingAmount,
			"requested_amount": input.Amount,
		})
		return
	}

	// Проверяем достаточность средств
	var money models.Money
	if err := tx.First(&money).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось получить данные о бюджете"})
		return
	}

	if money.Money < input.Amount {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{
			"error":     "Недостаточно средств в бюджете",
			"available": money.Money,
			"required":  input.Amount,
			"shortage":  input.Amount - money.Money,
		})
		return
	}

	// Списываем средства из бюджета
	if err := tx.Exec("UPDATE money SET money = money - ?", input.Amount).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось списать средства из бюджета"})
		return
	}

	// Обновляем paid_amount в документе
	newPaidAmount := document.PaidAmount + input.Amount

	// Определяем новый статус оплаты
	var newPaymentStatus string
	if newPaidAmount >= document.Total_amount {
		newPaymentStatus = "fully_paid"
	} else if newPaidAmount > 0 {
		newPaymentStatus = "partially_paid"
	} else {
		newPaymentStatus = "unpaid"
	}

	if err := tx.Model(&document).Updates(map[string]interface{}{
		"paid_amount":    newPaidAmount,
		"payment_status": newPaymentStatus,
	}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось обновить статус оплаты договора"})
		return
	}

	// Создаём запись в бухгалтерии
	accounting := models.Accounting{
		Operation_date: time.Now(),
		Operation_type: "expense",
		Document_id:    int(document.ID),
		Supplier_id:    document.Vendor_id,
		Amount:         input.Amount,
		Vat_amount:     0,
		Description:    "Оплата по договору " + document.Doc_number,
		Created_by:     int(userID),
		Created_at:     time.Now(),
	}

	if err := tx.Create(&accounting).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось создать запись в бухгалтерии"})
		return
	}

	// Фиксируем транзакцию
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось завершить транзакцию"})
		return
	}

	// Получаем обновлённый баланс
	var finalMoney models.Money
	database.DB.First(&finalMoney)

	c.JSON(http.StatusOK, gin.H{
		"message":         "Оплата успешно проведена",
		"contract_id":     document.ID,
		"doc_number":      document.Doc_number,
		"amount_paid":     input.Amount,
		"total_paid":      newPaidAmount,
		"remaining":       document.Total_amount - newPaidAmount,
		"payment_status":  newPaymentStatus,
		"current_balance": finalMoney.Money,
	})
}