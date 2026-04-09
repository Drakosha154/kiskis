package routes

import (
	"fmt"
	"net/http"
	"strconv"

	"kiskis/database"
	"kiskis/models"

	"github.com/gin-gonic/gin"
)

// Получить все ячейки склада
func GetWarehouseLocations(c *gin.Context) {
	type LocationWithProduct struct {
		models.WarehouseLocation
		ProductName    string `json:"product_name"`
		ProductArticle string `json:"product_article"`
	}

	var locations []LocationWithProduct

	result := database.DB.
		Table("warehouse_locations").
		Select(`warehouse_locations.*, 
                products.name as product_name, 
                products.article as product_article`).
		Joins("LEFT JOIN products ON products.id = warehouse_locations.product_id").
		Order("warehouse_locations.rack ASC, warehouse_locations.shelf ASC, warehouse_locations.cell ASC").
		Scan(&locations)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch warehouse locations"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"locations": locations})
}

// Получить доступные (свободные) ячейки
func GetAvailableLocations(c *gin.Context) {
	var locations []models.WarehouseLocation

	result := database.DB.
		Where("is_available = ? AND (occupied < capacity OR occupied = 0)", true).
		Order("rack ASC, shelf ASC, cell ASC").
		Find(&locations)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch available locations"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"locations": locations})
}

// Предложить оптимальное место для товара
func SuggestLocation(c *gin.Context) {
	productIDStr := c.Param("product_id")
	quantityStr := c.Query("quantity")

	productID, err := strconv.Atoi(productIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	quantity := 1.0
	if quantityStr != "" {
		if q, err := strconv.ParseFloat(quantityStr, 64); err == nil {
			quantity = q
		}
	}

	// Сначала ищем ячейки, где уже размещен этот товар
	var existingLocations []models.WarehouseLocation
	database.DB.
		Where("product_id = ? AND is_available = ? AND (capacity - occupied) >= ?", productID, true, quantity).
		Order("occupied DESC").
		Limit(3).
		Find(&existingLocations)

	if len(existingLocations) > 0 {
		c.JSON(http.StatusOK, gin.H{
			"suggested_locations": existingLocations,
			"reason":              "same_product",
		})
		return
	}

	// Если нет, ищем полностью свободные ячейки
	var emptyLocations []models.WarehouseLocation
	database.DB.
		Where("product_id IS NULL AND is_available = ? AND capacity >= ?", true, quantity).
		Order("rack ASC, shelf ASC, cell ASC").
		Limit(5).
		Find(&emptyLocations)

	c.JSON(http.StatusOK, gin.H{
		"suggested_locations": emptyLocations,
		"reason":              "empty_cells",
	})
}

// Создать новую ячейку
func CreateWarehouseLocation(c *gin.Context) {
	var input struct {
		Rack     string  `json:"rack" binding:"required"`
		Shelf    int     `json:"shelf" binding:"required"`
		Cell     int     `json:"cell" binding:"required"`
		Capacity float64 `json:"capacity"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	locationCode := fmt.Sprintf("%s-%d-%d", input.Rack, input.Shelf, input.Cell)

	capacity := input.Capacity
	if capacity == 0 {
		capacity = 100
	}

	location := models.WarehouseLocation{
		Rack:         input.Rack,
		Shelf:        input.Shelf,
		Cell:         input.Cell,
		LocationCode: locationCode,
		Capacity:     capacity,
		Occupied:     0,
		IsAvailable:  true,
	}

	if err := database.DB.Create(&location).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create location"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"location": location})
}

// Обновить ячейку
func UpdateWarehouseLocation(c *gin.Context) {
	id := c.Param("id")

	var location models.WarehouseLocation
	if err := database.DB.First(&location, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Location not found"})
		return
	}

	var input struct {
		Capacity    *float64 `json:"capacity"`
		IsAvailable *bool    `json:"is_available"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.Capacity != nil {
		location.Capacity = *input.Capacity
	}
	if input.IsAvailable != nil {
		location.IsAvailable = *input.IsAvailable
	}

	if err := database.DB.Save(&location).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update location"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"location": location})
}

// Удалить ячейку
func DeleteWarehouseLocation(c *gin.Context) {
	id := c.Param("id")

	var location models.WarehouseLocation
	if err := database.DB.First(&location, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Location not found"})
		return
	}

	if location.Occupied > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete occupied location"})
		return
	}

	if err := database.DB.Delete(&location).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete location"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Location deleted successfully"})
}

// Получить статистику склада
func GetWarehouseStats(c *gin.Context) {
	var stats struct {
		TotalLocations     int64   `json:"total_locations"`
		OccupiedLocations  int64   `json:"occupied_locations"`
		AvailableLocations int64   `json:"available_locations"`
		TotalCapacity      float64 `json:"total_capacity"`
		TotalOccupied      float64 `json:"total_occupied"`
		OccupancyPercent   float64 `json:"occupancy_percent"`
	}

	database.DB.Model(&models.WarehouseLocation{}).Count(&stats.TotalLocations)
	database.DB.Model(&models.WarehouseLocation{}).Where("occupied > 0").Count(&stats.OccupiedLocations)
	database.DB.Model(&models.WarehouseLocation{}).Where("is_available = ?", true).Count(&stats.AvailableLocations)

	database.DB.Model(&models.WarehouseLocation{}).Select("COALESCE(SUM(capacity), 0)").Scan(&stats.TotalCapacity)
	database.DB.Model(&models.WarehouseLocation{}).Select("COALESCE(SUM(occupied), 0)").Scan(&stats.TotalOccupied)

	if stats.TotalCapacity > 0 {
		stats.OccupancyPercent = (stats.TotalOccupied / stats.TotalCapacity) * 100
	}

	c.JSON(http.StatusOK, stats)
}