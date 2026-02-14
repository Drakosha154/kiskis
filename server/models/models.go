package models

import (
	"time"

	"golang.org/x/crypto/bcrypt"
)

func (u *User) HashPassword(password string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
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
	CreatedAt time.Time
	IsAdmin   bool `gorm:"not null;default:false"`
	Role      string
}

type Vendor struct {
	ID        uint   `gorm:"primaryKey"`
	Name     string `gorm:"unique;not null"`
	Password  string `gorm:"not null"`
	CreatedAt time.Time
	IsAdmin   bool `gorm:"not null;default:false"`
	Role      string
}
