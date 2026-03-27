package main

import (
	"fmt"
	"log"
	"time"

	"kiskis/database"
	"kiskis/middleware"
	"kiskis/routes"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {

	dbConfig := database.Config{
		Host:     "localhost",
		Port:     5432,
		User:     "postgres",
		Password: "antivzlom",
		DBName:   "kiskis",
	}

	if err := godotenv.Load(".env"); err != nil {
		log.Println("Error loading .env file")
	}

	// Инициализация БД
	// Инициализация подключения
	if err := database.InitDB(dbConfig); err != nil {
		log.Fatalf("Ошибка подключения к БД: %v", err)
	}
	defer database.CloseDB()

	// Настройка роутера
	r := gin.Default()

	// Настройка CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	r.Use(func(c *gin.Context) {
		fmt.Printf("Received %s request for: %s\n", c.Request.Method, c.Request.URL.Path)
		c.Next()
	})

	// Публичные маршруты (без аутентификации)
	r.POST("/api/register", routes.Register)
	r.POST("/api/login", routes.Login)
	//r.GET("/api/users/:id", routes.GetUser)
	r.GET("/api/users", routes.GetUsers)

	// Приватные маршруты (требуют JWT)
	authGroup := r.Group("/api")
	authGroup.Use(middleware.AuthMiddleware())
	{
		//Поставщик
		authGroup.POST("/vendors", routes.NewVendor)
		authGroup.GET("/vendors", routes.GetVendor)
		authGroup.DELETE("/vendors/:id", routes.DelVendorByID)
		authGroup.PATCH("/vendors/:id", routes.UpdVendorByID)

		//Документы
		authGroup.POST("/documents", routes.NewDocument)
		authGroup.GET("/documents", routes.GetDocuments)
		authGroup.DELETE("/documents/:id", routes.DelDocumentByID)
		authGroup.PATCH("/documents/:id", routes.UpdDocumentByID)

		//Продукты
		authGroup.POST("/products", routes.NewProducts)
		authGroup.GET("/products", routes.GetProducts)
		authGroup.DELETE("/products/:id", routes.DelProductByID)
		authGroup.PATCH("/products/:id", routes.UpdProductByID)

		//Товар Поставщик
		authGroup.POST("/vendor-products", routes.NewVendorProduct)
		authGroup.GET("/vendor-products/:id", routes.GetVendorProduct)
		authGroup.GET("/vendor-products_for_contract/:id", routes.GetVendorProductForContract)
		authGroup.DELETE("/vendor-products/:id", routes.DelVendorProductByID)

		//Товар Документы
		authGroup.POST("/document-products", routes.NewDocumentProduct)
		authGroup.GET("/document-products/:id", routes.GetDocumentProducts)
		authGroup.POST("/document-products/multiple", routes.GetMultipleDocumentsProducts)
		authGroup.PATCH("/document-products/item/:item_id", routes.UpdateDocumentProduct)
		authGroup.DELETE("/document-products/item/:item_id", routes.DeleteDocumentProduct)

		// Склад
		authGroup.GET("/storage", routes.GetStorage)
		authGroup.GET("/storage/:product_id", routes.GetProductStorage)
		authGroup.POST("/storage/update", routes.UpdateStorage)
		authGroup.POST("/storage/bulk-update", routes.BulkUpdateStorage)

		//Бухгалтерия
		authGroup.GET("/money", routes.GetMoney)
		authGroup.GET("/accounting/operations", routes.GetAccountingOperations)
		authGroup.GET("/accounting/summary", routes.GetAccountingSummary)


		//-------------------------Админские маршруты----------------------------
		adminGroup := authGroup.Group("/admin")
		adminGroup.Use(middleware.AdminMiddleware())
		{
			// Текущий пользователь
			adminGroup.GET("/me", routes.GetCurrentUser)
			
			// Пользователи
			adminGroup.GET("/users", routes.AdminGetAllUsers)
			adminGroup.POST("/users", routes.AdminCreateUser)
			adminGroup.PATCH("/users/:id", routes.AdminUpdateUser)
			adminGroup.DELETE("/users/:id", routes.AdminDeleteUser)
			
			// Поставщики
			adminGroup.GET("/vendors", routes.AdminGetAllVendors)
			adminGroup.POST("/vendors", routes.AdminCreateVendor)
			adminGroup.PATCH("/vendors/:id", routes.AdminUpdateVendor)
			adminGroup.DELETE("/vendors/:id", routes.AdminDeleteVendor)
			
			// Товары
			adminGroup.GET("/products", routes.AdminGetAllProducts)
			adminGroup.POST("/products", routes.AdminCreateProduct)
			adminGroup.PATCH("/products/:id", routes.AdminUpdateProduct)
			adminGroup.DELETE("/products/:id", routes.AdminDeleteProduct)
			
			// Товары поставщиков
			adminGroup.GET("/vendor-products", routes.AdminGetAllVendorProducts)
			adminGroup.POST("/vendor-products", routes.AdminCreateVendorProduct)
			adminGroup.PATCH("/vendor-products/:id", routes.AdminUpdateVendorProduct)
			adminGroup.DELETE("/vendor-products/:id", routes.AdminDeleteVendorProduct)
			
			// Документы
			adminGroup.GET("/documents", routes.AdminGetAllDocuments)
			adminGroup.POST("/documents", routes.AdminCreateDocument)
			adminGroup.PATCH("/documents/:id", routes.AdminUpdateDocument)
			adminGroup.DELETE("/documents/:id", routes.AdminDeleteDocument)
			
			// Позиции документов
			adminGroup.GET("/document-items", routes.AdminGetAllDocumentItems)
			adminGroup.POST("/document-items", routes.AdminCreateDocumentItem)
			adminGroup.PATCH("/document-items/:id", routes.AdminUpdateDocumentItem)
			adminGroup.DELETE("/document-items/:id", routes.AdminDeleteDocumentItem)
			
			// Бухгалтерия
			adminGroup.GET("/accounting", routes.AdminGetAllAccounting)
			adminGroup.POST("/accounting", routes.AdminCreateAccounting)
			adminGroup.PATCH("/accounting/:id", routes.AdminUpdateAccounting)
			adminGroup.DELETE("/accounting/:id", routes.AdminDeleteAccounting)
			
			// Склад
			adminGroup.GET("/storage", routes.AdminGetAllStorage)
			adminGroup.POST("/storage", routes.AdminCreateStorage)
			adminGroup.PATCH("/storage/:id", routes.AdminUpdateStorage)
			adminGroup.DELETE("/storage/:id", routes.AdminDeleteStorage)
		}
	}

	// Выведите все зарегистрированные маршруты
	fmt.Println("Registered routes:")
	for _, route := range r.Routes() {
		fmt.Printf("%-6s %s\n", route.Method, route.Path)
	}

	// Запуск сервера
	r.Run(":8080")
}
