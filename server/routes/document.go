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
		Doc_date     string  `json:"doc_date"`
		Vendor_id    int     `json:"vendor_id" binding:"required"`
		Status       string  `json:"status" binding:"required"`
		Total_amount float64 `json:"total_amount" binding:"required"`
		Description  string  `json:"description" binding:"required"`
		DeliveryDate *string `json:"delivery_date"`
		DeadlineDate *string `json:"deadline_date"`
		DeliveryDays *int    `json:"delivery_days"`
		PaymentTerms string  `json:"payment_terms"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Парсим дату документа
	var docDate time.Time
	var err error

	if input.Doc_date != "" {
		docDate, err = time.Parse("2006-01-02", input.Doc_date)
		if err != nil {
			// Если не удалось распарсить, используем текущую дату
			docDate = time.Now()
		}
	} else {
		docDate = time.Now()
	}

	// 1. DeliveryDate - дата поставки
	var deliveryDate *time.Time
	if input.DeliveryDate != nil && *input.DeliveryDate != "" {
		// Если передана конкретная дата поставки, используем её
		parsedDate, err := time.Parse("2006-01-02", *input.DeliveryDate)
		if err == nil {
			deliveryDate = &parsedDate
		}
	}

	// 2. DeadlineDate - дедлайн (срок оплаты/исполнения)
	var deadlineDate *time.Time
	if input.DeadlineDate != nil && *input.DeadlineDate != "" {
		// Если передан конкретный дедлайн, используем его
		parsedDate, err := time.Parse("2006-01-02", *input.DeadlineDate)
		if err == nil {
			deadlineDate = &parsedDate
		}
	}

	// Если дедлайн не задан, ставим 30 дней от даты документа
	if deadlineDate == nil {
		defaultDeadline := docDate.AddDate(0, 0, 30)
		deadlineDate = &defaultDeadline
	}

	// 3. DeliveryDays - срок поставки в днях (рассчитываем автоматически)
	var deliveryDays *int
	if input.DeliveryDays != nil && *input.DeliveryDays > 0 {
		// Если передан явно, используем переданное значение
		deliveryDays = input.DeliveryDays
	} else if deliveryDate != nil {
		// Рассчитываем как разницу между датой поставки и датой документа
		days := int(deliveryDate.Sub(docDate).Hours() / 24)
		if days >= 0 {
			deliveryDays = &days
		}
	}

	// Если всё ещё не задано, ставим значение по умолчанию
	if deliveryDays == nil {
		defaultDays := 7
		deliveryDays = &defaultDays
	}

	// Рассчитываем сумму предоплаты и статус оплаты
	var prepaymentAmount float64 = 0
	var paymentStatus string = "unpaid"

	if input.PaymentTerms == "prepaid" {
		prepaymentAmount = input.Total_amount
		paymentStatus = "fully_paid"
	} else if input.PaymentTerms == "partial" {
		prepaymentAmount = input.Total_amount * 0.5
		paymentStatus = "partially_paid"
	}

	// Если требуется предоплата, проверяем достаточность средств
	if prepaymentAmount > 0 {
		var money models.Money
		if err := database.DB.First(&money).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось получить данные о бюджете"})
			return
		}

		if money.Money < prepaymentAmount {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":     "Недостаточно средств в бюджете для предоплаты",
				"available": money.Money,
				"required":  prepaymentAmount,
				"shortage":  prepaymentAmount - money.Money,
			})
			return
		}
	}

	document := models.Documents{
		Doc_number:    input.Doc_number,
		Doc_type:      input.Doc_type,
		Doc_date:      docDate.Format("2006-01-02"),
		Vendor_id:     input.Vendor_id,
		User_id:       userID,
		Status:        input.Status,
		Total_amount:  input.Total_amount,
		Description:   input.Description,
		Created_at:    time.Now(),
		DeliveryDate:  deliveryDate,
		DeadlineDate:  deadlineDate,
		DeliveryDays:  deliveryDays,
		PaymentTerms:  input.PaymentTerms,
		PaidAmount:    prepaymentAmount,
		PaymentStatus: paymentStatus,
	}

	// Начинаем транзакцию для атомарности операций
	tx := database.DB.Begin()

	// Сохраняем документ в БД
	if err := tx.Create(&document).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось создать документ"})
		return
	}

	// Обработка предоплаты
	if prepaymentAmount > 0 {
		// Списываем средства из бюджета
		if err := tx.Exec("UPDATE money SET money = money - ?", prepaymentAmount).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось списать средства из бюджета"})
			return
		}

		// Создаём запись в бухгалтерии
		var paymentDescription string
		if input.PaymentTerms == "prepaid" {
			paymentDescription = "Предоплата 100% по договору " + document.Doc_number
		} else {
			paymentDescription = "Предоплата 50% по договору " + document.Doc_number
		}

		accounting := models.Accounting{
			Operation_date: time.Now(),
			Operation_type: "expense",
			Document_id:    int(document.ID),
			Supplier_id:    input.Vendor_id,
			Amount:         prepaymentAmount,
			Vat_amount:     0,
			Description:    paymentDescription,
			Created_by:     int(userID),
			Created_at:     time.Now(),
		}

		if err := tx.Create(&accounting).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось создать запись в бухгалтерии"})
			return
		}
	}

	// Фиксируем транзакцию
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось завершить транзакцию"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":        "Документ успешно создан",
		"id":             document.ID,
		"doc_number":     document.Doc_number,
		"delivery_date":  document.DeliveryDate,
		"deadline_date":  document.DeadlineDate,
		"delivery_days":  document.DeliveryDays,
		"payment_terms":  document.PaymentTerms,
		"paid_amount":    prepaymentAmount,
		"payment_status": document.PaymentStatus,
	})
}

func GetDocuments(c *gin.Context) {
	// Создаем структуру для расширенного ответа с названиями
	type DocumentResponse struct {
		models.Documents
		VendorName string `json:"vendor_name"`
		UserName   string `json:"user_name"`
	}

	var documents []DocumentResponse

	// Выполняем запрос с JOIN для получения названий
	result := database.DB.
		Table("documents").
		Select("documents.*, vendors.company_name as vendor_name, users.full_name as user_name").
		Joins("LEFT JOIN vendors ON vendors.id = documents.vendor_id").
		Joins("LEFT JOIN users ON users.id = documents.user_id").
		Order("documents.created_at DESC").
		Scan(&documents)

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
		Doc_number         string  `json:"doc_number" binding:"required"`
		Doc_type           string  `json:"doc_type" binding:"required"`
		Doc_date           string  `json:"doc_date"`
		Vendor_id          int     `json:"vendor_id" binding:"required"`
		Status             string  `json:"status" binding:"required"`
		Total_amount       float64 `json:"total_amount" binding:"required"`
		Description        string  `json:"description" binding:"required"`
		DeliveryDate       *string `json:"delivery_date"`
		DeadlineDate       *string `json:"deadline_date"`
		DeliveryDays       *int    `json:"delivery_days"`
		ActualDeliveryDate *string `json:"actual_delivery_date"`
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

	// Парсим дату документа для пересчёта сроков
	docDate, _ := time.Parse("2006-01-02", input.Doc_date)
	if input.Doc_date == "" {
		docDate, _ = time.Parse("2006-01-02", document.Doc_date)
	}

	// Подготавливаем обновления
	updates := models.Documents{
		Doc_number:   input.Doc_number,
		Doc_type:     input.Doc_type,
		Doc_date:     input.Doc_date,
		Vendor_id:    input.Vendor_id,
		User_id:      userID,
		Status:       input.Status,
		Total_amount: input.Total_amount,
		Description:  input.Description,
	}

	// Обновляем DeliveryDate если передана
	if input.DeliveryDate != nil && *input.DeliveryDate != "" {
		parsedDate, err := time.Parse("2006-01-02", *input.DeliveryDate)
		if err == nil {
			updates.DeliveryDate = &parsedDate
		}
	} else if input.DeliveryDate != nil && *input.DeliveryDate == "" {
		// Если передана пустая строка, оставляем как есть
		updates.DeliveryDate = document.DeliveryDate
	}

	// Обновляем DeadlineDate если передана
	if input.DeadlineDate != nil && *input.DeadlineDate != "" {
		parsedDate, err := time.Parse("2006-01-02", *input.DeadlineDate)
		if err == nil {
			updates.DeadlineDate = &parsedDate
		}
	} else if input.DeadlineDate != nil && *input.DeadlineDate == "" {
		updates.DeadlineDate = document.DeadlineDate
	}

	// Обновляем DeliveryDays если передан
	if input.DeliveryDays != nil {
		updates.DeliveryDays = input.DeliveryDays
	} else if updates.DeliveryDate != nil {
		// Пересчитываем на основе новой даты поставки
		days := int(updates.DeliveryDate.Sub(docDate).Hours() / 24)
		if days >= 0 {
			updates.DeliveryDays = &days
		}
	}

	// Обновляем фактическую дату поставки
	if input.ActualDeliveryDate != nil {
		if *input.ActualDeliveryDate != "" {
			parsedDate, err := time.Parse("2006-01-02", *input.ActualDeliveryDate)
			if err == nil {
				updates.ActualDeliveryDate = &parsedDate
			}
		} else {
			updates.ActualDeliveryDate = nil
		}
	}

	if err := database.DB.Model(&document).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update document"})
		return
	}

	// Получаем обновлённый документ
	var updatedDocument models.Documents
	database.DB.First(&updatedDocument, id)

	c.JSON(http.StatusOK, gin.H{
		"message": "Document updated successfully",
		"id":      id,
		"data":    updatedDocument,
	})
}

// Вспомогательная функция для обновления статуса документа на основе фактической даты поставки
func UpdateDocumentStatusOnDelivery(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid document ID"})
		return
	}

	var input struct {
		ActualDeliveryDate string `json:"actual_delivery_date" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var document models.Documents
	if err := database.DB.First(&document, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Document not found"})
		return
	}

	parsedDate, err := time.Parse("2006-01-02", input.ActualDeliveryDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format"})
		return
	}

	updates := map[string]interface{}{
		"actual_delivery_date": parsedDate,
	}

	// Проверяем, была ли поставка вовремя
	if document.DeliveryDate != nil {
		if parsedDate.Before(*document.DeliveryDate) || parsedDate.Equal(*document.DeliveryDate) {
			updates["status"] = "Выполнен вовремя"
		} else {
			updates["status"] = "Просрочен"
		}
	} else {
		updates["status"] = "Выполнен"
	}

	if err := database.DB.Model(&document).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update document"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Delivery status updated successfully",
		"id":      id,
		"status":  updates["status"],
	})
}

// Функция для автоматического обновления статусов просроченных документов (можно вызывать по расписанию)
func UpdateOverdueDocuments(c *gin.Context) {
	today := time.Now()

	// Находим все документы с истекшим дедлайном, которые ещё не завершены
	var overdueDocuments []models.Documents
	database.DB.
		Where("deadline_date IS NOT NULL AND deadline_date < ? AND status NOT IN (?)",
			today, []string{"Завершён", "Оплачен", "Просрочен"}).
		Find(&overdueDocuments)

	for _, doc := range overdueDocuments {
		database.DB.Model(&doc).Update("status", "Просрочен")
	}

	// Находим документы с истекшей датой поставки
	var overdueDeliveries []models.Documents
	database.DB.
		Where("delivery_date IS NOT NULL AND delivery_date < ? AND actual_delivery_date IS NULL AND status NOT IN (?)",
			today, []string{"Просрочен", "Завершён"}).
		Find(&overdueDeliveries)

	for _, doc := range overdueDeliveries {
		database.DB.Model(&doc).Update("status", "Просрочена поставка")
	}

	c.JSON(http.StatusOK, gin.H{
		"message":            "Overdue documents updated",
		"overdue_documents":  len(overdueDocuments),
		"overdue_deliveries": len(overdueDeliveries),
	})
}

type DocumentItemInput struct {
	DocumentID int     `json:"document_id" binding:"required"`
	ProductID  int     `json:"product_id" binding:"required"`
	Quantity   float64 `json:"quantity" binding:"required,gt=0"`
	Price      float64 `json:"price" binding:"required,gt=0"`
	VatRate    float64 `json:"vat_rate"`
}

func NewDocumentProduct(c *gin.Context) {

	var input struct {
		DocumentID int                 `json:"document_id" binding:"required"`
		Items      []DocumentItemInput `json:"items" binding:"required,min=1,dive"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Проверяем существование документа
	var document models.Documents
	if err := database.DB.First(&document, input.DocumentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Document not found"})
		return
	}

	// Начинаем транзакцию
	tx := database.DB.Begin()

	// Создаем все товары документа
	for _, item := range input.Items {
		// Проверяем существование продукта
		var product models.Products
		if err := database.DB.First(&product, item.ProductID).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
			return
		}

		documentItem := models.Document_Items{
			DocumentID: item.DocumentID,
			ProductID:  item.ProductID,
			Quantity:   item.Quantity,
			Price:      item.Price,
			VatRate:    item.VatRate,
			CreatedAt:  time.Now(),
		}

		if err := tx.Create(&documentItem).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create document items"})
			return
		}
	}

	tx.Commit()

	// Пересчитываем общую сумму документа
	var total float64
	database.DB.
		Table("document_items").
		Where("document_id = ?", input.DocumentID).
		Select("COALESCE(SUM(quantity * price), 0)").
		Scan(&total)

	database.DB.Model(&document).Update("total_amount", total)

	c.JSON(http.StatusCreated, gin.H{
		"message":     "Document items created successfully",
		"document_id": input.DocumentID,
		"items_count": len(input.Items),
		"total":       total,
	})
}

// Получение товаров документа с данными о продуктах
func GetDocumentProducts(c *gin.Context) {
	documentID := c.Param("id")

	id, err := strconv.Atoi(documentID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid document ID"})
		return
	}

	type DocumentItemResponse struct {
		ID             uint    `json:"id"`
		DocumentID     int     `json:"document_id"`
		ProductID      int     `json:"product_id"`
		ProductName    string  `json:"product_name"`
		ProductArticle string  `json:"product_article"`
		Unit           string  `json:"unit"`
		Quantity       float64 `json:"quantity"`
		Price          float64 `json:"price"`
		Amount         float64 `json:"amount"`
		VatRate        float64 `json:"vat_rate"`
	}

	var items []DocumentItemResponse

	// Выполняем запрос с JOIN для получения данных о продуктах
	result := database.DB.
		Table("document_items").
		Select(`document_items.id, 
                document_items.document_id,
                document_items.product_id,
                products.name as product_name,
                products.article as product_article,
                products.unit,
                document_items.quantity,
                document_items.price,
                document_items.vat_rate,
                (document_items.quantity * document_items.price) as amount`).
		Joins("LEFT JOIN products ON products.id = document_items.product_id").
		Where("document_items.document_id = ?", id).
		Order("document_items.id ASC").
		Scan(&items)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch document items"})
		return
	}

	// Подсчитываем общую сумму
	var total float64
	for _, item := range items {
		total += item.Amount
	}

	c.JSON(http.StatusOK, gin.H{
		"document_id": id,
		"items":       items,
		"total":       total,
	})
}

// Получение товаров для нескольких документов (для склада)
func GetMultipleDocumentsProducts(c *gin.Context) {
	var input struct {
		DocumentIDs []int `json:"document_ids" binding:"required,min=1,dive"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	type DocumentItemResponse struct {
		ID             uint    `json:"id"`
		DocumentID     int     `json:"document_id"`
		ProductID      int     `json:"product_id"`
		ProductName    string  `json:"product_name"`
		ProductArticle string  `json:"product_article"`
		Unit           string  `json:"unit"`
		Quantity       float64 `json:"quantity"`
		Price          float64 `json:"price"`
		Amount         float64 `json:"amount"`
		VatRate        float64 `json:"vat_rate"`
	}

	var items []DocumentItemResponse

	// Выполняем запрос с JOIN для нескольких документов
	result := database.DB.
		Table("document_items").
		Select(`document_items.id, 
                document_items.document_id,
                document_items.product_id,
                products.name as product_name,
                products.article as product_article,
                products.unit,
                document_items.quantity,
                document_items.price,
                document_items.vat_rate,
                (document_items.quantity * document_items.price) as amount`).
		Joins("LEFT JOIN products ON products.id = document_items.product_id").
		Where("document_items.document_id IN (?)", input.DocumentIDs).
		Order("document_items.document_id, document_items.id ASC").
		Scan(&items)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch document items"})
		return
	}

	// Группируем товары по документам
	groupedItems := make(map[int][]DocumentItemResponse)
	documentTotals := make(map[int]float64)

	for _, item := range items {
		groupedItems[item.DocumentID] = append(groupedItems[item.DocumentID], item)
		documentTotals[item.DocumentID] += item.Amount
	}

	c.JSON(http.StatusOK, gin.H{
		"items_by_document": groupedItems,
		"totals":            documentTotals,
	})
}

// Обновление товара документа
func UpdateDocumentProduct(c *gin.Context) {
	itemID := c.Param("item_id")

	id, err := strconv.Atoi(itemID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid item ID"})
		return
	}

	var input DocumentItemInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var item models.Document_Items
	if err := database.DB.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Document item not found"})
		return
	}

	updates := map[string]interface{}{
		"quantity": input.Quantity,
		"price":    input.Price,
		"vat_rate": input.VatRate,
	}

	if err := database.DB.Model(&item).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update document item"})
		return
	}

	// Пересчитываем общую сумму документа
	var total float64
	database.DB.
		Table("document_items").
		Where("document_id = ?", item.DocumentID).
		Select("COALESCE(SUM(quantity * price), 0)").
		Scan(&total)

	database.DB.Model(&models.Documents{}).Where("id = ?", item.DocumentID).Update("total_amount", total)

	// Получаем обновленный товар с данными о продукте
	type DocumentItemResponse struct {
		ID             uint    `json:"id"`
		DocumentID     int     `json:"document_id"`
		ProductID      int     `json:"product_id"`
		ProductName    string  `json:"product_name"`
		ProductArticle string  `json:"product_article"`
		Unit           string  `json:"unit"`
		Quantity       float64 `json:"quantity"`
		Price          float64 `json:"price"`
		Amount         float64 `json:"amount"`
		VatRate        float64 `json:"vat_rate"`
	}

	var updatedItem DocumentItemResponse

	database.DB.
		Table("document_items").
		Select(`document_items.id, 
                document_items.document_id,
                document_items.product_id,
                products.name as product_name,
                products.article as product_article,
                products.unit,
                document_items.quantity,
                document_items.price,
                document_items.vat_rate,
                (document_items.quantity * document_items.price) as amount`).
		Joins("LEFT JOIN products ON products.id = document_items.product_id").
		Where("document_items.id = ?", id).
		Scan(&updatedItem)

	c.JSON(http.StatusOK, gin.H{
		"message": "Document item updated successfully",
		"item":    updatedItem,
		"total":   total,
	})
}

// Удаление товара документа
func DeleteDocumentProduct(c *gin.Context) {
	itemID := c.Param("item_id")

	id, err := strconv.Atoi(itemID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid item ID"})
		return
	}

	var item models.Document_Items
	if err := database.DB.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Document item not found"})
		return
	}

	documentID := item.DocumentID

	if err := database.DB.Delete(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete document item"})
		return
	}

	// Пересчитываем общую сумму документа
	var total float64
	database.DB.
		Table("document_items").
		Where("document_id = ?", documentID).
		Select("COALESCE(SUM(quantity * price), 0)").
		Scan(&total)

	database.DB.Model(&models.Documents{}).Where("id = ?", documentID).Update("total_amount", total)

	c.JSON(http.StatusOK, gin.H{
		"message": "Document item deleted successfully",
		"id":      id,
		"total":   total,
	})
}
