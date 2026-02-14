package auth

import (
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var SecretKey = os.Getenv("JWT_SECRET") // Минимум 32 символа для HS256
const TokenExp = 24 * time.Hour         // Время жизни токена

// Claims — кастомная структура для хранения данных в токене
type Claims struct {
	UserID uint `json:"id"`
	jwt.RegisteredClaims
}

// Генерация токена
func GenerateToken(userID uint) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id":  userID,
		"exp": jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
	})
	return token.SignedString([]byte(SecretKey))
}

// Парсинг токена
func ParseToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(SecretKey), nil
	})

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, err
}
