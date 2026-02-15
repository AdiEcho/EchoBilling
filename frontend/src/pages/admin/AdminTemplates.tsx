import { useEffect, useState, useMemo } from 'react'
import { Plus, Edit, Trash2, Play } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import DataTable from '../../components/ui/DataTable'
import { api } from '../../lib/utils'
import { useAuthStore } from '../../stores/auth'
import { toast } from '../../stores/toast'
import { useTranslation } from 'react-i18next'
import type { ColumnDef } from '@tanstack/react-table'

interface PlanPreset {
  name: string
  slug: string
  description: string
  cpu_cores: number
  memory_mb: number
  disk_gb: number
  bandwidth_tb: string
  price_monthly: string
  price_quarterly: string
  price_annually: string
  setup_fee: string
  is_active: boolean
  sort_order: number
  features: string[]
}

interface Template {
  id: string
  name: string
  slug: string
  description: string
  category: string
  plan_presets: PlanPreset[]
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

const emptyPreset: PlanPreset = {
  name: '',
  slug: '',
  description: '',
  cpu_cores: 1,
  memory_mb: 1024,
  disk_gb: 25,
  bandwidth_tb: '1',
  price_monthly: '0',
  price_quarterly: '0',
  price_annually: '0',
  setup_fee: '0',
  is_active: true,
  sort_order: 0,
  features: [],
}

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  category: 'vps',
  is_active: true,
  sort_order: 0,
  plan_presets: [{ ...emptyPreset }] as PlanPreset[],
}

export default function AdminTemplates() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Template | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [applyId, setApplyId] = useState<string | null>(null)
  const [applyForm, setApplyForm] = useState({ product_slug: '', is_active: true })
  const [applying, setApplying] = useState(false)

  const token = useAuthStore((s) => s.token)
  const { t } = useTranslation()

  const fetchTemplates = async () => {
    try {
      const data = await api<Template[]>('/admin/templates')
      setTemplates(data)
    } catch {
      toast.error(t('admin.templates.fetchFailed', { defaultValue: 'Failed to load templates' }))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchTemplates()
  }, [])

  // CRUD handlers
  const openCreate = () => {
    setEditing(null)
    setFormData({ ...emptyForm, plan_presets: [{ ...emptyPreset }] })
    setShowModal(true)
  }

  const openEdit = (tmpl: Template) => {
    setEditing(tmpl)
    setFormData({
      name: tmpl.name,
      slug: tmpl.slug,
      description: tmpl.description || '',
      category: tmpl.category || 'vps',
      is_active: tmpl.is_active,
      sort_order: tmpl.sort_order,
      plan_presets: tmpl.plan_presets?.length ? tmpl.plan_presets : [{ ...emptyPreset }],
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    const body = {
      ...formData,
      plan_presets: formData.plan_presets.map((p) => ({
        ...p,
        features: typeof p.features === 'string'
          ? (p.features as unknown as string).split(',').map((f) => f.trim()).filter(Boolean)
          : p.features,
      })),
    }
    try {
      if (editing) {
        await api(`/admin/templates/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        })
      } else {
        await api('/admin/templates', {
          method: 'POST',
          body: JSON.stringify(body),
        })
      }
      setShowModal(false)
      setLoading(true)
      void fetchTemplates()
    } catch {
      toast.error(t('common.saveError', { defaultValue: 'Save failed' }))
    }
  }

  const handleDelete = async (id: string) => {
    if (!token) return
    try {
      await api(`/admin/templates/${id}`, { method: 'DELETE' })
      setLoading(true)
      void fetchTemplates()
    } catch {
      toast.error(t('common.deleteError', { defaultValue: 'Delete failed' }))
    } finally {
      setConfirmDelete(null)
    }
  }

  const openApply = (tmpl: Template) => {
    setApplyId(tmpl.id)
    setApplyForm({ product_slug: tmpl.slug, is_active: true })
  }

  const handleApply = async () => {
    if (!applyId || !token) return
    setApplying(true)
    try {
      const res = await api<{ product_id: string }>(`/admin/templates/${applyId}/apply`, {
        method: 'POST',
        body: JSON.stringify(applyForm),
      })
      toast.success(t('admin.templates.applySuccess', { defaultValue: 'Product created: ' + res.product_id }))
      setApplyId(null)
    } catch {
      toast.error(t('admin.templates.applyFailed', { defaultValue: 'Failed to apply template' }))
    } finally {
      setApplying(false)
    }
  }

  // Plan preset helpers
  const updatePreset = (index: number, field: string, value: unknown) => {
    setFormData((prev) => {
      const presets = [...prev.plan_presets]
      presets[index] = { ...presets[index], [field]: value }
      return { ...prev, plan_presets: presets }
    })
  }

  const addPreset = () => {
    setFormData((prev) => ({
      ...prev,
      plan_presets: [...prev.plan_presets, { ...emptyPreset, sort_order: prev.plan_presets.length }],
    }))
  }

  const removePreset = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      plan_presets: prev.plan_presets.filter((_, i) => i !== index),
    }))
  }

  const columns = useMemo<ColumnDef<Template, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: () => t('common.name'),
        cell: ({ row }) => <span className="text-text">{row.original.name}</span>,
      },
      {
        accessorKey: 'slug',
        header: () => t('admin.products.slug'),
        cell: ({ row }) => <span className="text-text-secondary">{row.original.slug}</span>,
      },
      {
        accessorKey: 'category',
        header: () => t('common.category'),
        cell: ({ row }) => <span className="text-text-secondary">{row.original.category}</span>,
      },
      {
        id: 'presets_count',
        header: () => t('admin.templates.presetsCount', { defaultValue: 'Plans' }),
        cell: ({ row }) => (
          <span className="text-text-secondary">{row.original.plan_presets?.length ?? 0}</span>
        ),
      },
      {
        accessorKey: 'is_active',
        header: () => t('admin.products.status'),
        cell: ({ row }) => (
          <Badge variant={row.original.is_active ? 'success' : 'default'}>
            {row.original.is_active ? t('status.active') : t('status.inactive')}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: () => t('common.actions'),
        cell: ({ row }) => (
          <div className="flex gap-2">
            <button
              className="text-green-500 hover:text-green-400"
              title={t('admin.templates.apply', { defaultValue: 'Apply' })}
              onClick={() => openApply(row.original)}
            >
              <Play className="w-4 h-4" />
            </button>
            <button
              className="text-primary hover:text-primary/80"
              aria-label={t('common.edit')}
              onClick={() => openEdit(row.original)}
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              className="text-red-500 hover:text-red-400"
              aria-label={t('common.delete')}
              onClick={() => setConfirmDelete(row.original.id)}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [t]
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-text">{t('admin.templates.title')}</h1>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          {t('admin.templates.addTemplate')}
        </Button>
      </div>

      <Card>
        <DataTable
          columns={columns}
          data={templates}
          loading={loading}
          emptyText={t('admin.templates.noTemplates')}
          skeletonCols={6}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? t('admin.templates.editTemplate') : t('admin.templates.addTemplate')}
        className="max-w-2xl"
      >
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t('common.name')}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label={t('admin.products.slug')}
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              required
            />
          </div>
          <Input
            label={t('common.description')}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          {/* Plan Presets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-text">{t('admin.templates.planPresets')}</h3>
              <Button type="button" size="sm" variant="outline" onClick={addPreset}>
                <Plus className="w-3 h-3 mr-1" />
                {t('admin.templates.addPreset')}
              </Button>
            </div>

            {formData.plan_presets.map((preset, idx) => (
              <div key={idx} className="border border-border rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text-secondary">
                    {t('admin.templates.preset')} #{idx + 1}
                  </span>
                  {formData.plan_presets.length > 1 && (
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-400"
                      onClick={() => removePreset(idx)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label={t('common.name')}
                    value={preset.name}
                    onChange={(e) => updatePreset(idx, 'name', e.target.value)}
                    required
                  />
                  <Input
                    label={t('admin.products.slug')}
                    value={preset.slug}
                    onChange={(e) => updatePreset(idx, 'slug', e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <Input
                    label={t('common.cpu')}
                    type="number"
                    value={preset.cpu_cores}
                    onChange={(e) => updatePreset(idx, 'cpu_cores', Number(e.target.value))}
                    required
                  />
                  <Input
                    label={`${t('common.ram')} (MB)`}
                    type="number"
                    value={preset.memory_mb}
                    onChange={(e) => updatePreset(idx, 'memory_mb', Number(e.target.value))}
                    required
                  />
                  <Input
                    label={`${t('common.storage')} (GB)`}
                    type="number"
                    value={preset.disk_gb}
                    onChange={(e) => updatePreset(idx, 'disk_gb', Number(e.target.value))}
                    required
                  />
                  <Input
                    label={`${t('common.bandwidth')} (TB)`}
                    type="number"
                    value={preset.bandwidth_tb}
                    onChange={(e) => updatePreset(idx, 'bandwidth_tb', e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    label={t('admin.products.monthlyPrice')}
                    type="number"
                    step="0.01"
                    value={preset.price_monthly}
                    onChange={(e) => updatePreset(idx, 'price_monthly', e.target.value)}
                    required
                  />
                  <Input
                    label={t('admin.products.quarterlyPrice')}
                    type="number"
                    step="0.01"
                    value={preset.price_quarterly}
                    onChange={(e) => updatePreset(idx, 'price_quarterly', e.target.value)}
                  />
                  <Input
                    label={t('admin.products.annuallyPrice')}
                    type="number"
                    step="0.01"
                    value={preset.price_annually}
                    onChange={(e) => updatePreset(idx, 'price_annually', e.target.value)}
                  />
                </div>
                <Input
                  label={t('admin.products.featuresComma')}
                  value={Array.isArray(preset.features) ? preset.features.join(', ') : preset.features}
                  onChange={(e) => updatePreset(idx, 'features', e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">{editing ? t('common.save') : t('common.create')}</Button>
          </div>
        </form>
      </Modal>

      {/* Apply Template Dialog */}
      <Modal
        open={applyId !== null}
        onClose={() => setApplyId(null)}
        title={t('admin.templates.applyTitle')}
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">{t('admin.templates.applyDesc')}</p>
          <Input
            label={t('admin.templates.productSlug')}
            value={applyForm.product_slug}
            onChange={(e) => setApplyForm({ ...applyForm, product_slug: e.target.value })}
            required
          />
          <label className="flex items-center gap-2 text-sm text-text">
            <input
              type="checkbox"
              checked={applyForm.is_active}
              onChange={(e) => setApplyForm({ ...applyForm, is_active: e.target.checked })}
              className="rounded border-border"
            />
            {t('admin.templates.activateImmediately')}
          </label>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setApplyId(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={() => void handleApply()} disabled={applying}>
              {applying ? t('common.loading') : t('admin.templates.apply')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => { if (confirmDelete) void handleDelete(confirmDelete) }}
        title={t('common.confirmDelete', { defaultValue: 'Confirm Delete' })}
        message={t('admin.templates.confirmDelete')}
        variant="danger"
        confirmText={t('common.delete')}
      />
    </div>
  )
}
