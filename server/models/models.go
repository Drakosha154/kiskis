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
	Article     string `gorm:"not null"`
	Name        string `gorm:"not null"`
	Description string
	Unit        string `gorm:"not null"`
	Category    string
	Min_stock   int `gorm:"default:0"`
	Created_at  time.Time
}

type Vendor_Products struct {
	ID            uint `gorm:"primaryKey"`
	Vendor_id     int  `gorm:"not null"`
	Product_id    int  `gorm:"not null"`
	Vendor_price  float64
	Currency      string `gorm:"default:RUB"`
	Delivery_days int
	Updated_at    time.Time
}

type Documents struct {
	ID           uint   `gorm:"primaryKey"`
	Doc_number   string `gorm:"not null"`
	Doc_type     string `gorm:"not null"`
	Doc_date     string `gorm:"not null"`
	Vendor_id    int
	User_id      uint
	Status       string  `gorm:"default:Черновик"`
	Total_amount float64 `gorm:"default:0"`
	Currency     string  `gorm:"default:RUB"`
	Description  string
	Created_at   time.Time
	DeliveryDate *time.Time `gorm:"column:delivery_date"`  // Добавить в БД
	DeadlineDate *time.Time `gorm:"column:deadline_date"`  // Добавить в БД
	DeliveryDays *int       `gorm:"column:delivery_days"`  // Добавить в БД
	ActualDeliveryDate *time.Time `gorm:"column:actual_delivery_date"`  // Добавить в БД
}

type Claim struct {
	ID          uint      `gorm:"primaryKey"`
	ClaimNumber string    `gorm:"not null;unique"`  // Номер претензии
	DocumentID  int       `gorm:"not null"`          // ID документа прихода
	VendorID    int       `gorm:"not null"`          // ID поставщика
	ClaimDate   time.Time `gorm:"not null"`          // Дата претензии
	ClaimType   string    `gorm:"not null"`          // Тип: брак, недопоставка, просрочка, несоответствие
	Description string    `gorm:"type:text"`         // Описание проблемы
	Amount      float64   `gorm:"default:0"`         // Сумма претензии
	Status      string    `gorm:"default:'Новая'"`   // Статус: Новая, В работе, Удовлетворена, Отклонена
	ResolvedAt  *time.Time                           // Дата удовлетворения/отклонения
	Resolution  string    `gorm:"type:text"`         // Результат рассмотрения
	CreatedBy   uint      `gorm:"not null"`          // Кто создал
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type ClaimItem struct {
	ID         uint    `gorm:"primaryKey"`
	ClaimID    int     `gorm:"not null"`   // ID претензии
	ProductID  int     `gorm:"not null"`   // ID товара
	Quantity   float64 `gorm:"not null"`   // Количество с браком/недостачей
	Price      float64 `gorm:"default:0"`  // Цена товара
	Amount     float64 `gorm:"default:0"`  // Сумма претензии по товару
	IssueType  string  `gorm:"not null"`   // Тип проблемы: брак, недостача, повреждение
	Description string `gorm:"type:text"`  // Детали по товару
	CreatedAt  time.Time
}

type Document_Items struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	DocumentID int       `gorm:"not null;column:document_id" json:"document_id"`
	ProductID  int       `gorm:"not null;column:product_id" json:"product_id"`
	Quantity   float64   `gorm:"not null" json:"quantity"`
	Price      float64   `gorm:"not null" json:"price"`
	VatRate    float64   `gorm:"default:0;column:vat_rate" json:"vat_rate"`
	CreatedAt  time.Time `json:"created_at"`
}

type Accounting struct {
	ID             uint      `gorm:"primaryKey"`
	Operation_date time.Time `gorm:"not null"`
	Operation_type string    `gorm:"not null"`
	Document_id    int       `gorm:"not null"`
	Supplier_id    int
	Amount         float64 `gorm:"not null"`
	Vat_amount     float64 `gorm:"default:0"`
	Description    string
	Created_by     int
	Created_at     time.Time
}

type Storage struct {
	ID                       uint    `gorm:"primaryKey"`
	Product_id               int     `gorm:"not null"`
	Quantity                 float64 `gorm:"not null;default:0"`
	Last_receipt_date        time.Time
	Last_receipt_document_id int
	Updated_at               time.Time
}

type Money struct {
	Money float64
}
