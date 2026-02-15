import type { LucideIcon } from 'lucide-react'

// ---- Badge variant type (shared across status helpers) ----
export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

// ---- Auth ----
export interface User {
  id: string
  email: string
  name: string
  role: string
  created_at: string
}

// ---- Orders ----
export interface Order {
  id: string
  status: string
  total: number
  created_at: string
}

export interface AdminOrder {
  id: string
  customer_name: string
  customer_email: string
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  amount: number
  items?: AdminOrderItem[]
  created_at: string
}

export interface AdminOrderItem {
  id: string
  plan_name: string
  quantity: number
  unit_price: number
}

// ---- Invoices ----
export interface Invoice {
  id: string
  invoice_number: string
  status: string
  total: number
  created_at: string
}

export interface AdminInvoice {
  id: string
  invoice_number: string
  customer_name: string
  customer_email: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  amount: number
  created_at: string
}

// ---- Services ----
export interface Service {
  id: string
  hostname: string
  ip_address: string
  plan_name: string
  status: string
}

// ---- Payments ----
export interface Payment {
  id: string
  amount: number
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  method: string
  created_at: string
}

// ---- Customers ----
export interface Customer {
  id: string
  name: string
  email: string
  role: string
  created_at: string
}

// ---- Dashboard Stats ----
export interface PortalStats {
  active_services: number
  pending_orders: number
  unpaid_invoices: number
  total_spent: number
}

export interface AdminDashboardStats {
  total_customers: number
  total_orders: number
  revenue: number
  active_services: number
}

// ---- StatCard descriptor (used by Dashboard components) ----
export interface StatCardItem {
  title: string
  value: string | number
  icon: LucideIcon
  iconColor: string
  iconBg: string
}

// ---- Product Catalog ----
export interface ProductPlan {
  id: string
  product_id: string
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

export interface ProductWithPlans {
  id: string
  name: string
  slug: string
  description: string
  category: string
  is_active: boolean
  sort_order: number
  plans: ProductPlan[]
}
