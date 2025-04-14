package api

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	genapi "github.com/qalisa/pierceflare/cli/internal/gen/api"
	"github.com/qalisa/pierceflare/cli/internal/logger"
)

// Client is a client for the PierceFlare API
type Client struct {
	apiKey string
	client *genapi.ClientWithResponses
	logger *logger.Logger
	ctx    context.Context
}

// NewClient creates a new API client
func NewClient(apiKey, serverURL string, logger *logger.Logger) *Client {
	// Create the base context
	ctx := context.Background()

	// Make sure the server URL is properly formatted
	serverURL = strings.TrimRight(serverURL, "/")

	// Create the generated client with authentication
	client, err := genapi.NewClientWithResponses(
		serverURL,
		genapi.WithRequestEditorFn(func(ctx context.Context, req *http.Request) error {
			req.Header.Set("Authorization", "Bearer "+apiKey)
			return nil
		}),
		genapi.WithHTTPClient(&http.Client{
			Timeout: 10 * time.Second,
		}),
	)

	if err != nil {
		logger.Error("Error creating API client: %v", err)
		return nil
	}

	return &Client{
		apiKey: apiKey,
		client: client,
		logger: logger,
		ctx:    ctx,
	}
}

// CheckTokenValidity verifies the API token validity
func (c *Client) CheckTokenValidity() error {
	c.logger.Debug("Checking token validity...")

	resp, err := c.client.GetApiInfosWithResponse(c.ctx)
	if err != nil {
		return fmt.Errorf("request failed: %w", err)
	}

	if resp.StatusCode() < 200 || resp.StatusCode() >= 300 {
		return fmt.Errorf("unable to validate token (HTTP %d)", resp.StatusCode())
	}

	c.logger.Debug("Token valid.")
	return nil
}

// SendIPUpdate sends an IP address update to the server
func (c *Client) SendIPUpdate(ipAddress string, isDummy bool) error {
	if isDummy {
		c.logger.Debug("Sending dummy IP update: %s", ipAddress)
	} else {
		c.logger.Debug("Sending IP update: %s", ipAddress)
	}

	// Prepare request data
	ip := ipAddress  // Create a copy to take its address
	dummy := isDummy // Same

	reqBody := genapi.PutApiFlareJSONRequestBody{
		Ip:    &ip,
		Dummy: &dummy,
	}

	// Send the request
	resp, err := c.client.PutApiFlareWithResponse(c.ctx, reqBody)
	if err != nil {
		return fmt.Errorf("update failed: %w", err)
	}

	if resp.StatusCode() < 200 || resp.StatusCode() >= 300 {
		if resp.JSON500 != nil {
			return fmt.Errorf("update failed (HTTP %d): code=%s, message=%s",
				resp.StatusCode(), resp.JSON500.ErrCode, resp.JSON500.Message)
		}
		return fmt.Errorf("update failed (HTTP %d)", resp.StatusCode())
	}

	if isDummy {
		c.logger.Debug("Test update successful (HTTP %d)", resp.StatusCode())
	} else {
		c.logger.Debug("Update successful (HTTP %d)", resp.StatusCode())
	}

	return nil
}
