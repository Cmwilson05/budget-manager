export interface Account {
  id: string
  name: string
  current_balance: number
  is_liability: boolean
  sort_order: number
  color_index?: number
  include_in_workbench?: boolean
}

export type Frequency = 'bi-weekly' | 'monthly' | 'quarterly' | 'annually'

export interface BillTemplate {
  id: string
  name: string
  default_amount: number
  frequency: Frequency
  next_due_date: string | null
  last_advanced_at: string | null
}

export interface Transaction {
  id: string
  description: string
  amount: number
  status: 'paid' | 'pending' | 'planning'
  is_in_calc: boolean
  due_date?: string
  sort_order: number
  tag?: string
}
