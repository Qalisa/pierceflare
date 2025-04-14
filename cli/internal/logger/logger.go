package logger

import (
	"fmt"
	"log"
	"os"
	"time"
)

const LogTag = "[PierceFlare CLI]"

// LogLevel defines the verbosity level of logs
type LogLevel int

const (
	// LogLevelError only displays errors
	LogLevelError LogLevel = iota
	// LogLevelInfo displays general information and errors
	LogLevelInfo
	// LogLevelDebug displays all details, including debug messages
	LogLevelDebug
)

// Logger is a structure for managing application logs
type Logger struct {
	logger        *log.Logger
	timestamped   bool
	level         LogLevel
	successPeriod int       // Number of successful executions between each success log (0 = log every success)
	successCount  int       // Counter of successful executions
	lastLogTime   time.Time // Last time a message was logged
}

// New creates a new Logger instance
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

// ShouldLogSuccess determines if a success message should be logged
func (l *Logger) ShouldLogSuccess() bool {
	l.successCount++
	if l.successPeriod == 0 {
		return true
	}
	return l.successCount >= l.successPeriod
}

// ResetSuccessCounter resets the success counter
func (l *Logger) ResetSuccessCounter() {
	l.successCount = 0
}

// formatMessage formats a message with timestamp if needed
func (l *Logger) formatMessage(message string) string {
	if l.timestamped {
		now := time.Now().Format("2006-01-02 15:04:05")
		return fmt.Sprintf("%s - %s - %s", LogTag, now, message)
	}
	return fmt.Sprintf("%s - %s", LogTag, message)
}

// Log records a message without checking verbosity level
func (l *Logger) Log(format string, args ...interface{}) {
	message := fmt.Sprintf(format, args...)
	l.logger.Println(l.formatMessage(message))
}

// Error records an error message (level LogLevelError)
func (l *Logger) Error(format string, args ...interface{}) {
	message := fmt.Sprintf(format, args...)
	l.logger.Println(l.formatMessage("ERROR: " + message))
}

// Info records an information message if level is >= LogLevelInfo
func (l *Logger) Info(format string, args ...interface{}) {
	if l.level >= LogLevelInfo {
		message := fmt.Sprintf(format, args...)
		l.logger.Println(l.formatMessage(message))
	}
}

// Debug records a debug message if level is LogLevelDebug
func (l *Logger) Debug(format string, args ...interface{}) {
	if l.level >= LogLevelDebug {
		message := fmt.Sprintf(format, args...)
		l.logger.Println(l.formatMessage("DEBUG: " + message))
	}
}

// LogSuccess records a periodic success message if the counter reaches the defined period
func (l *Logger) LogSuccess(format string, args ...interface{}) {
	if l.level >= LogLevelInfo && l.ShouldLogSuccess() {
		message := fmt.Sprintf(format, args...)
		l.logger.Println(l.formatMessage("✓ " + message))
		l.ResetSuccessCounter()
	}
}

// LogT records a message with timestamp if enabled (for compatibility with old code)
func (l *Logger) LogT(format string, args ...interface{}) {
	message := fmt.Sprintf(format, args...)
	if l.level >= LogLevelInfo {
		l.logger.Println(l.formatMessage(message))
	}
}
