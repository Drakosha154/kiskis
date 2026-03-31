package routes

import (
	"fmt"
	"net/http"
	"sort"
	"time"

	"kiskis/database"

	"github.com/gin-gonic/gin"
)

// GetReportsSummary - обновлённая версия с учётом претензий из claims
func GetReportsSummary(c *gin.Context) {
	dateFrom := c.Query("date_from")
	dateTo := c.Query("date_to")

	if dateFrom == "" {
		dateFrom = time.Now().AddDate(0, -1, 0).Format("2006-01-02")
	}
	if dateTo == "" {
		dateTo = time.Now().Format("2006-01-02")
	}

	type SummaryResponse struct {
		PurchasedQuantity float64 `json:"purchased_quantity"`
		TotalSpent        float64 `json:"total_spent"`
		ClaimsCount       int64   `json:"claims_count"`
		AccountsPayable   float64 `json:"accounts_payable"`
	}

	var summary SummaryResponse

	// 1. Объём закупленного сырья
	database.DB.Table("storages s").
		Select("COALESCE(SUM(s.quantity), 0)").
		Where("s.quantity > 0").
		Scan(&summary.PurchasedQuantity)

	// 2. Стоимость закупленного сырья
	database.DB.Table("documents d").
		Select("COALESCE(SUM(d.total_amount), 0)").
		Where("d.created_at BETWEEN ? AND ? AND d.doc_type = ?",
			dateFrom, dateTo+" 23:59:59", "Приход").
		Scan(&summary.TotalSpent)

	// 3. Количество претензий - ИСПРАВЛЕНО: преобразуем даты в timestamp
	startDate := dateFrom + " 00:00:00"
	endDate := dateTo + " 23:59:59"
	database.DB.Table("claims").
		Where("created_at BETWEEN ? AND ?", startDate, endDate).
		Count(&summary.ClaimsCount)

	// 4. Уровень задолженности
	database.DB.Table("documents d").
		Select("COALESCE(SUM(d.total_amount - COALESCE(a.paid_amount, 0)), 0)").
		Joins("LEFT JOIN (SELECT document_id, SUM(amount) as paid_amount FROM accountings WHERE operation_type = 'Оплата' GROUP BY document_id) a ON d.id = a.document_id").
		Where("d.doc_type = ? AND d.status NOT IN (?)", "Приход", []string{"Оплачен", "Завершён"}).
		Scan(&summary.AccountsPayable)

	c.JSON(http.StatusOK, gin.H{"summary": summary})
}

// GetReportsCalendarEvents - получение событий для календаря
func GetReportsCalendarEvents(c *gin.Context) {
	dateFrom := c.Query("date_from")
	dateTo := c.Query("date_to")

	if dateFrom == "" {
		dateFrom = time.Now().AddDate(-1, 0, 0).Format("2006-01-02")
	}
	if dateTo == "" {
		dateTo = time.Now().AddDate(1, 0, 0).Format("2006-01-02")
	}

	type CalendarEvent struct {
		Date        string `json:"date"`
		Title       string `json:"title"`
		Description string `json:"description"`
		Type        string `json:"type"`
		DocumentID  int    `json:"document_id,omitempty"`
		Status      string `json:"status,omitempty"`
	}

	var events []CalendarEvent

	// 1. Дедлайны по оплате (только неоплаченные документы прихода)
	var unpaidDocuments []struct {
		ID          uint      `json:"id"`
		DocNumber   string    `json:"doc_number"`
		CreatedAt   time.Time `json:"created_at"`
		TotalAmount float64   `json:"total_amount"`
		VendorName  string    `json:"vendor_name"`
		PaidAmount  float64   `json:"paid_amount"`
		Status      string    `json:"status"`
	}

	database.DB.Table("documents d").
		Select(`
			d.id, 
			d.doc_number, 
			d.created_at, 
			d.total_amount, 
			v.company_name as vendor_name,
			d.status,
			COALESCE(a.paid_amount, 0) as paid_amount
		`).
		Joins("LEFT JOIN vendors v ON d.vendor_id = v.id").
		Joins("LEFT JOIN (SELECT document_id, SUM(amount) as paid_amount FROM accountings WHERE operation_type = 'Оплата' GROUP BY document_id) a ON d.id = a.document_id").
		Where("d.doc_type = ? AND d.status NOT IN (?) AND d.total_amount > COALESCE(a.paid_amount, 0)",
			"Приход", []string{"Оплачен", "Завершён"}).
		Scan(&unpaidDocuments)

	for _, d := range unpaidDocuments {
		remainingAmount := d.TotalAmount - d.PaidAmount
		if remainingAmount > 0 {
			paymentDate := d.CreatedAt.AddDate(0, 0, 30)
			events = append(events, CalendarEvent{
				Date:        paymentDate.Format("2006-01-02"),
				Title:       fmt.Sprintf("Срок оплаты %s", d.DocNumber),
				Description: fmt.Sprintf("Поставщик: %s, остаток: %.2f ₽", d.VendorName, remainingAmount),
				Type:        "deadline",
				DocumentID:  int(d.ID),
				Status:      d.Status,
			})
		}
	}

	// 2. Дедлайны по договорам (только НЕ оплаченные и НЕ завершённые)
	var contractDeadlines []struct {
		ID           uint       `json:"id"`
		DocNumber    string     `json:"doc_number"`
		DeadlineDate *time.Time `json:"deadline_date"`
		TotalAmount  float64    `json:"total_amount"`
		VendorName   string     `json:"vendor_name"`
		Status       string     `json:"status"`
	}

	database.DB.Table("documents d").
		Select("d.id, d.doc_number, d.deadline_date, d.total_amount, v.company_name as vendor_name, d.status").
		Joins("LEFT JOIN vendors v ON d.vendor_id = v.id").
		Where("d.deadline_date IS NOT NULL AND d.deadline_date BETWEEN ? AND ? AND d.doc_type IN (?) AND d.status NOT IN (?)",
			dateFrom, dateTo, []string{"Договор", "Контракт"}, []string{"Оплачен", "Завершён", "Исполнен"}).
		Scan(&contractDeadlines)

	for _, d := range contractDeadlines {
		if d.DeadlineDate != nil {
			events = append(events, CalendarEvent{
				Date:        d.DeadlineDate.Format("2006-01-02"),
				Title:       fmt.Sprintf("Срок выполнения %s", d.DocNumber),
				Description: fmt.Sprintf("Поставщик: %s, сумма: %.2f ₽", d.VendorName, d.TotalAmount),
				Type:        "deadline",
				DocumentID:  int(d.ID),
				Status:      d.Status,
			})
		}
	}

	// 3. Планируемые поставки (только активные договоры)
	var pendingDeliveries []struct {
		ID           uint       `json:"id"`
		DocNumber    string     `json:"doc_number"`
		DeliveryDate *time.Time `json:"delivery_date"`
		TotalAmount  float64    `json:"total_amount"`
		VendorName   string     `json:"vendor_name"`
		Status       string     `json:"status"`
	}

	database.DB.Table("documents d").
		Select("d.id, d.doc_number, d.delivery_date, d.total_amount, v.company_name as vendor_name, d.status").
		Joins("LEFT JOIN vendors v ON d.vendor_id = v.id").
		Where("d.delivery_date IS NOT NULL AND d.delivery_date BETWEEN ? AND ? AND d.doc_type IN (?) AND d.status NOT IN (?)",
			dateFrom, dateTo, []string{"Договор", "Контракт"}, []string{"Оплачен", "Завершён", "Исполнен", "Отменён"}).
		Scan(&pendingDeliveries)

	for _, d := range pendingDeliveries {
		if d.DeliveryDate != nil {
			events = append(events, CalendarEvent{
				Date:        d.DeliveryDate.Format("2006-01-02"),
				Title:       fmt.Sprintf("Ожидается поставка %s", d.DocNumber),
				Description: fmt.Sprintf("Поставщик: %s, сумма: %.2f ₽", d.VendorName, d.TotalAmount),
				Type:        "delivery",
				DocumentID:  int(d.ID),
				Status:      d.Status,
			})
		}
	}

	// 4. Дни с минимальным остатком на складе
	var lowStockDates []struct {
		ProductName string    `json:"product_name"`
		Quantity    float64   `json:"quantity"`
		MinStock    int       `json:"min_stock"`
		Date        time.Time `json:"date"`
	}

	database.DB.Table("storages s").
		Select("p.name as product_name, s.quantity, p.min_stock, s.updated_at as date").
		Joins("LEFT JOIN products p ON s.product_id = p.id").
		Where("s.quantity < p.min_stock AND p.min_stock > 0").
		Scan(&lowStockDates)

	for _, d := range lowStockDates {
		events = append(events, CalendarEvent{
			Date:        d.Date.Format("2006-01-02"),
			Title:       fmt.Sprintf("Низкий остаток: %s", d.ProductName),
			Description: fmt.Sprintf("Остаток: %.2f, минимальный: %d", d.Quantity, d.MinStock),
			Type:        "deadline",
		})
	}

	// Сортируем события по дате
	sort.Slice(events, func(i, j int) bool {
		return events[i].Date < events[j].Date
	})

	c.JSON(http.StatusOK, gin.H{"events": events})
}

// GetPurchasedProducts - детальная информация по товарам на складе
func GetPurchasedProducts(c *gin.Context) {

	// Для детальной информации по складу даты не используем - показываем текущее состояние
	type StockProduct struct {
		ProductID       int        `json:"product_id"`
		ProductName     string     `json:"product_name"`
		ProductArticle  string     `json:"product_article"`
		Unit            string     `json:"unit"`
		Quantity        float64    `json:"total_quantity"`
		MinStock        int        `json:"min_stock"`
		LastReceiptDate *time.Time `json:"last_receipt_date"`
	}

	var products []StockProduct

	database.DB.Table("storages s").
		Select(`
			s.product_id,
			p.name as product_name,
			p.article as product_article,
			p.unit,
			s.quantity as total_quantity,
			p.min_stock,
			s.last_receipt_date
		`).
		Joins("LEFT JOIN products p ON s.product_id = p.id").
		Where("s.quantity > 0").
		Order("s.quantity DESC").
		Scan(&products)

	c.JSON(http.StatusOK, gin.H{"products": products})
}

// GetPurchaseCostDetail - детальная информация по документам прихода
func GetPurchaseCostDetail(c *gin.Context) {
	dateFrom := c.Query("date_from")
	dateTo := c.Query("date_to")

	if dateFrom == "" {
		dateFrom = time.Now().AddDate(0, -1, 0).Format("2006-01-02")
	}
	if dateTo == "" {
		dateTo = time.Now().Format("2006-01-02")
	}

	type ReceiptDocument struct {
		ID          uint      `json:"id"`
		DocNumber   string    `json:"doc_number"`
		DocDate     string    `json:"doc_date"`
		VendorName  string    `json:"vendor_name"`
		TotalAmount float64   `json:"total_amount"`
		Status      string    `json:"status"`
		CreatedAt   time.Time `json:"created_at"`
		PaidAmount  float64   `json:"paid_amount"`
		Remaining   float64   `json:"remaining"`
	}

	var documents []ReceiptDocument

	database.DB.Table("documents d").
		Select(`
			d.id,
			d.doc_number,
			d.doc_date,
			v.company_name as vendor_name,
			d.total_amount,
			d.status,
			d.created_at,
			COALESCE(a.paid_amount, 0) as paid_amount,
			(d.total_amount - COALESCE(a.paid_amount, 0)) as remaining
		`).
		Joins("LEFT JOIN vendors v ON d.vendor_id = v.id").
		Joins("LEFT JOIN (SELECT document_id, SUM(amount) as paid_amount FROM accountings WHERE operation_type = 'Оплата' GROUP BY document_id) a ON d.id = a.document_id").
		Where("d.created_at BETWEEN ? AND ? AND d.doc_type = ?",
			dateFrom, dateTo+" 23:59:59", "Приход").
		Order("d.created_at DESC").
		Scan(&documents)

	c.JSON(http.StatusOK, gin.H{"documents": documents})
}


// GetAccountsPayableDetail - детальная информация по кредиторской задолженности
func GetAccountsPayableDetail(c *gin.Context) {
	type AccountDetail struct {
		ID           uint       `json:"id"`
		DocNumber    string     `json:"doc_number"`
		DocDate      string     `json:"doc_date"`
		VendorName   string     `json:"vendor_name"`
		TotalAmount  float64    `json:"total_amount"`
		PaidAmount   float64    `json:"paid_amount"`
		Remaining    float64    `json:"remaining"`
		DeadlineDate *time.Time `json:"deadline_date"`
		Status       string     `json:"status"`
	}

	var accounts []AccountDetail

	// Получаем документы прихода с остатком задолженности
	database.DB.Table("documents d").
		Select(`
			d.id,
			d.doc_number,
			d.doc_date,
			v.company_name as vendor_name,
			d.total_amount,
			COALESCE(a.paid_amount, 0) as paid_amount,
			(d.total_amount - COALESCE(a.paid_amount, 0)) as remaining,
			d.deadline_date,
			d.status
		`).
		Joins("LEFT JOIN vendors v ON d.vendor_id = v.id").
		Joins("LEFT JOIN (SELECT document_id, SUM(amount) as paid_amount FROM accountings WHERE operation_type = 'Оплата' GROUP BY document_id) a ON d.id = a.document_id").
		Where("d.doc_type = ? AND d.status NOT IN (?)", "Приход", []string{"Оплачен", "Завершён"}).
		Having("remaining > 0").
		Order("d.deadline_date ASC NULLS LAST").
		Scan(&accounts)

	c.JSON(http.StatusOK, gin.H{"accounts": accounts})
}

// GetReportsProductStats - статистика по товарам (оставлен для возможного расширения)
func GetReportsProductStats(c *gin.Context) {
	dateFrom := c.Query("date_from")
	dateTo := c.Query("date_to")

	if dateFrom == "" {
		dateFrom = time.Now().AddDate(0, -1, 0).Format("2006-01-02")
	}
	if dateTo == "" {
		dateTo = time.Now().Format("2006-01-02")
	}

	type ProductStat struct {
		ProductID     int     `json:"product_id"`
		ProductName   string  `json:"product_name"`
		TotalQuantity float64 `json:"total_quantity"`
		TotalAmount   float64 `json:"total_amount"`
		AveragePrice  float64 `json:"average_price"`
		OrderCount    int64   `json:"order_count"`
	}

	var stats []ProductStat

	query := database.DB.Table("document_items di").
		Select(`
			di.product_id,
			p.name as product_name,
			COALESCE(SUM(di.quantity), 0) as total_quantity,
			COALESCE(SUM(di.quantity * di.price), 0) as total_amount,
			COALESCE(AVG(di.price), 0) as average_price,
			COUNT(DISTINCT di.document_id) as order_count
		`).
		Joins("LEFT JOIN products p ON di.product_id = p.id").
		Joins("LEFT JOIN documents d ON di.document_id = d.id").
		Where("d.created_at BETWEEN ? AND ? AND d.doc_type = ?", dateFrom, dateTo+" 23:59:59", "Приход").
		Group("di.product_id, p.name").
		Order("total_amount DESC")

	if err := query.Scan(&stats).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get product statistics"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"product_stats": stats})
}

// GetReportsVendorStats - статистика по поставщикам (оставлен для возможного расширения)
func GetReportsVendorStats(c *gin.Context) {
	dateFrom := c.Query("date_from")
	dateTo := c.Query("date_to")

	if dateFrom == "" {
		dateFrom = time.Now().AddDate(0, -1, 0).Format("2006-01-02")
	}
	if dateTo == "" {
		dateTo = time.Now().Format("2006-01-02")
	}

	type VendorStat struct {
		VendorID        int     `json:"vendor_id"`
		CompanyName     string  `json:"company_name"`
		TotalAmount     float64 `json:"total_amount"`
		PaidAmount      float64 `json:"paid_amount"`
		RemainingAmount float64 `json:"remaining_amount"`
		ClaimsCount     int64   `json:"claims_count"`
	}

	var stats []VendorStat

	query := database.DB.Table("vendors v").
		Select(`
			v.id as vendor_id,
			v.company_name,
			COALESCE(SUM(d.total_amount), 0) as total_amount,
			COALESCE(SUM(a.paid_amount), 0) as paid_amount,
			COALESCE(SUM(d.total_amount), 0) - COALESCE(SUM(a.paid_amount), 0) as remaining_amount,
			COALESCE(SUM(CASE WHEN d.doc_type = 'Претензия' THEN 1 ELSE 0 END), 0) as claims_count
		`).
		Joins("LEFT JOIN documents d ON v.id = d.vendor_id AND d.doc_type IN (?) AND d.created_at BETWEEN ? AND ?",
			[]string{"Приход", "Претензия"}, dateFrom, dateTo+" 23:59:59").
		Joins("LEFT JOIN (SELECT document_id, SUM(amount) as paid_amount FROM accountings WHERE operation_type = 'Оплата' GROUP BY document_id) a ON d.id = a.document_id").
		Group("v.id, v.company_name").
		Order("total_amount DESC")

	if err := query.Scan(&stats).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get vendor statistics"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"vendor_stats": stats})
}
