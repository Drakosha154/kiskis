package routes

import (
	"net/http"
	"time"

	"kiskis/database"
	"kiskis/models"

	"github.com/gin-gonic/gin"
)

func CreateClaimReport(c *gin.Context) {
	var input struct {
		DocumentID  int    `json:"document_id" binding:"required"`
		Marriage    bool   `json:"marriage"`
		Deadline    bool   `json:"deadline"`
		Quantity    bool   `json:"quantity"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных: " + err.Error()})
		return
	}

	// Проверяем, что хотя бы один чекбокс выбран
	if !input.Marriage && !input.Deadline && !input.Quantity {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Необходимо выбрать хотя бы один тип претензии"})
		return
	}

	// Проверяем существование документа
	var document models.Documents
	if err := database.DB.First(&document, input.DocumentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Документ не найден"})
		return
	}

	claimReport := models.ClaimReport{
		DocumentID:  input.DocumentID,
		Marriage:    input.Marriage,
		Deadline:    input.Deadline,
		Quantity:    input.Quantity,
		CreatedAt:   time.Now(),

	}

	if err := database.DB.Create(&claimReport).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось создать претензию: " + err.Error()})
		return
	}

	// Обновляем статус документа, если нужно
	if document.Status != "Принят с претензиями" {
		document.Status = "Принят с претензиями"
		database.DB.Save(&document)
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Претензия успешно создана",
		"claim":   claimReport,
	})
}

func GetClaimsByDocument(c *gin.Context) {
	documentID := c.Param("document_id")

	var claims []models.ClaimReport
	if err := database.DB.Where("document_id = ?", documentID).Order("created_at DESC").Find(&claims).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось получить претензии"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"claims": claims})
}

func GetAllClaims(c *gin.Context) {
	var claims []models.ClaimReport
	if err := database.DB.Preload("Document").Order("created_at DESC").Find(&claims).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось получить претензии"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"claims": claims})
}

func UpdateClaimStatus(c *gin.Context) {
	id := c.Param("id")

	var input struct {
		Status     string     `json:"status"`
		Marriage   bool       `json:"marriage"`
		Deadline   bool       `json:"deadline"`
		Quantity   bool       `json:"quantity"`
		ResolvedAt *time.Time `json:"resolved_at"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var claim models.ClaimReport
	if err := database.DB.Where("id = ?", id).First(&claim).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Претензия не найдена"})
		return
	}

	// Обновляем поля
	if input.Marriage != claim.Marriage {
		claim.Marriage = input.Marriage
	}
	if input.Deadline != claim.Deadline {
		claim.Deadline = input.Deadline
	}
	if input.Quantity != claim.Quantity {
		claim.Quantity = input.Quantity
	}

	if err := database.DB.Save(&claim).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось обновить претензию"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Претензия успешно обновлена",
		"claim":   claim,
	})
}

func GetClaimsStats(c *gin.Context) {
	var stats struct {
		TotalClaims    int64 `json:"total_claims"`
		ActiveClaims   int64 `json:"active_claims"`
		ResolvedClaims int64 `json:"resolved_claims"`
		MarriageCount  int64 `json:"marriage_count"`
		DeadlineCount  int64 `json:"deadline_count"`
		QuantityCount  int64 `json:"quantity_count"`
	}

	// Общая статистика
	database.DB.Model(&models.ClaimReport{}).Count(&stats.TotalClaims)
	database.DB.Model(&models.ClaimReport{}).Where("status = ?", "active").Count(&stats.ActiveClaims)
	database.DB.Model(&models.ClaimReport{}).Where("status = ?", "resolved").Count(&stats.ResolvedClaims)

	// Статистика по типам претензий
	database.DB.Model(&models.ClaimReport{}).Where("marriage = ?", true).Count(&stats.MarriageCount)
	database.DB.Model(&models.ClaimReport{}).Where("deadline = ?", true).Count(&stats.DeadlineCount)
	database.DB.Model(&models.ClaimReport{}).Where("quantity = ?", true).Count(&stats.QuantityCount)

	c.JSON(http.StatusOK, gin.H{"stats": stats})
}

// Дополнительная функция для удаления претензии
func DeleteClaim(c *gin.Context) {
	id := c.Param("id")

	var claim models.ClaimReport
	if err := database.DB.Where("id = ?", id).First(&claim).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Претензия не найдена"})
		return
	}

	if err := database.DB.Delete(&claim).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось удалить претензию"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Претензия успешно удалена"})
}

// Дополнительная функция для получения деталей претензии
func GetClaimDetails(c *gin.Context) {
	id := c.Param("id")

	var claim models.ClaimReport
	if err := database.DB.Preload("Document").Preload("Document.Vendor").Where("id = ?", id).First(&claim).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Претензия не найдена"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"claim": claim})
}
