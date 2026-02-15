package models

import (
	"time"

	"golang.org/x/crypto/bcrypt"
)

func (u *User) HashPassword(Password_hash string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(Password_hash), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.Password = string(hashedPassword)
	return nil
}

// Проверка пароля
func (u *User) CheckPassword(password string) error {
	return bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
}

type User struct {
	ID        uint   `gorm:"primaryKey"`
	Login     string `gorm:"unique;not null"`
	Password  string `gorm:"not null"`
	Full_name string `gorm:"not null"`
	Role      string
	CreatedAt time.Time
}

type Vendor struct {
	ID              uint   `gorm:"primaryKey"`
	Company_name    string `gorm:"not null"`
	Contact_person  string
	Phone           string
	Email           string
	Address         string
	Inn             string
	Kpp             string
	Payment_account string
	Bank_name       string
	Created_at      time.Time
}

type Products struct {
	ID          uint   `gorm:"primaryKey"`
	article     string `gorm:"not null"`
	name        string `gorm:"not null"`
	description string
	unit        string `gorm:"not null"`
	category    string
	min_stock   int `gorm:"default:0"`
	created_at  time.Time
}

type Vendor_Products struct {
	ID             uint `gorm:"primaryKey"`
	supplier_id    int  `gorm:"not null"`
	product_id     int  `gorm:"not null"`
	supplier_price float64
	currency       string `gorm:"default:RUB"`
	delivery_days  int
	is_active      bool `gorm:"default:true"`
	updated_at     time.Time
}

type Documents struct {
	ID           uint      `gorm:"primaryKey"`
	Doc_number   string    `gorm:"not null"`
	Doc_type     string    `gorm:"not null"`
	Doc_date     time.Time `gorm:"not null"`
	Supplier_id  int
	User_id      uint
	Status       string  `gorm:"default:draft"`
	Total_amount float64 `gorm:"default:0"`
	Currency     string  `gorm:"default:RUB"`
	File_path    string
	Description  string
	Created_at   time.Time
}

type Document_Items struct {
	ID          uint    `gorm:"primaryKey"`
	document_id int     `gorm:"not null"`
	product_id  int     `gorm:"not null"`
	quantity    float64 `gorm:"not null"`
	price       float64 `gorm:"not null"`
	amount      float64
	vat_rate    float64 `gorm:"default:0"`
}

type Accounting struct {
	ID             uint      `gorm:"primaryKey"`
	operation_date time.Time `gorm:"not null"`
	operation_type string    `gorm:"not null"`
	document_id    int       `gorm:"not null"`
	supplier_id    int
	amount         float64 `gorm:"not null"`
	vat_amount     float64 `gorm:"default:0"`
	description    string
	created_by     int
	created_at     time.Time
}

type Storage struct {
	ID                       uint    `gorm:"primaryKey"`
	product_id               int     `gorm:"not null"`
	quantity                 float64 `gorm:"not null;default:0"`
	last_receipt_date        time.Time
	last_receipt_document_id int
	updated_at               time.Time
}
