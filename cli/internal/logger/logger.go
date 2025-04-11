package logger

import (
	"fmt"
	"log"
	"os"
	"time"
)

const LogTag = "[PierceFlare CLI]"

// LogLevel définit le niveau de verbosité des logs
type LogLevel int

const (
	// LogLevelError n'affiche que les erreurs
	LogLevelError LogLevel = iota
	// LogLevelInfo affiche les informations générales et les erreurs
	LogLevelInfo
	// LogLevelDebug affiche tous les détails, y compris les messages de débogage
	LogLevelDebug
)

// Logger est une structure pour gérer les journaux de l'application
type Logger struct {
	logger        *log.Logger
	timestamped   bool
	level         LogLevel
	successPeriod int       // Nombre d'exécutions réussies entre chaque log de succès (0 = log chaque succès)
	successCount  int       // Compteur d'exécutions réussies
	lastLogTime   time.Time // Dernière fois qu'un message a été journalisé
}

// New crée une nouvelle instance de Logger
func New(timestamped bool, level LogLevel, successPeriod int) *Logger {
	return &Logger{
		logger:        log.New(os.Stdout, "", 0),
		timestamped:   timestamped,
		level:         level,
		successPeriod: successPeriod,
		successCount:  0,
		lastLogTime:   time.Now(),
	}
}

// ShouldLogSuccess détermine si un message de succès doit être loggé
func (l *Logger) ShouldLogSuccess() bool {
	l.successCount++
	if l.successPeriod == 0 {
		return true
	}
	return l.successCount >= l.successPeriod
}

// ResetSuccessCounter réinitialise le compteur de succès
func (l *Logger) ResetSuccessCounter() {
	l.successCount = 0
}

// formatMessage formate un message avec l'horodatage si nécessaire
func (l *Logger) formatMessage(message string) string {
	if l.timestamped {
		now := time.Now().Format("2006-01-02 15:04:05")
		return fmt.Sprintf("%s - %s - %s", LogTag, now, message)
	}
	return fmt.Sprintf("%s - %s", LogTag, message)
}

// Log enregistre un message sans vérifier le niveau de verbosité
func (l *Logger) Log(format string, args ...interface{}) {
	message := fmt.Sprintf(format, args...)
	l.logger.Println(l.formatMessage(message))
}

// Error enregistre un message d'erreur (niveau LogLevelError)
func (l *Logger) Error(format string, args ...interface{}) {
	message := fmt.Sprintf(format, args...)
	l.logger.Println(l.formatMessage("ERREUR: " + message))
}

// Info enregistre un message d'information si le niveau est >= LogLevelInfo
func (l *Logger) Info(format string, args ...interface{}) {
	if l.level >= LogLevelInfo {
		message := fmt.Sprintf(format, args...)
		l.logger.Println(l.formatMessage(message))
	}
}

// Debug enregistre un message de débogage si le niveau est LogLevelDebug
func (l *Logger) Debug(format string, args ...interface{}) {
	if l.level >= LogLevelDebug {
		message := fmt.Sprintf(format, args...)
		l.logger.Println(l.formatMessage("DEBUG: " + message))
	}
}

// LogSuccess enregistre un message de succès périodique si le compteur atteint la période définie
func (l *Logger) LogSuccess(format string, args ...interface{}) {
	if l.level >= LogLevelInfo && l.ShouldLogSuccess() {
		message := fmt.Sprintf(format, args...)
		l.logger.Println(l.formatMessage("✓ " + message))
		l.ResetSuccessCounter()
	}
}

// LogT enregistre un message avec horodatage si activé (pour compatibilité avec l'ancien code)
func (l *Logger) LogT(format string, args ...interface{}) {
	message := fmt.Sprintf(format, args...)
	if l.level >= LogLevelInfo {
		l.logger.Println(l.formatMessage(message))
	}
}
