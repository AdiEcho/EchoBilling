package provisioning

import (
	"encoding/json"
	"fmt"

	"github.com/hibiken/asynq"
)

const (
	TypeProvisionVPS    = "vps:provision"
	TypeSuspendVPS      = "vps:suspend"
	TypeTerminateVPS    = "vps:terminate"
	TypeRenewalReminder = "billing:renewal_reminder"
	TypeGenerateInvoice = "billing:generate_invoice"
	TypeExpireService   = "service:expire"
)

type ProvisionVPSPayload struct {
	ServiceID string `json:"service_id"`
	OrderID   string `json:"order_id"`
	PlanID    string `json:"plan_id"`
	UserID    string `json:"user_id"`
}

type SuspendVPSPayload struct {
	ServiceID string `json:"service_id"`
	Reason    string `json:"reason"`
}

type TerminateVPSPayload struct {
	ServiceID string `json:"service_id"`
}

type RenewalReminderPayload struct {
	ServiceID string `json:"service_id"`
	UserID    string `json:"user_id"`
	DaysLeft  int    `json:"days_left"`
}

type GenerateInvoicePayload struct {
	ServiceID string `json:"service_id"`
	UserID    string `json:"user_id"`
	OrderID   string `json:"order_id"`
}

type ExpireServicePayload struct {
	ServiceID string `json:"service_id"`
}

// NewProvisionVPSTask 创建 VPS 开通任务
func NewProvisionVPSTask(payload ProvisionVPSPayload) (*asynq.Task, error) {
	data, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal payload: %w", err)
	}
	return asynq.NewTask(TypeProvisionVPS, data), nil
}

// NewSuspendVPSTask 创建 VPS 暂停任务
func NewSuspendVPSTask(payload SuspendVPSPayload) (*asynq.Task, error) {
	data, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal payload: %w", err)
	}
	return asynq.NewTask(TypeSuspendVPS, data), nil
}

// NewTerminateVPSTask 创建 VPS 终止任务
func NewTerminateVPSTask(payload TerminateVPSPayload) (*asynq.Task, error) {
	data, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal payload: %w", err)
	}
	return asynq.NewTask(TypeTerminateVPS, data), nil
}

// NewRenewalReminderTask 创建续费提醒任务
func NewRenewalReminderTask(payload RenewalReminderPayload) (*asynq.Task, error) {
	data, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal payload: %w", err)
	}
	return asynq.NewTask(TypeRenewalReminder, data), nil
}

// NewGenerateInvoiceTask 创建生成发票任务
func NewGenerateInvoiceTask(payload GenerateInvoicePayload) (*asynq.Task, error) {
	data, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal payload: %w", err)
	}
	return asynq.NewTask(TypeGenerateInvoice, data), nil
}

// NewExpireServiceTask 创建服务过期检查任务
func NewExpireServiceTask(payload ExpireServicePayload) (*asynq.Task, error) {
	data, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal payload: %w", err)
	}
	return asynq.NewTask(TypeExpireService, data), nil
}
