package routes

import (
	"net/http"

	"kiskis/database"
	"kiskis/models"

	"github.com/gin-gonic/gin"
)

// Получение остатков всех товаров на складе
func GetMoney(c *gin.Context) {

	var money models.Money

	result := database.DB.
		Select("*").
		Find(&money)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch money"})
		return
	}

	c.JSON(http.StatusOK, money)
}
