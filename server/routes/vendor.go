package routes

import (
	"net/http"
	"strconv"
	"time"

	"kiskis/database"
	"kiskis/models"

	"github.com/gin-gonic/gin"
)

func NewVendor(c *gin.Context) {
	var input struct {
		Company_name    string `json:"company_name" binding:"required"`
		Contact_person  string `json:"contact_person" binding:"required"`
		Phone           string `json:"phone" binding:"required"`
		Email           string `json:"email" binding:"required"`
		Address         string `json:"address" binding:"required"`
		Inn             string `json:"inn" binding:"required"`
		Kpp             string `json:"kpp" binding:"required"`
		Payment_account string `json:"payment_account" binding:"required"`
		Bank_name       string `json:"bank_name" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	vendor := models.Vendor{
		Company_name:    input.Company_name,
		Contact_person:  input.Contact_person,
		Phone:           input.Phone,
		Email:           input.Email,
		Address:         input.Address,
		Inn:             input.Inn,
		Kpp:             input.Kpp,
		Payment_account: input.Payment_account,
		Bank_name:       input.Bank_name,
		Created_at:      time.Now(),
	}
	// Сохраняем поставщика в БД
	if err := database.DB.Create(&vendor).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create vendor"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Vendor registered successfully"})

}

func GetVendor(c *gin.Context) {

	var vendor []models.Vendor
	result := database.DB.
		Select("*").
		Order("created_at DESC").
		Find(&vendor)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get vendors"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"vendor": vendor})
}

func DelVendorByID(c *gin.Context) {

	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid vendor ID"})
		return
	}

	var vendor models.Vendor
	if err := database.DB.Where("id = ?", id).First(&vendor).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Vendor not found"})
		return
	}

	if err := database.DB.Delete(&vendor).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete vendor record"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Vendor record deleted successfully",
		"id":      id,
	})
}

func UpdVendorByID(c *gin.Context) {

	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid vendor ID"})
		return
	}

	var input struct {
		Company_name    string `json:"company_name"`
		Contact_person  string `json:"contact_person"`
		Phone           string `json:"phone"`
		Email           string `json:"email"`
		Address         string `json:"address"`
		Inn             string `json:"inn"`
		Kpp             string `json:"kpp"`
		Payment_account string `json:"payment_account"`
		Bank_name       string `json:"bank_name"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	var vendor models.Vendor
	if err := database.DB.Where("id = ?", id).First(&vendor).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Vendor not found or access denied"})
		return
	}

	updates := models.Vendor{
		Company_name:    input.Company_name,
		Contact_person:  input.Contact_person,
		Phone:           input.Phone,
		Email:           input.Email,
		Address:         input.Address,
		Inn:             input.Inn,
		Kpp:             input.Kpp,
		Payment_account: input.Payment_account,
		Bank_name:       input.Bank_name,
	}

	if err := database.DB.Model(&vendor).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update vendor"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Vendor updated successfully",
		"id":      id,
		"data":    updates,
	})
}
