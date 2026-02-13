package provisioning

import (
	"github.com/hibiken/asynq"
)

// RegisterPeriodicTasks 注册周期性任务
func RegisterPeriodicTasks(scheduler *asynq.Scheduler) error {
	// 每小时检查一次过期服务
	_, err := scheduler.Register("@every 1h", asynq.NewTask(TypeExpireService, nil))
	if err != nil {
		return err
	}

	return nil
}
