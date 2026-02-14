package middleware

import (
	"context"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

type visitor struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

type rateLimiter struct {
	visitors map[string]*visitor
	mu       sync.RWMutex
	rate     rate.Limit
	burst    int
	cancel   context.CancelFunc
}

func newRateLimiter(ctx context.Context, r int, b int) *rateLimiter {
	ctx, cancel := context.WithCancel(ctx)
	rl := &rateLimiter{
		visitors: make(map[string]*visitor),
		rate:     rate.Limit(r),
		burst:    b,
		cancel:   cancel,
	}

	go rl.cleanupVisitors(ctx)

	return rl
}

func (rl *rateLimiter) Stop() {
	rl.cancel()
}

func (rl *rateLimiter) getVisitor(ip string) *rate.Limiter {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	v, exists := rl.visitors[ip]
	if !exists {
		limiter := rate.NewLimiter(rl.rate, rl.burst)
		rl.visitors[ip] = &visitor{limiter, time.Now()}
		return limiter
	}

	v.lastSeen = time.Now()
	return v.limiter
}

func (rl *rateLimiter) cleanupVisitors(ctx context.Context) {
	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			rl.mu.Lock()
			for ip, v := range rl.visitors {
				if time.Since(v.lastSeen) > 3*time.Minute {
					delete(rl.visitors, ip)
				}
			}
			rl.mu.Unlock()
		}
	}
}

func RateLimitWithContext(ctx context.Context, r int, burst int) gin.HandlerFunc {
	limiter := newRateLimiter(ctx, r, burst)

	return func(c *gin.Context) {
		ip := c.ClientIP()
		limiter := limiter.getVisitor(ip)

		if !limiter.Allow() {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "Rate limit exceeded",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RateLimit is a convenience wrapper that uses context.Background().
func RateLimit(r int, burst int) gin.HandlerFunc {
	return RateLimitWithContext(context.Background(), r, burst)
}
