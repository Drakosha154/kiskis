package routes

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"kiskis/database"
	"kiskis/models"

	"github.com/gin-gonic/gin"
)

func NewProducts(c *gin.Context) {

	var input struct {
		Article     string `json:"article" binding:"required"`
		Name        string `json:"name" binding:"required"`
		Description string `json:"description" binding:"required"`
		Unit        string `json:"unit" binding:"required"`
		Category    string `json:"category" binding:"required"`
		Min_stock   int    `json:"min_stock" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	product := models.Products{
		Article:     input.Article,
		Name:        input.Name,
		Description: input.Description,
		Unit:        input.Unit,
		Category:    input.Category,
		Min_stock:   input.Min_stock,
		Created_at:  time.Now(),
	}

	// Сохраняем поставщика в БД
	if err := database.DB.Create(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create products"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Products registered successfully",
		"product": product, // Добавляем созданный товар в ответ
	})

}

func GetProducts(c *gin.Context) {

	var products []models.Products
	result := database.DB.
		Select("*").
		Order("created_at DESC").
		Find(&products)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get products"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"products": products})
}

func DelProductByID(c *gin.Context) {

	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	var product models.Products
	if err := database.DB.Where("id = ?", id).First(&product).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	if err := database.DB.Delete(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete product record"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Product record deleted successfully",
		"id":      id,
	})
}

func UpdProductByID(c *gin.Context) {

	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid products ID"})
		return
	}

	var input struct {
		Article     string `json:"article" binding:"required"`
		Name        string `json:"name" binding:"required"`
		Description string `json:"description" binding:"required"`
		Unit        string `json:"unit" binding:"required"`
		Category    string `json:"category" binding:"required"`
		Min_stock   int    `json:"min_stock" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid requests body"})
		return
	}

	var product models.Products
	if err := database.DB.Where("id = ?", id).First(&product).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found or access denied"})
		return
	}

	updates := models.Products{
		Article:     input.Article,
		Name:        input.Name,
		Description: input.Description,
		Unit:        input.Unit,
		Category:    input.Category,
		Min_stock:   input.Min_stock,
	}

	if err := database.DB.Model(&product).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update product"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Product updated successfully",
		"id":      id,
		"data":    updates,
	})
}

func NewVendorProduct(c *gin.Context) {

	var input struct {
		Vendor_id int `json:"vendor_id" binding:"required"`
		Products  []struct {
			Product_id    int     `json:"product_id" binding:"required"`
			Vendor_price  float64 `json:"vendor_price" binding:"required,gt=0"`
			Currency      string  `json:"currency" binding:"omitempty,len=3"`
			Delivery_days int     `json:"delivery_days" binding:"omitempty,min=0"`
		} `json:"products" binding:"required,min=1,dive"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid requests body"})
		return
	}

	var vendor models.Vendor
	// Проверка существования поставщика
	if err := database.DB.Where("id = ?", input.Vendor_id).First(&vendor).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Поставщик не найден"})
		return
	}

	for _, p := range input.Products {
		var product models.Products
		// Проверка существования товара
		fmt.Println(p.Product_id)
		if err := database.DB.Where("id = ?", p.Product_id).First(&product).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Продукт не найден"})
			return
		}

		VendorProducts := models.Vendor_Products{
			Vendor_id:     input.Vendor_id,
			Product_id:    p.Product_id,
			Vendor_price:  p.Vendor_price,
			Currency:      p.Currency,
			Delivery_days: p.Delivery_days,
		}

		// Сохраняем товар и поставщика в БД
		if err := database.DB.Create(&VendorProducts).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create VendorProducts"})
			return
		}
	}

	c.JSON(http.StatusCreated, gin.H{"message": "VendorProducts registered successfully"})

}

func GetVendorProduct(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid products ID"})
		return
	}

	type VendorProductResponse struct {
		ID              uint      `json:"id"`
		Vendor_id       int       `json:"vendor_id"`
		Product_id      int       `json:"product_id"`
		Product_name    string    `json:"product_name"`
		Product_article string    `json:"product_article"`
		Vendor_price    float64   `json:"vendor_price"`
		Currency        string    `json:"currency"`
		Delivery_days   int       `json:"delivery_days"`
		Updated_at      time.Time `json:"updated_at"`
	}

	var results []VendorProductResponse

	query := database.DB.Table("vendor_products").
		Select(`vendor_products.*, 
                products.name as product_name, 
                products.article as product_article`).
		Joins("LEFT JOIN products ON vendor_products.product_id = products.id")

	query = query.Where("vendor_products.vendor_id = ?", id)

	if err := query.Scan(&results).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not fetch vendor products"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"vendorProducts": results})
}

func DelVendorProductByID(c *gin.Context) {

	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid vendorProducts ID"})
		return
	}

	var vendorProducts models.Vendor_Products
	if err := database.DB.Where("id = ?", id).First(&vendorProducts).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "vendorProducts not found"})
		return
	}

	if err := database.DB.Delete(&vendorProducts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete vendorProducts record"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "vendorProducts record deleted successfully",
		"id":      id,
	})
}

func GetVendorProductForContract(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid products ID"})
		return
	}

	type VendorProductResponse struct {
		ID            uint      `json:"id"`
		Vendor_id     int       `json:"vendor_id"`
		Company_name  string    `json:"company_name"`
		Product_id    int       `json:"product_id"`
		Vendor_price  float64   `json:"vendor_price"`
		Currency      string    `json:"currency"`
		Delivery_days int       `json:"delivery_days"`
		Updated_at    time.Time `json:"updated_at"`
	}

	var results []VendorProductResponse

	query := database.DB.Table("vendor_products").
		Select(`vendor_products.*, vendors.*`).
		Joins("Left join vendors on vendor_products.vendor_id = vendors.id")

	query = query.Where("vendor_products.product_id = ?", id)

	if err := query.Scan(&results).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not fetch vendor products"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"vendorProducts": results})
}
