import { useState, type FormEvent } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import { useAuthStore } from '../../stores/auth'
import { api } from '../../lib/utils'
import { Lock, Shield, Clock } from 'lucide-react'

export default function Security() {
  const token = useAuthStore((state) => state.token)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword.length < 8) {
      setError('新密码至少需要 8 个字符')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致')
      return
    }

    setLoading(true)

    try {
      await api('/portal/change-password', {
        method: 'POST',
        token: token || undefined,
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      })
      setSuccess('密码修改成功')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '密码修改失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text">安全设置</h1>
        <p className="text-text-secondary mt-2">管理您的账户安全</p>
      </div>

      <Card>
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-text mb-1">修改密码</h2>
            <p className="text-text-secondary text-sm">定期更新密码以保护您的账户安全</p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-cta/10 border border-cta/20 text-cta text-sm">
              {success}
            </div>
          )}

          <Input
            id="currentPassword"
            type="password"
            label="当前密码"
            placeholder="输入当前密码"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />

          <Input
            id="newPassword"
            type="password"
            label="新密码"
            placeholder="至少 8 个字符"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <Input
            id="confirmPassword"
            type="password"
            label="确认新密码"
            placeholder="再次输入新密码"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <Button type="submit" disabled={loading}>
            {loading ? '修改中...' : '修改密码'}
          </Button>
        </form>
      </Card>

      <Card>
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-cta/10 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6 text-cta" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-text mb-1">会话信息</h2>
            <p className="text-text-secondary text-sm">您当前的登录会话</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-sm text-text-secondary">当前设备</span>
            <Badge variant="success">活跃</Badge>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-text-secondary">登录时间</span>
            <span className="text-sm text-text">{new Date().toLocaleString('zh-CN')}</span>
          </div>
        </div>
      </Card>

      <Card className="bg-surface/50">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-warning" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-text mb-1">双因素认证</h2>
            <p className="text-text-secondary text-sm mb-3">
              增强您的账户安全性，启用双因素认证
            </p>
            <Badge variant="warning">即将推出</Badge>
          </div>
        </div>
      </Card>
    </div>
  )
}
