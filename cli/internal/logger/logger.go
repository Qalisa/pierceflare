package logger

import (
	"fmt"
	"log"
	"os"
	"time"
)

const LogTag = "[PierceFlare CLI]"

// Logger est une structure pour gérer les journaux de l'application
type Logger struct {
	logger      *log.Logger
	timestamped bool
}

// New crée une nouvelle instance de Logger
func New(timestamped bool) *Logger {
	return &Logger{
		logger:      log.New(os.Stdout, "", 0),
		timestamped: timestamped,
	}
}

// Log enregistre un message sans horodatage
func (l *Logger) Log(format string, args ...interface{}) {
	message := fmt.Sprintf(format, args...)
	l.logger.Printf("%s - %s", LogTag, message)
}

// LogT enregistre un message avec horodatage si activé
func (l *Logger) LogT(format string, args ...interface{}) {
	message := fmt.Sprintf(format, args...)
	if l.timestamped {
		now := time.Now().Format("2006-01-02 15:04:05")
		l.logger.Printf("%s - %s - %s", LogTag, now, message)
	} else {
		l.Log(format, args...)
	}
}
