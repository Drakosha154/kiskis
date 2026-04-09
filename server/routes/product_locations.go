package routes

import (
	"net/http"
	"time"

	"kiskis/database"
	"kiskis/models"

	"github.com/gin-gonic/gin"
)

// Получить все ячейки где хранится товар
func GetProductLocations(c *gin.Context) {
	productID := c.Param("product_id")

	type LocationInfo struct {
		models.ProductLocationMapping
		LocationCode string  `json:"location_code"`
		Rack         string  `json:"rack"`
		Shelf        int     `json:"shelf"`
		Cell         int     `json:"cell"`
		Capacity     float64 `json:"capacity"`
		Occupied     float64 `json:"occupied"`
	}

	var locations []LocationInfo

	result := database.DB.
		Table("product_location_mappings").
		Select(`product_location_mappings.*, 
                warehouse_locations.location_code,
                warehouse_locations.rack,
                warehouse_locations.shelf,
                warehouse_locations.cell,
                warehouse_locations.capacity,
                warehouse_locations.occupied`).
		Joins("LEFT JOIN warehouse_locations ON warehouse_locations.id = product_location_mappings.location_id").
		Where("product_location_mappings.product_id = ?", productID).
		Scan(&locations)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch product locations"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"locations": locations})
}

// Получить доступные ячейки для товара
func GetAvailableLocationsForProduct(c *gin.Context) {
	productID := c.Param("product_id")

	// Проверяем есть ли товар уже на складе
	var existingMappings []models.ProductLocationMapping
	database.DB.Where("product_id = ?", productID).Find(&existingMappings)

	var locations []models.WarehouseLocation

	if len(existingMappings) > 0 {
		// Товар уже есть - показываем ячейки с этим товаром (где есть место)
		locationIDs := []int{}
		for _, m := range existingMappings {
			locationIDs = append(locationIDs, m.LocationID)
		}

		database.DB.
			Where("id IN ? AND occupied < capacity AND is_available = true", locationIDs).
			Order("rack ASC, shelf ASC, cell ASC").
			Find(&locations)
	} else {
		// Новый товар - показываем только пустые ячейки
		database.DB.
			Where("product_id IS NULL AND is_available = true").
			Order("rack ASC, shelf ASC, cell ASC").
			Find(&locations)
	}

	c.JSON(http.StatusOK, gin.H{"locations": locations})
}

// Получить все товары в конкретной ячейке
func GetLocationProducts(c *gin.Context) {
	locationID := c.Param("location_id")

	type ProductInfo struct {
		models.ProductLocationMapping
		ProductName    string `json:"product_name"`
		ProductArticle string `json:"product_article"`
		ProductUnit    string `json:"product_unit"`
	}

	var products []ProductInfo

	result := database.DB.
		Table("product_location_mappings").
		Select(`product_location_mappings.*, 
                products.name as product_name,
                products.article as product_article,
                products.unit as product_unit`).
		Joins("LEFT JOIN products ON products.id = product_location_mappings.product_id").
		Where("product_location_mappings.location_id = ?", locationID).
		Scan(&products)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch location products"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"products": products})
}

// Переместить товар между ячейками
func MoveProductBetweenLocations(c *gin.Context) {
	var input struct {
		ProductID      int     `json:"product_id" binding:"required"`
		FromLocationID int     `json:"from_location_id" binding:"required"`
		ToLocationID   int     `json:"to_location_id" binding:"required"`
		Quantity       float64 `json:"quantity" binding:"required,gt=0"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx := database.DB.Begin()

	// 1. Проверить что товар есть в исходной ячейке
	var fromMapping models.ProductLocationMapping
	if err := tx.Where("product_id = ? AND location_id = ?", input.ProductID, input.FromLocationID).
		First(&fromMapping).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Товар не найден в исходной ячейке"})
		return
	}

	// 2. Проверить достаточно ли товара
	if fromMapping.Quantity < input.Quantity {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{
			"error":     "Недостаточно товара в исходной ячейке",
			"available": fromMapping.Quantity,
			"requested": input.Quantity,
		})
		return
	}

	// 3. Проверить целевую ячейку
	var toLocation models.WarehouseLocation
	if err := tx.First(&toLocation, input.ToLocationID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Целевая ячейка не найдена"})
		return
	}

	// 4. Проверить что целевая ячейка либо пустая, либо содержит этот же товар
	if toLocation.ProductID != nil && *toLocation.ProductID != input.ProductID {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{
			"error":       "Целевая ячейка занята другим товаром",
			"occupied_by": *toLocation.ProductID,
		})
		return
	}

	// 5. Проверить достаточно ли места в целевой ячейке
	availableSpace := toLocation.Capacity - toLocation.Occupied
	if input.Quantity > availableSpace {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{
			"error":     "Недостаточно места в целевой ячейке",
			"available": availableSpace,
			"requested": input.Quantity,
		})
		return
	}

	// 6. Обновить исходную ячейку
	var fromLocation models.WarehouseLocation
	tx.First(&fromLocation, input.FromLocationID)
	fromLocation.Occupied -= input.Quantity
	if fromLocation.Occupied <= 0 {
		fromLocation.ProductID = nil
		fromLocation.Occupied = 0
	}
	tx.Save(&fromLocation)

	// 7. Обновить mapping в исходной ячейке
	fromMapping.Quantity -= input.Quantity
	fromMapping.UpdatedAt = time.Now()
	if fromMapping.Quantity <= 0 {
		tx.Delete(&fromMapping)
	} else {
		tx.Save(&fromMapping)
	}

	// 8. Обновить целевую ячейку
	toLocation.Occupied += input.Quantity
	toLocation.ProductID = &input.ProductID
	tx.Save(&toLocation)

	// 9. Обновить или создать mapping в целевой ячейке
	var toMapping models.ProductLocationMapping
	result := tx.Where("product_id = ? AND location_id = ?", input.ProductID, input.ToLocationID).
		First(&toMapping)

	if result.Error != nil {
		// Создать новую запись
		toMapping = models.ProductLocationMapping{
			ProductID:  input.ProductID,
			LocationID: input.ToLocationID,
			Quantity:   input.Quantity,
			CreatedAt:  time.Now(),
			UpdatedAt:  time.Now(),
		}
		tx.Create(&toMapping)
	} else {
		// Обновить существующую
		toMapping.Quantity += input.Quantity
		toMapping.UpdatedAt = time.Now()
		tx.Save(&toMapping)
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"message":          "Товар успешно перемещен",
		"product_id":       input.ProductID,
		"from_location_id": input.FromLocationID,
		"to_location_id":   input.ToLocationID,
		"quantity":         input.Quantity,
	})
}
