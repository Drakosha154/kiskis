package routes

import (
	"kiskis/database"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// ─── Модели ───────────────────────────────────────────────────────────────

type KPIRecord struct {
	ID                   int       `json:"id" db:"id"`
	PeriodDate           string    `json:"period_date" db:"period_date"`
	PeriodType           string    `json:"period_type" db:"period_type"`
	TotalPurchasesAmount float64   `json:"total_purchases_amount" db:"total_purchases_amount"`
	AvgDeliveryDays      float64   `json:"avg_delivery_days" db:"avg_delivery_days"`
	SupplierCount        int       `json:"supplier_count" db:"supplier_count"`
	StockTurnover        float64   `json:"stock_turnover" db:"stock_turnover"`
	StockValue           float64   `json:"stock_value" db:"stock_value"`
	ShortageCount        int       `json:"shortage_count" db:"shortage_count"`
	TotalExpenses        float64   `json:"total_expenses" db:"total_expenses"`
	PaymentDelayAvg      float64   `json:"payment_delay_avg" db:"payment_delay_avg"`
	CalculatedAt         time.Time `json:"calculated_at" db:"calculated_at"`
}

// Детальная информация по объёму закупок
type PurchaseVolumeDetail struct {
	PeriodDate           string  `json:"period_date"`
	PeriodType           string  `json:"period_type"`
	TotalPurchasesAmount float64 `json:"total_purchases_amount"`
	SupplierCount        int     `json:"supplier_count"`
	StockTurnover        float64 `json:"stock_turnover"`
	ShortageCount        int     `json:"shortage_count"`
}

// Детальная информация по стоимости закупок
type PurchaseCostDetail struct {
	PeriodDate  string  `json:"period_date"`
	PeriodType  string  `json:"period_type"`
	StockValue  float64 `json:"stock_value"`
	TotalExpenses float64 `json:"total_expenses"`
	PaymentDelayAvg float64 `json:"payment_delay_avg"`
}

// Даты поставок/оплат для календаря
type CalendarEvent struct {
	Date        string  `json:"date"`
	Type        string  `json:"type"` // "delivery" | "payment"
	Amount      float64 `json:"amount"`
	Description string  `json:"description"`
}

// ─── Хендлеры ─────────────────────────────────────────────────────────────

// GET /api/kpi/summary?date_from=...&date_to=...
// Возвращает сводку KPI за период
func GetKPISummary(c *gin.Context) {
	dateFrom := c.Query("date_from")
	dateTo := c.Query("date_to")

	if dateFrom == "" {
		dateFrom = time.Now().AddDate(0, -1, 0).Format("2006-01-02")
	}
	if dateTo == "" {
		dateTo = time.Now().Format("2006-01-02")
	}

	db := database.GetDB()

	var record KPIRecord
	err := db.QueryRow(`
		SELECT 
			id, 
			TO_CHAR(period_date, 'YYYY-MM-DD'),
			period_type,
			COALESCE(total_purchases_amount, 0),
			COALESCE(avg_delivery_days, 0),
			COALESCE(supplier_count, 0),
			COALESCE(stock_turnover, 0),
			COALESCE(stock_value, 0),
			COALESCE(shortage_count, 0),
			COALESCE(total_expenses, 0),
			COALESCE(payment_delay_avg, 0),
			calculated_at
		FROM kpi
		WHERE period_date BETWEEN $1 AND $2
		ORDER BY period_date DESC
		LIMIT 1
	`, dateFrom, dateTo).Scan(
		&record.ID,
		&record.PeriodDate,
		&record.PeriodType,
		&record.TotalPurchasesAmount,
		&record.AvgDeliveryDays,
		&record.SupplierCount,
		&record.StockTurnover,
		&record.StockValue,
		&record.ShortageCount,
		&record.TotalExpenses,
		&record.PaymentDelayAvg,
		&record.CalculatedAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка получения KPI: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, record)
}

// GET /api/kpi/purchase-volume?date_from=...&date_to=...
// Детальная информация по объёму закупленного сырья
func GetPurchaseVolumeDetails(c *gin.Context) {
	dateFrom := c.Query("date_from")
	dateTo := c.Query("date_to")

	if dateFrom == "" {
		dateFrom = time.Now().AddDate(0, -6, 0).Format("2006-01-02")
	}
	if dateTo == "" {
		dateTo = time.Now().Format("2006-01-02")
	}

	db := database.GetDB()

	rows, err := db.Query(`
		SELECT 
			TO_CHAR(period_date, 'DD.MM.YYYY'),
			period_type,
			COALESCE(total_purchases_amount, 0),
			COALESCE(supplier_count, 0),
			COALESCE(stock_turnover, 0),
			COALESCE(shortage_count, 0)
		FROM kpi
		WHERE period_date BETWEEN $1 AND $2
		ORDER BY period_date DESC
	`, dateFrom, dateTo)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var details []PurchaseVolumeDetail
	for rows.Next() {
		var d PurchaseVolumeDetail
		if err := rows.Scan(
			&d.PeriodDate, &d.PeriodType,
			&d.TotalPurchasesAmount, &d.SupplierCount,
			&d.StockTurnover, &d.ShortageCount,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		details = append(details, d)
	}

	if details == nil {
		details = []PurchaseVolumeDetail{}
	}

	c.JSON(http.StatusOK, gin.H{
		"items": details,
		"total": len(details),
	})
}

// GET /api/kpi/purchase-cost?date_from=...&date_to=...
// Детальная информация по стоимости закупленного сырья
func GetPurchaseCostDetails(c *gin.Context) {
	dateFrom := c.Query("date_from")
	dateTo := c.Query("date_to")

	if dateFrom == "" {
		dateFrom = time.Now().AddDate(0, -6, 0).Format("2006-01-02")
	}
	if dateTo == "" {
		dateTo = time.Now().Format("2006-01-02")
	}

	db := database.GetDB()

	rows, err := db.Query(`
		SELECT 
			TO_CHAR(period_date, 'DD.MM.YYYY'),
			period_type,
			COALESCE(stock_value, 0),
			COALESCE(total_expenses, 0),
			COALESCE(payment_delay_avg, 0)
		FROM kpi
		WHERE period_date BETWEEN $1 AND $2
		ORDER BY period_date DESC
	`, dateFrom, dateTo)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var details []PurchaseCostDetail
	for rows.Next() {
		var d PurchaseCostDetail
		if err := rows.Scan(
			&d.PeriodDate, &d.PeriodType,
			&d.StockValue, &d.TotalExpenses,
			&d.PaymentDelayAvg,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		details = append(details, d)
	}

	if details == nil {
		details = []PurchaseCostDetail{}
	}

	c.JSON(http.StatusOK, gin.H{
		"items": details,
		"total": len(details),
	})
}

// GET /api/kpi/calendar?year=2025&month=5&type=delivery
// Возвращает события для календаря (delivery | payment)
func GetCalendarEvents(c *gin.Context) {
	year := c.DefaultQuery("year", time.Now().Format("2006"))
	month := c.DefaultQuery("month", time.Now().Format("1"))
	eventType := c.DefaultQuery("type", "delivery")

	db := database.GetDB()

	// Для delivery используем avg_delivery_days как маркер
	// Для payment используем payment_delay_avg
	var fieldName string
	var description string
	if eventType == "delivery" {
		fieldName = "avg_delivery_days"
		description = "Поставка"
	} else {
		fieldName = "payment_delay_avg"
		description = "Оплата"
	}

	query := `
		SELECT 
			TO_CHAR(period_date, 'YYYY-MM-DD'),
			` + fieldName + `,
			total_purchases_amount
		FROM kpi
		WHERE EXTRACT(YEAR FROM period_date) = $1
		  AND EXTRACT(MONTH FROM period_date) = $2
		ORDER BY period_date ASC
	`

	rows, err := db.Query(query, year, month)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var events []CalendarEvent
	for rows.Next() {
		var date string
		var days, amount float64
		if err := rows.Scan(&date, &days, &amount); err != nil {
			continue
		}
		events = append(events, CalendarEvent{
			Date:        date,
			Type:        eventType,
			Amount:      amount,
			Description: description,
		})
	}

	if events == nil {
		events = []CalendarEvent{}
	}

	c.JSON(http.StatusOK, gin.H{"events": events})
}
