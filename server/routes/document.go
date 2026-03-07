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
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	document := models.Documents{
		Doc_number:   input.Doc_number,
		Doc_type:     input.Doc_type,
		Doc_date:     input.Doc_date,
		Vendor_id:    input.Vendor_id,
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

	c.JSON(http.StatusCreated, gin.H{
		"message":    "Documents registered successfully",
		"id":         document.ID,
		"doc_number": document.Doc_number,
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
		Doc_number   string  `json:"doc_number" binding:"required"`
		Doc_type     string  `json:"doc_type" binding:"required"`
		Doc_date     string  `json:"doc_date"`
		Vendor_id    int     `json:"vendor_id" binding:"required"`
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
		Doc_date:     input.Doc_date,
		Vendor_id:    input.Vendor_id,
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

	c.JSON(http.StatusCreated, gin.H{
		"message":     "Document items created successfully",
		"document_id": input.DocumentID,
		"items_count": len(input.Items),
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

	if err := database.DB.Delete(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete document item"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Document item deleted successfully",
		"id":      id,
	})
}
