package database

import (
	"fmt"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB
var DBConfig Config

type Config struct {
	Host     string
	Port     int
	User     string
	Password string
	DBName   string
}

func InitDB(cfg Config) error {
	DBConfig = cfg // Сохраняем конфиг
	dsn := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.DBName,
	)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return err
	}

	log.Println("Успешное подключение к PostgreSQL с GORM!")
	return nil
}

func CloseDB() {
	if DB != nil {
		sqlDB, _ := DB.DB()
		sqlDB.Close()
	}
}

// GetConnectionForSchema создает новое соединение для работы с определенной схемой
func GetConnectionForSchema() (*gorm.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		DBConfig.Host, DBConfig.Port, DBConfig.User, DBConfig.Password, DBConfig.DBName,
	)
	
	return gorm.Open(postgres.Open(dsn), &gorm.Config{})
}