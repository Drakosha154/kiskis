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

// РџСЂРѕРІРµСЂРєР° РїР°СЂРѕР»СЏ
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
	Max_stock   int `gorm:"default:0"`
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
	ID                 uint   `gorm:"primaryKey"`
	Doc_number         string `gorm:"not null"`
	Doc_type           string `gorm:"not null"`
	Doc_date           string `gorm:"not null"`
	Vendor_id          int
	User_id            uint
	Status             string  `gorm:"default:В работе"`
	Total_amount       float64 `gorm:"default:0"`
	Currency           string  `gorm:"default:RUB"`
	Description        string
	Created_at         time.Time
	DeliveryDate       *time.Time `gorm:"column:delivery_date"`
	DeadlineDate       *time.Time `gorm:"column:deadline_date"`
	DeliveryDays       *int       `gorm:"column:delivery_days"`
	ActualDeliveryDate *time.Time `gorm:"column:actual_delivery_date"`
	PaymentTerms       string     `gorm:"column:payment_terms;default:postpaid"` // prepaid, partial, postpaid
	PaidAmount         float64    `gorm:"column:paid_amount;default:0"`
	PaymentStatus      string     `gorm:"column:payment_status;default:unpaid"` // unpaid, partially_paid, fully_paid
}

type Claim struct {
	ID          uint       `gorm:"primaryKey"`
	ClaimNumber string     `gorm:"not null;unique"`      // РќРѕРјРµСЂ РїСЂРµС‚РµРЅР·РёРё
	DocumentID  int        `gorm:"not null"`             // ID РґРѕРєСѓРјРµРЅС‚Р° РїСЂРёС…РѕРґР°
	VendorID    int        `gorm:"not null"`             // ID РїРѕСЃС‚Р°РІС‰РёРєР°
	ClaimDate   time.Time  `gorm:"not null"`             // Р”Р°С‚Р° РїСЂРµС‚РµРЅР·РёРё
	ClaimType   string     `gorm:"not null"`             // РўРёРї: Р±СЂР°Рє, РЅРµРґРѕРїРѕСЃС‚Р°РІРєР°, РїСЂРѕСЃСЂРѕС‡РєР°, РЅРµСЃРѕРѕС‚РІРµС‚СЃС‚РІРёРµ
	Description string     `gorm:"type:text"`            // РћРїРёСЃР°РЅРёРµ РїСЂРѕР±Р»РµРјС‹
	Amount      float64    `gorm:"default:0"`            // РЎСѓРјРјР° РїСЂРµС‚РµРЅР·РёРё
	Status      string     `gorm:"default:'РќРѕРІР°СЏ'"` // РЎС‚Р°С‚СѓСЃ: РќРѕРІР°СЏ, Р’ СЂР°Р±РѕС‚Рµ, РЈРґРѕРІР»РµС‚РІРѕСЂРµРЅР°, РћС‚РєР»РѕРЅРµРЅР°
	ResolvedAt  *time.Time // Р”Р°С‚Р° СѓРґРѕРІР»РµС‚РІРѕСЂРµРЅРёСЏ/РѕС‚РєР»РѕРЅРµРЅРёСЏ
	Resolution  string     `gorm:"type:text"` // Р РµР·СѓР»СЊС‚Р°С‚ СЂР°СЃСЃРјРѕС‚СЂРµРЅРёСЏ
	CreatedBy   uint       `gorm:"not null"`  // РљС‚Рѕ СЃРѕР·РґР°Р»
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type ClaimItem struct {
	ID          uint    `gorm:"primaryKey"`
	ClaimID     int     `gorm:"not null"`  // ID РїСЂРµС‚РµРЅР·РёРё
	ProductID   int     `gorm:"not null"`  // ID С‚РѕРІР°СЂР°
	Quantity    float64 `gorm:"not null"`  // РљРѕР»РёС‡РµСЃС‚РІРѕ СЃ Р±СЂР°РєРѕРј/РЅРµРґРѕСЃС‚Р°С‡РµР№
	Price       float64 `gorm:"default:0"` // Р¦РµРЅР° С‚РѕРІР°СЂР°
	Amount      float64 `gorm:"default:0"` // РЎСѓРјРјР° РїСЂРµС‚РµРЅР·РёРё РїРѕ С‚РѕРІР°СЂСѓ
	IssueType   string  `gorm:"not null"`  // РўРёРї РїСЂРѕР±Р»РµРјС‹: Р±СЂР°Рє, РЅРµРґРѕСЃС‚Р°С‡Р°, РїРѕРІСЂРµР¶РґРµРЅРёРµ
	Description string  `gorm:"type:text"` // Р”РµС‚Р°Р»Рё РїРѕ С‚РѕРІР°СЂСѓ
	CreatedAt   time.Time
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
	ID                       uint      `gorm:"primaryKey"`
	Product_id               int       `gorm:"not null"`
	Quantity                 float64   `gorm:"not null;default:0"`
	Last_receipt_date        time.Time
	Last_receipt_document_id int
	Updated_at               time.Time
}

type WarehouseLocation struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Rack         string    `gorm:"not null" json:"rack"`
	Shelf        int       `gorm:"not null" json:"shelf"`
	Cell         int       `gorm:"not null" json:"cell"`
	LocationCode string    `gorm:"unique;not null" json:"location_code"`
	Capacity     float64   `gorm:"default:100" json:"capacity"`
	Occupied     float64   `gorm:"default:0" json:"occupied"`
	ProductID    *int      `json:"product_id"`
	IsAvailable  bool      `gorm:"default:true" json:"is_available"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type ProductLocationMapping struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	ProductID  int       `gorm:"not null;index" json:"product_id"`
	LocationID int       `gorm:"not null;index" json:"location_id"`
	Quantity   float64   `gorm:"not null;default:0" json:"quantity"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type Money struct {
	Money float64
}

type ClaimReport struct {
	ID         uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	DocumentID int       `gorm:"column:document_id;not null" json:"document_id"`
	Marriage   bool      `gorm:"column:marriage;default:false" json:"marriage"`
	Deadline   bool      `gorm:"column:deadline;default:false" json:"deadline"`
	Quantity   bool      `gorm:"column:quantity;default:false" json:"quantity"`
	CreatedAt  time.Time `gorm:"column:created_at" json:"created_at"`
}

// РЈРєР°Р·С‹РІР°РµРј СЃСѓС‰РµСЃС‚РІСѓСЋС‰РµРµ РёРјСЏ С‚Р°Р±Р»РёС†С‹
func (ClaimReport) TableName() string {
	return "claim_reports" // РСЃРїРѕР»СЊР·СѓРµРј СЃСѓС‰РµСЃС‚РІСѓСЋС‰СѓСЋ С‚Р°Р±Р»РёС†Сѓ claims
}
