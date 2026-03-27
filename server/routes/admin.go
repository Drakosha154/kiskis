// routes/admin.go
package routes

import (
	"net/http"
	"strconv"

	"kiskis/database"
	"kiskis/models"

	"github.com/gin-gonic/gin"
)

// GetCurrentUser - получение текущего пользователя
func GetCurrentUser(c *gin.Context) {
	userID := c.MustGet("userID").(uint)

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":        user.ID,
		"login":     user.Login,
		"full_name": user.Full_name,
		"role":      user.Role,
	})
}

// AdminGetAllUsers - получение всех пользователей (для админа)
func AdminGetAllUsers(c *gin.Context) {
	var users []models.User
	if err := database.DB.Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get users"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": users})
}

// AdminCreateUser - создание пользователя админом
func AdminCreateUser(c *gin.Context) {
	var input struct {
		Login    string `json:"login" binding:"required"`
		Password string `json:"password" binding:"required"`
		FullName string `json:"full_name" binding:"required"`
		Role     string `json:"role"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user := models.User{
		Login:     input.Login,
		Full_name: input.FullName,
		Role:      input.Role,
	}

	if err := user.HashPassword(input.Password); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not hash password"})
		return
	}

	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create user"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "User created successfully",
		"id":      user.ID,
	})
}

// AdminUpdateUser - обновление пользователя
func AdminUpdateUser(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var input struct {
		Login    string `json:"login"`
		FullName string `json:"full_name"`
		Role     string `json:"role"`
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := database.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	updates := make(map[string]interface{})
	if input.Login != "" {
		updates["login"] = input.Login
	}
	if input.FullName != "" {
		updates["full_name"] = input.FullName
	}
	if input.Role != "" {
		updates["role"] = input.Role
	}
	if input.Password != "" {
		tempUser := models.User{Password: input.Password}
		if err := tempUser.HashPassword(input.Password); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not hash password"})
			return
		}
		updates["password"] = tempUser.Password
	}

	if err := database.DB.Model(&user).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User updated successfully",
		"id":      id,
	})
}

// AdminDeleteUser - удаление пользователя
func AdminDeleteUser(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var user models.User
	if err := database.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if err := database.DB.Delete(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User deleted successfully",
		"id":      id,
	})
}

// AdminGetAllVendors - получение всех поставщиков
func AdminGetAllVendors(c *gin.Context) {
	var vendors []models.Vendor
	if err := database.DB.Find(&vendors).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get vendors"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": vendors})
}

// AdminCreateVendor - создание поставщика
func AdminCreateVendor(c *gin.Context) {
	var vendor models.Vendor
	if err := c.ShouldBindJSON(&vendor); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Create(&vendor).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create vendor"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Vendor created successfully",
		"id":      vendor.ID,
	})
}

// AdminUpdateVendor - обновление поставщика
func AdminUpdateVendor(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid vendor ID"})
		return
	}

	var vendor models.Vendor
	if err := database.DB.First(&vendor, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Vendor not found"})
		return
	}

	var updates models.Vendor
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Model(&vendor).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update vendor"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Vendor updated successfully",
		"id":      id,
	})
}

// AdminDeleteVendor - удаление поставщика
func AdminDeleteVendor(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid vendor ID"})
		return
	}

	var vendor models.Vendor
	if err := database.DB.First(&vendor, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Vendor not found"})
		return
	}

	if err := database.DB.Delete(&vendor).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete vendor"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Vendor deleted successfully",
		"id":      id,
	})
}

// AdminGetAllProducts - получение всех товаров
func AdminGetAllProducts(c *gin.Context) {
	var products []models.Products
	if err := database.DB.Find(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get products"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": products})
}

// AdminCreateProduct - создание товара
func AdminCreateProduct(c *gin.Context) {
	var product models.Products
	if err := c.ShouldBindJSON(&product); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Create(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create product"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Product created successfully",
		"id":      product.ID,
	})
}

// AdminUpdateProduct - обновление товара
func AdminUpdateProduct(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	var product models.Products
	if err := database.DB.First(&product, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	var updates models.Products
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Model(&product).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update product"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Product updated successfully",
		"id":      id,
	})
}

// AdminDeleteProduct - удаление товара
func AdminDeleteProduct(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	var product models.Products
	if err := database.DB.First(&product, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	if err := database.DB.Delete(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete product"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Product deleted successfully",
		"id":      id,
	})
}

// AdminGetAllVendorProducts - получение всех товаров поставщиков
func AdminGetAllVendorProducts(c *gin.Context) {
	var vendorProducts []models.Vendor_Products
	if err := database.DB.Find(&vendorProducts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get vendor products"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": vendorProducts})
}

// AdminCreateVendorProduct - создание связи товар-поставщик
func AdminCreateVendorProduct(c *gin.Context) {
	var vendorProduct models.Vendor_Products
	if err := c.ShouldBindJSON(&vendorProduct); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Create(&vendorProduct).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create vendor product"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Vendor product created successfully",
		"id":      vendorProduct.ID,
	})
}

// AdminUpdateVendorProduct - обновление связи товар-поставщик
func AdminUpdateVendorProduct(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid vendor product ID"})
		return
	}

	var vendorProduct models.Vendor_Products
	if err := database.DB.First(&vendorProduct, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Vendor product not found"})
		return
	}

	var updates models.Vendor_Products
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Model(&vendorProduct).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update vendor product"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Vendor product updated successfully",
		"id":      id,
	})
}

// AdminDeleteVendorProduct - удаление связи товар-поставщик
func AdminDeleteVendorProduct(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid vendor product ID"})
		return
	}

	var vendorProduct models.Vendor_Products
	if err := database.DB.First(&vendorProduct, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Vendor product not found"})
		return
	}

	if err := database.DB.Delete(&vendorProduct).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete vendor product"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Vendor product deleted successfully",
		"id":      id,
	})
}

// AdminGetAllDocuments - получение всех документов
func AdminGetAllDocuments(c *gin.Context) {
	var documents []models.Documents
	if err := database.DB.Find(&documents).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get documents"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": documents})
}

// AdminCreateDocument - создание документа
func AdminCreateDocument(c *gin.Context) {
	var document models.Documents
	if err := c.ShouldBindJSON(&document); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Create(&document).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create document"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Document created successfully",
		"id":      document.ID,
	})
}

// AdminUpdateDocument - обновление документа
func AdminUpdateDocument(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid document ID"})
		return
	}

	var document models.Documents
	if err := database.DB.First(&document, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Document not found"})
		return
	}

	var updates models.Documents
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Model(&document).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update document"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Document updated successfully",
		"id":      id,
	})
}

// AdminDeleteDocument - удаление документа
func AdminDeleteDocument(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid document ID"})
		return
	}

	var document models.Documents
	if err := database.DB.First(&document, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Document not found"})
		return
	}

	if err := database.DB.Delete(&document).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete document"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Document deleted successfully",
		"id":      id,
	})
}

// AdminGetAllDocumentItems - получение всех позиций документов
func AdminGetAllDocumentItems(c *gin.Context) {
	var items []models.Document_Items
	if err := database.DB.Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get document items"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": items})
}

// AdminCreateDocumentItem - создание позиции документа
func AdminCreateDocumentItem(c *gin.Context) {
	var item models.Document_Items
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Create(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create document item"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Document item created successfully",
		"id":      item.ID,
	})
}

// AdminUpdateDocumentItem - обновление позиции документа
func AdminUpdateDocumentItem(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid document item ID"})
		return
	}

	var item models.Document_Items
	if err := database.DB.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Document item not found"})
		return
	}

	var updates models.Document_Items
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Model(&item).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update document item"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Document item updated successfully",
		"id":      id,
	})
}

// AdminDeleteDocumentItem - удаление позиции документа
func AdminDeleteDocumentItem(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid document item ID"})
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

// AdminGetAllAccounting - получение всех бухгалтерских записей
func AdminGetAllAccounting(c *gin.Context) {
	var accounting []models.Accounting
	if err := database.DB.Find(&accounting).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get accounting records"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": accounting})
}

// AdminCreateAccounting - создание бухгалтерской записи
func AdminCreateAccounting(c *gin.Context) {
	var accounting models.Accounting
	if err := c.ShouldBindJSON(&accounting); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Create(&accounting).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create accounting record"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Accounting record created successfully",
		"id":      accounting.ID,
	})
}

// AdminUpdateAccounting - обновление бухгалтерской записи
func AdminUpdateAccounting(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid accounting record ID"})
		return
	}

	var accounting models.Accounting
	if err := database.DB.First(&accounting, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Accounting record not found"})
		return
	}

	var updates models.Accounting
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Model(&accounting).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update accounting record"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Accounting record updated successfully",
		"id":      id,
	})
}

// AdminDeleteAccounting - удаление бухгалтерской записи
func AdminDeleteAccounting(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid accounting record ID"})
		return
	}

	var accounting models.Accounting
	if err := database.DB.First(&accounting, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Accounting record not found"})
		return
	}

	if err := database.DB.Delete(&accounting).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete accounting record"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Accounting record deleted successfully",
		"id":      id,
	})
}

// AdminGetAllStorage - получение всех складских записей
func AdminGetAllStorage(c *gin.Context) {
	var storage []models.Storage
	if err := database.DB.Find(&storage).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get storage records"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": storage})
}

// AdminCreateStorage - создание складской записи
func AdminCreateStorage(c *gin.Context) {
	var storage models.Storage
	if err := c.ShouldBindJSON(&storage); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Create(&storage).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create storage record"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Storage record created successfully",
		"id":      storage.ID,
	})
}

// AdminUpdateStorage - обновление складской записи
func AdminUpdateStorage(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid storage record ID"})
		return
	}

	var storage models.Storage
	if err := database.DB.First(&storage, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Storage record not found"})
		return
	}

	var updates models.Storage
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Model(&storage).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update storage record"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Storage record updated successfully",
		"id":      id,
	})
}

// AdminDeleteStorage - удаление складской записи
func AdminDeleteStorage(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid storage record ID"})
		return
	}

	var storage models.Storage
	if err := database.DB.First(&storage, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Storage record not found"})
		return
	}

	if err := database.DB.Delete(&storage).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete storage record"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Storage record deleted successfully",
		"id":      id,
	})
}