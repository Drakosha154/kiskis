package routes

import (
	"net/http"
	"strconv"
	"time"

	"kiskis/database"
	"kiskis/models"

	"github.com/gin-gonic/gin"
)

func NewDocument(c *gin.Context) {

	userID := c.MustGet("userID").(uint) // Получаем ID пользователя из middleware
	var input struct {
		Doc_number   string  `json:"doc_number" binding:"required"`
		Doc_type     string  `json:"doc_type" binding:"required"`
		Supplier_id  int     `json:"supplier_id" binding:"required"`
		Status       string  `json:"status" binding:"required"`
		Total_amount float64 `json:"total_amount" binding:"required"`
		Description  string  `json:"description" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	document := models.Documents{
		Doc_number:   input.Doc_number,
		Doc_type:     input.Doc_type,
		Doc_date:     time.Now(),
		Supplier_id:  input.Supplier_id,
		User_id:      userID,
		Status:       input.Status,
		Total_amount: input.Total_amount,
		Description:  input.Description,
		Created_at:   time.Now(),
	}

	// Сохраняем поставщика в БД
	if err := database.DB.Create(&document).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create documents"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Documents registered successfully"})

}

func GetDocuments(c *gin.Context) {

	var documents []models.Documents
	result := database.DB.
		Select("*").
		Order("created_at DESC").
		Find(&documents)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get documents"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"documents": documents})
}

func DelDocumentByID(c *gin.Context) {

	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid documents ID"})
		return
	}

	var documents models.Documents
	if err := database.DB.Where("id = ?", id).First(&documents).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Documents not found"})
		return
	}

	if err := database.DB.Delete(&documents).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete documents record"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Documents record deleted successfully",
		"id":      id,
	})
}

func UpdDocumentByID(c *gin.Context) {

	userID := c.MustGet("userID").(uint) // Получаем ID пользователя из middleware

	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid document ID"})
		return
	}

	var input struct {
		Doc_number   string  `json:"doc_number" binding:"required"`
		Doc_type     string  `json:"doc_type" binding:"required"`
		Supplier_id  int     `json:"supplier_id" binding:"required"`
		Status       string  `json:"status" binding:"required"`
		Total_amount float64 `json:"total_amount" binding:"required"`
		Description  string  `json:"description" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid requests body"})
		return
	}

	var document models.Documents
	if err := database.DB.Where("id = ?", id).First(&document).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Document not found or access denied"})
		return
	}

	updates := models.Documents{
		Doc_number:   input.Doc_number,
		Doc_type:     input.Doc_type,
		Doc_date:     time.Now(),
		Supplier_id:  input.Supplier_id,
		User_id:      userID,
		Status:       input.Status,
		Total_amount: input.Total_amount,
		Description:  input.Description,
	}

	if err := database.DB.Model(&document).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update document"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Document updated successfully",
		"id":      id,
		"data":    updates,
	})
}
