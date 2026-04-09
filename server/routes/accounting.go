package routes

import (
	"net/http"
	"time"

	"kiskis/database"
	"kiskis/models"

	"github.com/gin-gonic/gin"
)

// GetAccountingOperations возвращает все финансовые операции
func GetAccountingOperations(c *gin.Context) {
	type AccountingResponse struct {
		models.Accounting
		DocumentNumber string `json:"document_number"`
		DocumentType   string `json:"document_type"`
		VendorName     string `json:"vendor_name"`
		ProductName    string `json:"product_name"`
	}

	var operations []AccountingResponse

	query := database.DB.Table("accountings").
		Select(`accountings.*, 
                documents.doc_number as document_number,
                documents.doc_type as document_type,
                vendors.company_name as vendor_name,
                products.name as product_name`).
		Joins("LEFT JOIN documents ON documents.id = accountings.document_id").
		Joins("LEFT JOIN vendors ON vendors.id = accountings.supplier_id").
		Joins("LEFT JOIN document_items ON document_items.document_id = accountings.document_id").
		Joins("LEFT JOIN products ON products.id = document_items.product_id").
		Order("accountings.operation_date DESC").
		Limit(100) // Ограничиваем количество записей

	// Фильтр по датам, если переданы
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	if startDate != "" {
		query = query.Where("accountings.operation_date >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("accountings.operation_date <= ?", endDate)
	}

	if err := query.Scan(&operations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch accounting operations"})
		return
	}

	// Получаем текущий баланс
	var money models.Money
	database.DB.Select("money").Find(&money)

	c.JSON(http.StatusOK, gin.H{
		"operations": operations,
		"balance":    money.Money,
	})
}

// GetAccountingSummary возвращает сводку по финансам
func GetAccountingSummary(c *gin.Context) {
	var summary struct {
		TotalIncome  float64 `json:"total_income"`
		TotalOutcome float64 `json:"total_outcome"`
		Balance      float64 `json:"balance"`
		LastMonth    float64 `json:"last_month"`
	}

	// Получаем текущий баланс
	var money models.Money
	database.DB.Select("money").Find(&money)
	summary.Balance = money.Money

	// Сумма приходов за все время
	database.DB.Model(&models.Accounting{}).
		Where("operation_type = ?", "income").
		Select("COALESCE(SUM(amount), 0)").
		Scan(&summary.TotalIncome)

	// Сумма расходов за все время
	database.DB.Model(&models.Accounting{}).
		Where("operation_type IN ?", []string{"outcome", "writeoff"}).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&summary.TotalOutcome)

	// Сумма за последний месяц
	monthAgo := time.Now().AddDate(0, -1, 0)
	database.DB.Model(&models.Accounting{}).
		Where("operation_date >= ?", monthAgo).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&summary.LastMonth)

	c.JSON(http.StatusOK, summary)
}

func GetAccountingDebts(c *gin.Context) {
	type DebtResponse struct {
		ID           uint    `json:"id"`
		VendorName   string  `json:"vendor_name"`
		DocNumber    string  `json:"doc_number"`
		DocDate      string  `json:"doc_date"`
		TotalAmount  float64 `json:"total_amount"`
		PaidAmount   float64 `json:"paid_amount"`
		Status       string  `json:"status"`
		DebtType     string  `json:"debt_type"`      // "Кредиторская" или "Дебиторская"
		DebtAmount   float64 `json:"debt_amount"`
		DeadlineDate *time.Time `json:"deadline_date"`
	}

	var debts []DebtResponse

	// Запрос для получения задолженности
	query := `
		SELECT 
			d.id,
			v.company_name as vendor_name,
			d.doc_number,
			d.doc_date,
			d.total_amount,
			d.paid_amount,
			d.status,
			d.deadline_date,
			CASE 
				WHEN (d.total_amount - d.paid_amount) > 0 AND d.status != 'Исполнен' 
				THEN 'Кредиторская'
				WHEN d.paid_amount > 0 AND d.status != 'Исполнен'
				THEN 'Дебиторская'
			END as debt_type,
			CASE 
				WHEN (d.total_amount - d.paid_amount) > 0 AND d.status != 'Исполнен'
				THEN (d.total_amount - d.paid_amount)
				WHEN d.paid_amount > 0 AND d.status != 'Исполнен'
				THEN d.paid_amount
			END as debt_amount
		FROM documents d
		LEFT JOIN vendors v ON v.id = d.vendor_id
		WHERE d.doc_type = 'Договор'
			AND d.status != 'Исполнен'
			AND (
				(d.total_amount - d.paid_amount) > 0 
				OR d.paid_amount > 0
			)
		ORDER BY debt_type, v.company_name, d.doc_date
	`

	if err := database.DB.Raw(query).Scan(&debts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch debts"})
		return
	}

	// Подсчет итоговых сумм
	var totalCreditor float64 = 0
	var totalDebtor float64 = 0
	var creditorCount int = 0
	var debtorCount int = 0

	for _, debt := range debts {
		if debt.DebtType == "Кредиторская" {
			totalCreditor += debt.DebtAmount
			creditorCount++
		} else if debt.DebtType == "Дебиторская" {
			totalDebtor += debt.DebtAmount
			debtorCount++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"debts": debts,
		"summary": gin.H{
			"total_creditor":  totalCreditor,
			"total_debtor":    totalDebtor,
			"creditor_count":  creditorCount,
			"debtor_count":    debtorCount,
		},
	})
}
