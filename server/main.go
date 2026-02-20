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
		authGroup.DELETE("/vendor-products/:id", routes.DelVendorProductByID)

		// adminGroup := authGroup.Group("/admin")
		// adminGroup.Use(routes.AdminMiddleware())
		// 	{
		//     	adminGroup.GET("/stats", routes.GetAdminStats)
		//     	adminGroup.GET("/users", routes.GetAllUsers)
		//     	adminGroup.PATCH("/users/:id", routes.UpdateUser)
		//     	adminGroup.DELETE("/users/:id", routes.DeleteUser)
		//     	adminGroup.GET("/tasks", routes.GetAllTasks)
		//     	adminGroup.DELETE("/tasks/:id", routes.DeleteTask)
		// 	}
	}

	// Выведите все зарегистрированные маршруты
	fmt.Println("Registered routes:")
	for _, route := range r.Routes() {
		fmt.Printf("%-6s %s\n", route.Method, route.Path)
	}

	// Запуск сервера
	r.Run(":8080")
}
