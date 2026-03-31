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

	fmt.Println(input.SelectedContract)

	// Начинаем транзакцию
	tx := database.DB.Begin()

	fmt.Println(input.SelectedContract)

	// НОВАЯ ЛОГИКА: Получаем информацию о документе для проверки условий оплаты
	var document models.Documents
	if err := tx.First(&document, input.SelectedContract).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Документ не найден"})
		return
	}

	fmt.Println(document)

	// ИСПРАВЛЕНО: Используем сумму из документа, а не пересчитываем из товаров
	// Это гарантирует, что оплата будет соответствовать договору
	totalAmount := document.Total_amount

	// ИСПРАВЛЕНО: Рассчитываем сумму к оплате с учётом уже оплаченной суммы
	// Для prepaid (100%) - amountToPay должно быть 0
	// Для partial (50%) - amountToPay должно быть 50% от totalAmount
	// Для postpaid (0%) - amountToPay должно быть 100% от totalAmount
	amountToPay := totalAmount - document.PaidAmount

	// Защита от отрицательных значений (если уже переплатили)
	if amountToPay < 0 {
		amountToPay = 0
	}

	// НОВАЯ ЛОГИКА: Проверяем достаточность средств только для оставшейся суммы
	if amountToPay > 0 {
		var money models.Money
		if err := tx.First(&money).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось получить данные о бюджете"})
			return
		}

		if money.Money < amountToPay {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{
				"error":         "Недостаточно средств для оплаты остатка по договору",
				"available":     money.Money,
				"required":      amountToPay,
				"shortage":      amountToPay - money.Money,
				"already_paid":  document.PaidAmount,
				"total_amount":  totalAmount,
				"payment_terms": document.PaymentTerms,
			})
			return
		}
	}

	results := make([]map[string]interface{}, 0)

	for _, item := range input.Items {
		var storage models.Storage
		result := tx.Where("product_id = ?", item.Product_id).First(&storage)

		oldQuantity := float64(0)
		if result.Error == nil {
			oldQuantity = storage.Quantity
			storage.Quantity += item.Quantity
			storage.Last_receipt_date = time.Now()
			storage.Last_receipt_document_id = input.Document_id
			storage.Updated_at = time.Now()

			if err := tx.Save(&storage).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update storage"})
				return
			}
		} else {
			// Создаем новую запись
			storage = models.Storage{
				Product_id:               item.Product_id,
				Quantity:                 item.Quantity,
				Last_receipt_date:        time.Now(),
				Last_receipt_document_id: input.Document_id,
				Updated_at:               time.Now(),
			}
			if err := tx.Create(&storage).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create storage record"})
				return
			}
		}

		// ИСПРАВЛЕНО: Создаем запись в accounting только если есть сумма к оплате
		// Для 100% предоплаты эта запись не создается, так как оплата уже была
		if amountToPay > 0 {
			// Рассчитываем пропорциональную часть оплаты для этого товар

			accounting := models.Accounting{
				Operation_date: time.Now(),
				Operation_type: "expense",
				Document_id:    input.Document_id,
				Supplier_id:    input.VendorID,
				Amount:         amountToPay,
				Description:    input.DocumentType,
				Created_by:     int(c.MustGet("userID").(uint)),
				Created_at:     time.Now(),
			}

			if err := tx.Create(&accounting).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create accounting record"})
				return
			}
		}

		results = append(results, map[string]interface{}{
			"product_id":   item.Product_id,
			"old_quantity": oldQuantity,
			"new_quantity": storage.Quantity,
			"added":        item.Quantity,
			"cost":         item.Quantity * item.Price,
		})
	}

	// ИЗМЕНЕНО: Обновляем таблицу money только если есть сумма к оплате
	if amountToPay > 0 {
		if err := tx.Exec("UPDATE money SET money = money - ?", amountToPay).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update money"})
			return
		}
	}

	// НОВАЯ ЛОГИКА: Обновляем paid_amount и payment_status в документе
	newPaymentStatus := "fully_paid"

	if err := tx.Model(&document).Updates(map[string]interface{}{
		"paid_amount":    amountToPay,
		"payment_status": newPaymentStatus,
	}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update document payment status"})
		return
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
		"total_amount":   totalAmount,
		"amount_paid":    amountToPay,
		"already_paid":   document.PaidAmount,
		"new_paid_total": amountToPay,
		"money_left":     finalMoney.Money,
		"payment_status": newPaymentStatus,
		"payment_terms":  document.PaymentTerms,
	})
}
