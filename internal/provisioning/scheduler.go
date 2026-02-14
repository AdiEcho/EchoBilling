package provisioning

import (
	"github.com/hibiken/asynq"
)

// RegisterPeriodicTasks 注册周期性任务
func RegisterPeriodicTasks(scheduler *asynq.Scheduler) error {
	// 每小时检查一次过期服务
	_, err := scheduler.Register("@every 1h", asynq.NewTask(TypeExpireService, []byte(`{}`)))
	if err != nil {
		return err
	}

	// 每天批量发送续费提醒（7/3/1 天）
	_, err = scheduler.Register("@every 24h", asynq.NewTask(TypeRenewalReminder, []byte(`{}`)))
	if err != nil {
		return err
	}

	return nil
}
