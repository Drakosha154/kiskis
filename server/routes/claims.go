package routes

import (
	"net/http"
	"strconv"
	"time"

	"kiskis/database"
	"kiskis/models"

	"github.com/gin-gonic/gin"
)

// CreateClaim - создание претензии к поставщику
func CreateClaim(c *gin.Context) {
	userID := c.MustGet("userID").(uint)

	var input struct {
		DocumentID  int     `json:"document_id" binding:"required"`
		ClaimType   string  `json:"claim_type" binding:"required,oneof=defect shortage delay mismatch"`
		Description string  `json:"description" binding:"required"`
		Amount      float64 `json:"amount"`
		Items       []struct {
			ProductID   int     `json:"product_id" binding:"required"`
			Quantity    float64 `json:"quantity" binding:"required,gt=0"`
			Price       float64 `json:"price"`
			IssueType   string  `json:"issue_type" binding:"required,oneof=defect shortage damage"`
			Description string  `json:"description"`
		} `json:"items"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Получаем документ прихода
	var document models.Documents
	if err := database.DB.First(&document, input.DocumentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Document not found"})
		return
	}

	// Проверяем, что это документ прихода
	if document.Doc_type != "Приход" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Claims can only be created for receipt documents"})
		return
	}

	// Генерируем номер претензии
	claimNumber := "CLM-" + time.Now().Format("20060102") + "-" + strconv.Itoa(input.DocumentID)

	// Создаём претензию
	claim := models.Claim{
		ClaimNumber: claimNumber,
		DocumentID:  input.DocumentID,
		VendorID:    document.Vendor_id,
		ClaimDate:   time.Now(),
		ClaimType:   input.ClaimType,
		Description: input.Description,
		Amount:      input.Amount,
		Status:      "Новая",
		CreatedBy:   userID,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	// Начинаем транзакцию
	tx := database.DB.Begin()

	if err := tx.Create(&claim).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create claim"})
		return
	}

	// Создаём позиции претензии
	var totalAmount float64
	for _, item := range input.Items {
		claimItem := models.ClaimItem{
			ClaimID:     int(claim.ID),
			ProductID:   item.ProductID,
			Quantity:    item.Quantity,
			Price:       item.Price,
			Amount:      item.Quantity * item.Price,
			IssueType:   item.IssueType,
			Description: item.Description,
			CreatedAt:   time.Now(),
		}
		totalAmount += claimItem.Amount

		if err := tx.Create(&claimItem).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create claim items"})
			return
		}
	}

	// Обновляем сумму претензии, если не была передана
	if input.Amount == 0 {
		claim.Amount = totalAmount
		if err := tx.Model(&claim).Update("amount", totalAmount).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update claim amount"})
			return
		}
	}

	// Обновляем описание документа прихода, добавляя информацию о претензии
	updatedDescription := document.Description + "\n\n--- ПРЕТЕНЗИЯ ---\n" +
		"Номер: " + claimNumber + "\n" +
		"Тип: " + getClaimTypeText(input.ClaimType) + "\n" +
		"Сумма: " + formatMoney(input.Amount) + "\n" +
		"Описание: " + input.Description

	if err := tx.Model(&document).Update("description", updatedDescription).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update document description"})
		return
	}

	tx.Commit()

	c.JSON(http.StatusCreated, gin.H{
		"message":      "Claim created successfully",
		"claim":        claim,
		"claim_number": claimNumber,
	})
}

// GetClaimsByDocument - получение претензий по документу
func GetClaimsByDocument(c *gin.Context) {
	documentID := c.Param("document_id")
	id, err := strconv.Atoi(documentID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid document ID"})
		return
	}

	type ClaimResponse struct {
		models.Claim
		VendorName   string               `json:"vendor_name"`
		DocumentNumber string             `json:"document_number"`
		Items        []models.ClaimItem   `json:"items"`
	}

	var claims []ClaimResponse

	// Получаем претензии
	if err := database.DB.Table("claims").
		Select("claims.*, v.company_name as vendor_name, d.doc_number as document_number").
		Joins("LEFT JOIN vendors v ON claims.vendor_id = v.id").
		Joins("LEFT JOIN documents d ON claims.document_id = d.id").
		Where("claims.document_id = ?", id).
		Order("claims.created_at DESC").
		Scan(&claims).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch claims"})
		return
	}

	// Получаем позиции для каждой претензии
	for i := range claims {
		var items []models.ClaimItem
		database.DB.Where("claim_id = ?", claims[i].ID).Find(&items)
		claims[i].Items = items
	}

	c.JSON(http.StatusOK, gin.H{"claims": claims})
}

// GetAllClaims - получение всех претензий (с фильтрацией)
func GetAllClaims(c *gin.Context) {
	dateFrom := c.Query("date_from")
	dateTo := c.Query("date_to")
	status := c.Query("status")
	claimType := c.Query("claim_type")

	type ClaimResponse struct {
		models.Claim
		VendorName     string `json:"vendor_name"`
		DocumentNumber string `json:"document_number"`
	}

	query := database.DB.Table("claims").
		Select("claims.*, v.company_name as vendor_name, d.doc_number as document_number").
		Joins("LEFT JOIN vendors v ON claims.vendor_id = v.id").
		Joins("LEFT JOIN documents d ON claims.document_id = d.id")

	if dateFrom != "" && dateTo != "" {
		query = query.Where("claims.created_at BETWEEN ? AND ?", dateFrom, dateTo+" 23:59:59")
	}
	if status != "" {
		query = query.Where("claims.status = ?", status)
	}
	if claimType != "" {
		query = query.Where("claims.claim_type = ?", claimType)
	}

	var claims []ClaimResponse
	if err := query.Order("claims.created_at DESC").Scan(&claims).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch claims"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"claims": claims})
}

// UpdateClaimStatus - обновление статуса претензии
func UpdateClaimStatus(c *gin.Context) {
	claimID := c.Param("id")
	id, err := strconv.Atoi(claimID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid claim ID"})
		return
	}

	var input struct {
		Status     string `json:"status" binding:"required,oneof=Новая В работе Удовлетворена Отклонена"`
		Resolution string `json:"resolution"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var claim models.Claim
	if err := database.DB.First(&claim, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Claim not found"})
		return
	}

	updates := map[string]interface{}{
		"status":     input.Status,
		"resolution": input.Resolution,
		"updated_at": time.Now(),
	}

	if input.Status == "Удовлетворена" || input.Status == "Отклонена" {
		resolvedAt := time.Now()
		updates["resolved_at"] = resolvedAt
	}

	if err := database.DB.Model(&claim).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update claim status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Claim status updated",
		"claim":   claim,
	})
}

// GetClaimsStats - статистика по претензиям для отчётов
func GetClaimsStats(c *gin.Context) {
	dateFrom := c.Query("date_from")
	dateTo := c.Query("date_to")

	if dateFrom == "" {
		dateFrom = time.Now().AddDate(0, -1, 0).Format("2006-01-02")
	}
	if dateTo == "" {
		dateTo = time.Now().Format("2006-01-02")
	}

	type ClaimsStats struct {
		TotalCount     int64   `json:"total_count"`
		TotalAmount    float64 `json:"total_amount"`
		ByType         map[string]int64 `json:"by_type"`
		ByStatus       map[string]int64 `json:"by_status"`
		ByVendor       []struct {
			VendorID   int     `json:"vendor_id"`
			VendorName string  `json:"vendor_name"`
			Count      int64   `json:"count"`
			Amount     float64 `json:"amount"`
		} `json:"by_vendor"`
	}

	var stats ClaimsStats
	stats.ByType = make(map[string]int64)
	stats.ByStatus = make(map[string]int64)

	// Общее количество и сумма
	database.DB.Table("claims").
		Where("created_at BETWEEN ? AND ?", dateFrom, dateTo+" 23:59:59").
		Select("COALESCE(COUNT(*), 0) as total_count, COALESCE(SUM(amount), 0) as total_amount").
		Scan(&stats)

	// Статистика по типам
	var typeStats []struct {
		ClaimType string
		Count     int64
	}
	database.DB.Table("claims").
		Select("claim_type, COUNT(*) as count").
		Where("created_at BETWEEN ? AND ?", dateFrom, dateTo+" 23:59:59").
		Group("claim_type").
		Scan(&typeStats)
	for _, ts := range typeStats {
		stats.ByType[ts.ClaimType] = ts.Count
	}

	// Статистика по статусам
	var statusStats []struct {
		Status string
		Count  int64
	}
	database.DB.Table("claims").
		Select("status, COUNT(*) as count").
		Where("created_at BETWEEN ? AND ?", dateFrom, dateTo+" 23:59:59").
		Group("status").
		Scan(&statusStats)
	for _, ss := range statusStats {
		stats.ByStatus[ss.Status] = ss.Count
	}

	// Статистика по поставщикам
	database.DB.Table("claims c").
		Select("c.vendor_id, v.company_name as vendor_name, COUNT(*) as count, COALESCE(SUM(c.amount), 0) as amount").
		Joins("LEFT JOIN vendors v ON c.vendor_id = v.id").
		Where("c.created_at BETWEEN ? AND ?", dateFrom, dateTo+" 23:59:59").
		Group("c.vendor_id, v.company_name").
		Order("count DESC").
		Scan(&stats.ByVendor)

	c.JSON(http.StatusOK, gin.H{"stats": stats})
}

// Helper functions
func getClaimTypeText(claimType string) string {
	switch claimType {
	case "defect":
		return "Брак"
	case "shortage":
		return "Недопоставка"
	case "delay":
		return "Просрочка"
	case "mismatch":
		return "Несоответствие"
	default:
		return claimType
	}
}

func formatMoney(amount float64) string {
	return strconv.FormatFloat(amount, 'f', 2, 64) + " ₽"
}