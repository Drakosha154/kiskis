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

// Получение остатков всех товаров на складе
func GetStorage(c *gin.Context) {
	type StorageResponse struct {
		models.Storage
		ProductName    string  `json:"product_name"`
		ProductArticle string  `json:"product_article"`
		ProductUnit    string  `json:"product_unit"`
		ProductPrice   float64 `json:"product_price"` // Если нужно
	}

	var storage []StorageResponse

	result := database.DB.
		Table("storages").
		Select(`storages.*, 
                products.name as product_name, 
                products.article as product_article, 
                products.unit as product_unit`).
		Joins("LEFT JOIN products ON products.id = storages.product_id").
		Order("products.name ASC").
		Scan(&storage)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch storage"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"storage": storage})
}

// Получение остатка конкретного товара
func GetProductStorage(c *gin.Context) {
	Product_id := c.Param("product_id")

	id, err := strconv.Atoi(Product_id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	var storage models.Storage
	result := database.DB.Where("product_id = ?", id).First(&storage)

	if result.Error != nil {
		// Если записи нет, возвращаем нулевой остаток
		c.JSON(http.StatusOK, gin.H{
			"product_id": id,
			"quantity":   0,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"product_id": id,
		"quantity":   storage.Quantity,
		"updated_at": storage.Updated_at,
	})
}

// Обновление остатка товара (приход/расход)
func UpdateStorage(c *gin.Context) {
	var input struct {
		Product_id   int     `json:"product_id" binding:"required"`
		Quantity     float64 `json:"quantity" binding:"required"`
		Operation    string  `json:"operation" binding:"required,oneof=income expense writeoff"`
		Document_id  int     `json:"document_id"`
		DocumentType string  `json:"document_type"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Начинаем транзакцию
	tx := database.DB.Begin()

	// Ищем запись на складе
	var storage models.Storage
	result := tx.Where("product_id = ?", input.Product_id).First(&storage)

	if result.Error != nil {
		// Если записи нет, создаем новую
		storage = models.Storage{
			Product_id: input.Product_id,
			Quantity:   0,
		}
	}

	var operat = "income"

	// Обновляем количество
	oldQuantity := storage.Quantity
	switch input.Operation {
	case "income":
		storage.Quantity += input.Quantity
	case "expense", "writeoff":
		if storage.Quantity < input.Quantity {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{
				"error":      "Insufficient stock",
				"product_id": input.Product_id,
				"current":    storage.Quantity,
				"requested":  input.Quantity,
			})
			return
		}
		storage.Quantity -= input.Quantity
	}

	// Если это приход, обновляем дату последнего поступления
	if input.Operation == "income" {
		operat = "expense"
		storage.Last_receipt_date = time.Now()
		storage.Last_receipt_document_id = input.Document_id
	}

	storage.Updated_at = time.Now()

	// Сохраняем изменения
	if result.Error != nil {
		// Создаем новую запись
		if err := tx.Create(&storage).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create storage record"})
			return
		}
	} else {
		// Обновляем существующую
		if err := tx.Save(&storage).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update storage record"})
			return
		}
	}

	// Создаем запись в accounting (для бухгалтерии)
	accounting := models.Accounting{
		Operation_date: time.Now(),
		Operation_type: operat,
		Document_id:    input.Document_id,
		Supplier_id:    0,              // Нужно получить из документа
		Amount:         input.Quantity, // Здесь должна быть сумма, нужно получать цену
		Description:    input.DocumentType,
		Created_by:     int(c.MustGet("userID").(uint)),
		Created_at:     time.Now(),
	}

	tx.Create(&accounting)

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"message":      "Storage updated successfully",
		"product_id":   input.Product_id,
		"old_quantity": oldQuantity,
		"new_quantity": storage.Quantity,
		"operation":    input.Operation,
	})
}

// Массовое обновление остатков (для приёмки)
func BulkUpdateStorage(c *gin.Context) {
	var input struct {
		Items []struct {
			Product_id int     `json:"product_id"`
			Quantity   float64 `json:"quantity"`
			Price      float64 `json:"price"`
			LocationID *int    `json:"location_id"`
		} `json:"items" binding:"required,min=1,dive"`
		Document_id      int    `json:"document_id"`
		DocumentType     string `json:"document_type"`
		VendorID         int    `json:"vendor_id"`
		SelectedContract int    `json:"selected_contract_id"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// НОВОЕ: Проверка max_stock для каждого товара
	warnings := []map[string]interface{}{}
	for _, item := range input.Items {
		var product models.Products
		if err := database.DB.First(&product, item.Product_id).Error; err != nil {
			continue
		}

		// Получаем текущий остаток
		var storage models.Storage
		currentQuantity := 0.0
		if err := database.DB.Where("product_id = ?", item.Product_id).First(&storage).Error; err == nil {
			currentQuantity = storage.Quantity
		}

		// Проверяем превышение max_stock
		if product.Max_stock > 0 {
			newQuantity := currentQuantity + item.Quantity
			if newQuantity > float64(product.Max_stock) {
				warnings = append(warnings, map[string]interface{}{
					"product_id":       item.Product_id,
					"product_name":     product.Name,
					"current_stock":    currentQuantity,
					"receiving":        item.Quantity,
					"new_stock":        newQuantity,
					"max_stock":        product.Max_stock,
					"excess":           newQuantity - float64(product.Max_stock),
					"occupancy_percent": (newQuantity / float64(product.Max_stock)) * 100,
				})
			}
		}
	}

	// Если есть предупреждения, возвращаем их (фронтенд должен запросить подтверждение)
	forceConfirm := c.Query("force_confirm")
	if len(warnings) > 0 && forceConfirm != "true" {
		c.JSON(http.StatusOK, gin.H{
			"warnings":        warnings,
			"requires_confirm": true,
			"message":         "Некоторые товары превысят максимальный лимит. Подтвердите приемку.",
		})
		return
	}

	fmt.Println(input.SelectedContract)

	// Начинаем транзакцию
	tx := database.DB.Begin()

	fmt.Println(input.SelectedContract)

	// Получаем информацию о документе для проверки условий оплаты
var document models.Documents
if err := tx.First(&document, input.SelectedContract).Error; err != nil {
    tx.Rollback()
    c.JSON(http.StatusNotFound, gin.H{"error": "Документ не найден"})
    return
}

// Проверяем, можно ли принимать товар по этому договору
// в зависимости от условий оплаты и текущего статуса оплаты
canReceive := false
var errorMessage string

switch document.PaymentTerms {
case "prepaid":
    // Для 100% предоплаты требуется полная оплата
    if document.PaymentStatus == "fully_paid" {
        canReceive = true
    } else {
        errorMessage = "Для приёмки товара по договору с предоплатой требуется полная оплата договора"
    }
case "partial":
    // Для 50/50 требуется оплата минимум 50%
    requiredAmount := document.Total_amount * 0.5
    if document.PaidAmount >= requiredAmount {
        canReceive = true
    } else {
        errorMessage = fmt.Sprintf("Для приёмки товара требуется оплатить минимум 50%% (%.2f руб.). Оплачено: %.2f руб.", 
            requiredAmount, document.PaidAmount)
    }
case "postpaid":
    // Для постоплаты приёмка доступна всегда
    canReceive = true
default:
    errorMessage = "Неизвестные условия оплаты"
}

if !canReceive {
    tx.Rollback()
    c.JSON(http.StatusBadRequest, gin.H{
        "error":          errorMessage,
        "payment_terms":  document.PaymentTerms,
        "total_amount":   document.Total_amount,
        "paid_amount":    document.PaidAmount,
        "payment_status": document.PaymentStatus,
    })
    return
}

	results := make([]map[string]interface{}, 0)

	for _, item := range input.Items {
	// 1. Обновить общее количество в Storage
	var storage models.Storage
	result := tx.Where("product_id = ?", item.Product_id).First(&storage)

	oldQuantity := float64(0)
	if result.Error == nil {
		oldQuantity = storage.Quantity
		storage.Quantity += item.Quantity
		storage.Last_receipt_date = time.Now()
		storage.Last_receipt_document_id = input.Document_id
		storage.Updated_at = time.Now()
		tx.Save(&storage)
	} else {
		// Создать новую запись в Storage
		storage = models.Storage{
			Product_id:               item.Product_id,
			Quantity:                 item.Quantity,
			Last_receipt_date:        time.Now(),
			Last_receipt_document_id: input.Document_id,
			Updated_at:               time.Now(),
		}
		tx.Create(&storage)
	}

	// 2. Обновить ячейку склада (если указана)
	if item.LocationID != nil {
		var location models.WarehouseLocation
		if err := tx.First(&location, *item.LocationID).Error; err == nil {

			// ПРОВЕРКА: Ячейка занята другим товаром?
			if location.ProductID != nil && *location.ProductID != item.Product_id {
				tx.Rollback()
				c.JSON(http.StatusBadRequest, gin.H{
					"error": fmt.Sprintf("Ячейка %s уже занята другим товаром (ID: %d)",
						location.LocationCode, *location.ProductID),
					"location_code": location.LocationCode,
					"occupied_by":   *location.ProductID,
				})
				return
			}

			// ПРОВЕРКА: Достаточно ли места в ячейке?
			availableSpace := location.Capacity - location.Occupied
			if item.Quantity > availableSpace {
				tx.Rollback()
				c.JSON(http.StatusBadRequest, gin.H{
					"error": fmt.Sprintf("Недостаточно места в ячейке %s. Доступно: %.2f, требуется: %.2f",
						location.LocationCode, availableSpace, item.Quantity),
					"location_code": location.LocationCode,
					"available":     availableSpace,
					"requested":     item.Quantity,
				})
				return
			}

			// Обновить ячейку
			location.Occupied += item.Quantity
			if location.ProductID == nil {
				location.ProductID = &item.Product_id
			}
			tx.Save(&location)

			// 3. Создать или обновить запись в ProductLocationMapping
			var mapping models.ProductLocationMapping
			mappingResult := tx.Where("product_id = ? AND location_id = ?",
				item.Product_id, *item.LocationID).First(&mapping)

			if mappingResult.Error == nil {
				// Обновить существующую
				mapping.Quantity += item.Quantity
				mapping.UpdatedAt = time.Now()
				tx.Save(&mapping)
			} else {
				// Создать новую
				mapping = models.ProductLocationMapping{
					ProductID:  item.Product_id,
					LocationID: *item.LocationID,
					Quantity:   item.Quantity,
					CreatedAt:  time.Now(),
					UpdatedAt:  time.Now(),
				}
				tx.Create(&mapping)
			}

			// Получить location_code для результата
			results = append(results, map[string]interface{}{
				"product_id":    item.Product_id,
				"old_quantity":  oldQuantity,
				"new_quantity":  storage.Quantity,
				"added":         item.Quantity,
				"cost":          item.Quantity * item.Price,
				"location_code": location.LocationCode,
			})
		} else {
			tx.Rollback()
			c.JSON(http.StatusNotFound, gin.H{"error": "Ячейка склада не найдена"})
			return
		}
	} else {
		// Если локация не указана
		results = append(results, map[string]interface{}{
			"product_id":    item.Product_id,
			"old_quantity":  oldQuantity,
			"new_quantity":  storage.Quantity,
			"added":         item.Quantity,
			"cost":          item.Quantity * item.Price,
			"location_code": "",
		})
	}
}

	// Фиксируем транзакцию
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	// Получаем обновлённый баланс
	var finalMoney models.Money
	database.DB.First(&finalMoney)

	c.JSON(http.StatusOK, gin.H{
    	"message":        "Bulk storage update completed",
    	"results":        results,
    	"payment_terms":  document.PaymentTerms,
    	"payment_status": document.PaymentStatus,
    	"warnings":       warnings,
	})
}
