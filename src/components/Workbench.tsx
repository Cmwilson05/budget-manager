import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { triggerCapture } from './Captures'
import { getAccountColor } from '../lib/accountColors'
import CurrencyInput from './CurrencyInput'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Account, BillTemplate, Transaction } from '../types'

interface WorkbenchProps {
  userId: string
  startingBalance: number
  refreshTrigger?: number
  title?: string
  filterTag?: string
  accountId?: string
  accounts?: Account[]
  bills?: BillTemplate[]
}

// Sortable Transaction Row
function SortableTransactionRow({
  transaction,
  onToggleCalc,
  onDelete,
  onUpdate,
  onDuplicate
}: {
  transaction: Transaction,
  onToggleCalc: (id: string, current: boolean) => void,
  onDelete: (id: string) => void,
  onUpdate: (id: string, updates: Partial<Transaction>) => void,
  onDuplicate: (id: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editDesc, setEditDesc] = useState(transaction.description)
  const [editAmount, setEditAmount] = useState(Math.abs(transaction.amount).toString())
  const [editDate, setEditDate] = useState(transaction.due_date || '')
  const [editIsIncome, setEditIsIncome] = useState(transaction.amount >= 0)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: transaction.id, disabled: isEditing })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    position: isDragging ? 'relative' as const : 'static' as const,
  }

  const handleSave = () => {
    const amount = parseFloat(editAmount)
    if (isNaN(amount)) return

    onUpdate(transaction.id, {
      description: editDesc,
      amount: editIsIncome ? amount : -amount,
      due_date: editDate || undefined
    })
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <tr ref={setNodeRef} style={style} className="bg-blue-50">
        <td className="px-4 py-3 align-top">
          <div className="flex items-center gap-2 mt-1">
            <button disabled className="p-1 opacity-20">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="12" r="1" />
                <circle cx="9" cy="5" r="1" />
                <circle cx="9" cy="19" r="1" />
                <circle cx="15" cy="12" r="1" />
                <circle cx="15" cy="5" r="1" />
                <circle cx="15" cy="19" r="1" />
              </svg>
            </button>
            <div className={`w-10 h-6 rounded-full opacity-50 relative ${transaction.is_in_calc ? 'bg-blue-600' : 'bg-gray-300'}`}>
              <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full ${transaction.is_in_calc ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </div>
        </td>
        <td colSpan={3} className="px-4 py-3">
          <div className="flex flex-col gap-3">
            <div className="flex-1">
              <label className="block text-[10px] font-medium text-gray-500 uppercase mb-0.5">Description</label>
              <input
                type="text"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                className="w-full px-2 py-1 text-sm border rounded"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 overflow-hidden">
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] font-medium text-gray-500 uppercase mb-0.5">Due Date</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  className="w-full px-2 py-1 text-sm border rounded min-h-[30px] box-border"
                />
              </div>
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] font-medium text-gray-500 uppercase mb-0.5">Amount</label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editIsIncome}
                    onChange={(e) => setEditIsIncome(e.target.checked)}
                    className="rounded text-green-600"
                  />
                  <CurrencyInput
                    value={editAmount}
                    onChange={setEditAmount}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    className="w-full px-2 py-1 text-sm border rounded text-right font-mono box-border"
                  />
                </div>
              </div>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-right align-top">
          <div className="flex flex-col justify-end gap-2 mt-1">
            <button onClick={handleSave} className="text-green-600 hover:text-green-800 font-medium text-sm">Save</button>
            <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-gray-700 text-sm">Cancel</button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr 
      ref={setNodeRef} 
      style={style} 
      className={`${!transaction.is_in_calc ? "bg-gray-50 opacity-60" : "bg-white"} ${isDragging ? 'shadow-lg opacity-80 z-10' : ''}`}
    >
      <td className="px-4 py-3 whitespace-nowrap flex items-center gap-2">
        {/* Drag Handle */}
        <button 
          {...attributes} 
          {...listeners}
          className="cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing p-1 flex-shrink-0 hide-in-screenshot"
          title="Drag to reorder"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="12" r="1" />
            <circle cx="9" cy="5" r="1" />
            <circle cx="9" cy="19" r="1" />
            <circle cx="15" cy="12" r="1" />
            <circle cx="15" cy="5" r="1" />
            <circle cx="15" cy="19" r="1" />
          </svg>
        </button>

        <button
          onClick={() => onToggleCalc(transaction.id, transaction.is_in_calc)}
          className={`w-10 h-6 rounded-full transition-colors duration-200 ease-in-out relative focus:outline-none flex-shrink-0 hide-in-screenshot ${
            transaction.is_in_calc ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${
              transaction.is_in_calc ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
        {transaction.due_date ? (
          (() => {
            const [year, month, day] = transaction.due_date.split('-')
            return `${parseInt(month)}/${parseInt(day)}/${year.slice(-2)}`
          })()
        ) : '-'}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 truncate max-w-[120px] md:max-w-none">
        {transaction.description}
      </td>
      <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-mono font-medium ${
        transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
      }`}>
        {transaction.amount >= 0 ? '+' : ''}{transaction.amount.toFixed(2)}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium hide-in-screenshot">
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-600 hover:text-blue-800"
          >
            Edit
          </button>
          <button
            onClick={() => onDuplicate(transaction.id)}
            className="text-gray-400 hover:text-gray-600"
            title="Duplicate"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          <button
            onClick={() => onDelete(transaction.id)}
            className="text-red-400 hover:text-red-600"
          >
            &times;
          </button>
        </div>
      </td>
    </tr>
  )
}

type SortField = 'description' | 'amount' | 'due_date'

export default function Workbench({ userId, startingBalance, refreshTrigger, title = "Forecasting Workbench", filterTag, accounts = [], bills = [] }: WorkbenchProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState<SortField>('due_date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // New Transaction State
  const [newDesc, setNewDesc] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0])
  const [isIncome, setIsIncome] = useState(false)

  // Generate a unique storage key for this workbench instance
  const storageKey = `workbench_content_${filterTag || 'main'}`

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Load saved form state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.newDesc) setNewDesc(parsed.newDesc)
        if (parsed.newAmount) setNewAmount(parsed.newAmount)
        if (parsed.newDate) setNewDate(parsed.newDate)
        if (parsed.isIncome !== undefined) setIsIncome(parsed.isIncome)
      }
    } catch (e) {
      console.error('Failed to load workbench content from localStorage', e)
    }
  }, [storageKey])

  // Save form state to localStorage whenever it changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const content = { newDesc, newAmount, newDate, isIncome }
      localStorage.setItem(storageKey, JSON.stringify(content))
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [newDesc, newAmount, newDate, isIncome, storageKey])

  useEffect(() => {
    fetchTransactions()
  }, [refreshTrigger, filterTag])

  const fetchTransactions = async () => {
    try {
      // DEBUG: Log what we are trying to do
      console.log(`Fetching transactions for ${title}. FilterTag: ${filterTag}`)

      let query = supabase
        .from('transactions')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('due_date', { ascending: true })
        .order('created_at', { ascending: false })

      // Apply filter if provided
      if (filterTag) {
        query = query.eq('tag', filterTag)
      } else {
        // If no filterTag is provided (Main Workbench), we want to EXCLUDE tagged items
        // so they don't show up in the main list.
        // NOTE: If this .is('tag', null) is causing the 500 error, it implies the column might not be queryable yet.
        // Let's try to be more robust.
        query = query.is('tag', null)
      }

      const { data, error } = await query
      
      if (error) {
        console.error('Supabase Query Error:', error)
        throw error
      }
      setTransactions(data || [])
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (active.id !== over?.id) {
      setTransactions((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over?.id)
        
        const newOrder = arrayMove(items, oldIndex, newIndex)
        
        // Persist new order
        const updates = newOrder.map((t, index) => ({
          ...t,
          user_id: userId,
          sort_order: index
        }))

        console.log('Updating all transactions sort order...', updates)
        supabase.from('transactions').upsert(updates).then(({ error }) => {
          if (error) {
            console.error('Error updating sort order:', error)
            fetchTransactions()
          }
        })

        return newOrder
      })
    }
  }

  const addTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDesc || !newAmount) return

    const amountVal = parseFloat(newAmount)
    const finalAmount = isIncome ? Math.abs(amountVal) : -Math.abs(amountVal)

    // Get min sort order to append to top
    const minSort = transactions.length > 0 ? Math.min(...transactions.map(t => t.sort_order || 0)) : 0

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([
          {
            user_id: userId,
            description: newDesc,
            amount: finalAmount,
            status: 'planning',
            is_in_calc: true,
            due_date: newDate || null,
            sort_order: minSort - 1,
            tag: filterTag || null // Save with the current tag (e.g., 'credit_card_1')
          }
        ])
        .select()

      if (error) throw error

      if (data) {
        setTransactions([data[0], ...transactions])
        setNewDesc('')
        setNewAmount('')
        setNewDate(new Date().toISOString().split('T')[0])
        setIsIncome(false)
        // Clear saved form state after successful submission
        localStorage.removeItem(storageKey)
      }
    } catch (error) {
      console.error('Error adding transaction:', error)
    }
  }

  const toggleCalc = async (id: string, currentVal: boolean) => {
    setTransactions(transactions.map(t =>
      t.id === id ? { ...t, is_in_calc: !currentVal } : t
    ))

    try {
      const { error } = await supabase
        .from('transactions')
        .update({ is_in_calc: !currentVal })
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error updating transaction:', error)
      fetchTransactions()
    }
  }

  const toggleAllCalc = async () => {
    if (transactions.length === 0) return

    // If any are on, turn all off. Otherwise turn all on.
    const anyOn = transactions.some(t => t.is_in_calc)
    const newValue = !anyOn

    // Optimistic update
    setTransactions(transactions.map(t => ({ ...t, is_in_calc: newValue })))

    try {
      const ids = transactions.map(t => t.id)
      const { error } = await supabase
        .from('transactions')
        .update({ is_in_calc: newValue })
        .in('id', ids)

      if (error) throw error
    } catch (error) {
      console.error('Error toggling all transactions:', error)
      fetchTransactions()
    }
  }

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)

      if (error) throw error
      setTransactions(transactions.filter(t => t.id !== id))
    } catch (error) {
      console.error('Error deleting transaction:', error)
    }
  }

  const duplicateTransaction = async (id: string) => {
    const originalIndex = transactions.findIndex(t => t.id === id)
    if (originalIndex === -1) return

    const transactionToDuplicate = transactions[originalIndex]
    const currentSort = transactionToDuplicate.sort_order || 0

    try {
      // Shift all subsequent transactions' sort_order to make room
      const transactionsToShift = transactions.slice(originalIndex + 1)
      if (transactionsToShift.length > 0) {
        const shiftUpdates = transactionsToShift.map(t => ({
          ...t,
          user_id: userId,
          sort_order: (t.sort_order || 0) + 1
        }))
        await supabase.from('transactions').upsert(shiftUpdates)
      }

      // Insert the duplicate with sort_order right after the original
      const { data, error } = await supabase
        .from('transactions')
        .insert([
          {
            user_id: userId,
            description: transactionToDuplicate.description,
            amount: transactionToDuplicate.amount,
            status: transactionToDuplicate.status,
            is_in_calc: transactionToDuplicate.is_in_calc,
            due_date: transactionToDuplicate.due_date || null,
            sort_order: currentSort + 1,
            tag: transactionToDuplicate.tag || null
          }
        ])
        .select()

      if (error) throw error

      if (data) {
        // Insert the duplicate right after the original in the list
        const newTransactions = [...transactions]
        // Update sort orders for shifted items in local state
        for (let i = originalIndex + 1; i < newTransactions.length; i++) {
          newTransactions[i] = { ...newTransactions[i], sort_order: (newTransactions[i].sort_order || 0) + 1 }
        }
        newTransactions.splice(originalIndex + 1, 0, data[0])
        setTransactions(newTransactions)
      }
    } catch (error) {
      console.error('Error duplicating transaction:', error)
      fetchTransactions()
    }
  }

  const handleSort = async (field: SortField) => {
    const newSortOrder = sortField === field ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'asc'
    setSortField(field)
    setSortOrder(newSortOrder)

    const modifier = newSortOrder === 'asc' ? 1 : -1

    const sorted = [...transactions].sort((a, b) => {
      switch (field) {
        case 'description':
          return modifier * a.description.localeCompare(b.description)
        case 'amount':
          return modifier * (a.amount - b.amount)
        case 'due_date':
          if (!a.due_date && !b.due_date) return 0
          if (!a.due_date) return 1
          if (!b.due_date) return -1
          return modifier * a.due_date.localeCompare(b.due_date)
        default:
          return 0
      }
    })

    // Optimistically update UI
    setTransactions(sorted)

    // Persist new order
    try {
      const updates = sorted.map((t, index) => ({
        ...t,
        user_id: userId,
        sort_order: index,
      }))

      const { error } = await supabase
        .from('transactions')
        .upsert(updates)

      if (error) throw error
    } catch (error) {
      console.error('Error persisting sort order:', error)
      fetchTransactions()
    }
  }

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    // Optimistic update
    setTransactions(transactions.map(t => 
      t.id === id ? { ...t, ...updates } : t
    ))

    try {
      const { error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error updating transaction:', error)
      fetchTransactions() // Rollback on error
    }
  }

  const activeTransactions = transactions.filter(t => t.is_in_calc)
  const plannedIncome = activeTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0)
  const plannedExpenses = activeTransactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + t.amount, 0)

  const projectedBalance = startingBalance + plannedIncome + plannedExpenses

  // Auto-Budget calculations
  const totalCash = accounts
    .filter(a => !a.is_liability)
    .reduce((sum, a) => sum + a.current_balance, 0)

  const fixedMonthly = bills
    .filter(b => b.frequency !== 'annually')
    .reduce((sum, b) => sum + b.default_amount, 0)

  const safeToSpend = totalCash - fixedMonthly

  const [showAutoBudget, setShowAutoBudget] = useState(false)

  if (loading) return <div className="text-gray-500">Loading workbench...</div>

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
      <div className="bg-gray-800 text-white p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold">{title}</h2>
            {/* Selected accounts indicator - only for main workbench */}
            {!filterTag && accounts.length > 0 && (() => {
              try {
                const excludedIds = JSON.parse(localStorage.getItem('budget-manager-excluded-accounts') || '[]')
                const selectedAccounts = accounts.filter(a => !excludedIds.includes(a.id))
                if (selectedAccounts.length > 0) {
                  return (
                    <div className="flex flex-wrap items-center gap-1 mt-2">
                      <span className="text-[10px] text-gray-400 mr-1">Accounts Selected:</span>
                      {selectedAccounts.map(account => {
                        const color = account.is_liability
                          ? { bg: 'bg-red-600', border: 'border-red-400' }
                          : getAccountColor(account.color_index ?? 0)
                        return (
                          <span
                            key={account.id}
                            className={`text-[10px] px-2 py-0.5 rounded-full ${color.bg} ${color.border} border text-white`}
                          >
                            {account.name}
                          </span>
                        )
                      })}
                    </div>
                  )
                }
              } catch (e) {
                console.error('Error reading excluded accounts', e)
              }
              return null
            })()}
          </div>
          <div className="flex gap-2 hide-in-screenshot">
            {accounts.length > 0 && !filterTag && (
              <button
                onClick={() => setShowAutoBudget(!showAutoBudget)}
                className={`text-xs px-2 py-1 rounded border transition-colors ${
                  showAutoBudget
                    ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600'
                }`}
                title="Show Auto-Budget Snapshot"
              >
                Auto-Budget
              </button>
            )}
            <div className="flex gap-1 text-[10px]">
              <button
                onClick={() => handleSort('description')}
                className={`px-2 py-0.5 rounded transition ${sortField === 'description' ? 'bg-blue-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
              >
                Name {sortField === 'description' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => handleSort('amount')}
                className={`px-2 py-0.5 rounded transition ${sortField === 'amount' ? 'bg-blue-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
              >
                Amount {sortField === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => handleSort('due_date')}
                className={`px-2 py-0.5 rounded transition ${sortField === 'due_date' ? 'bg-blue-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
              >
                Due {sortField === 'due_date' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
            </div>
          </div>
        </div>

        {showAutoBudget && (
          <div className="mb-4 bg-gray-900 rounded-lg p-4 border border-gray-600 font-mono text-sm">
            <div className="text-gray-400 mb-2">--- SNAPSHOT {new Date().toLocaleDateString()} ---</div>
            <div className="flex justify-between text-green-400">
              <span>Total Cash:</span>
              <span>+${totalCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-red-400">
              <span>Fixed Monthly:</span>
              <span>-${fixedMonthly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="border-t border-gray-600 my-2"></div>
            <div className={`flex justify-between font-bold ${safeToSpend >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              <span>Safe to Spend:</span>
              <span>{safeToSpend >= 0 ? '+' : ''}${safeToSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="bg-gray-700 p-3 rounded-lg">
            <div className="text-xs text-gray-400 uppercase">Current</div>
            <div className="text-xl font-mono font-bold">${startingBalance.toFixed(2)}</div>
          </div>
          <div className="bg-gray-700 p-3 rounded-lg">
            <div className="text-xs text-gray-400 uppercase">Income</div>
            <div className="text-xl font-mono font-bold text-green-400">+${plannedIncome.toFixed(2)}</div>
          </div>
          <div className="bg-gray-700 p-3 rounded-lg">
            <div className="text-xs text-gray-400 uppercase">Expenses</div>
            <div className="text-xl font-mono font-bold text-red-400">-${Math.abs(plannedExpenses).toFixed(2)}</div>
          </div>
          <div className="bg-blue-900 p-3 rounded-lg border border-blue-500 shadow-blue-500/50 shadow-sm relative group">
            <div className="text-xs text-blue-200 uppercase font-bold">Projected</div>
            <div className="text-2xl font-mono font-bold text-white">${projectedBalance.toFixed(2)}</div>
            <button
              onClick={() => {
                // Get visible account names for the capture note
                let captureNote = title
                if (!filterTag && accounts.length > 0) {
                  try {
                    const excludedIds = JSON.parse(localStorage.getItem('budget-manager-excluded-accounts') || '[]')
                    const visibleAccounts = accounts.filter(a => !excludedIds.includes(a.id))
                    if (visibleAccounts.length > 0) {
                      captureNote = visibleAccounts.map(a => a.name).join(', ')
                    }
                  } catch (e) {
                    console.error('Error reading excluded accounts', e)
                  }
                }
                triggerCapture(projectedBalance, captureNote)
              }}
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-blue-300 hover:text-white p-1 hide-in-screenshot"
              title="Capture this projection"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 bg-gray-50 border-b border-gray-200 hide-in-screenshot">
        <form onSubmit={addTransaction} className="flex flex-col md:flex-row gap-3 items-start md:items-end">
          <div className="w-full md:flex-grow">
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm"
              placeholder="e.g. Rent"
              required
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto items-start sm:items-end overflow-hidden">
            <div className="w-full sm:flex-1 md:w-32">
              <label className="block text-xs font-medium text-gray-700 mb-1">Amount</label>
              <CurrencyInput
                value={newAmount}
                onChange={setNewAmount}
                className="w-full px-3 py-2 border rounded text-sm box-border"
                placeholder="0.00"
                required
              />
            </div>
            <div className="w-full sm:flex-1 md:w-40 min-w-0">
              <label className="block text-xs font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3 py-2 border rounded text-sm min-h-[38px] box-border"
              />
            </div>
          </div>
          <div className="flex items-center h-10 pb-1">
             <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isIncome}
                  onChange={(e) => setIsIncome(e.target.checked)}
                  className="rounded text-green-600 focus:ring-green-500"
                />
                <span className={isIncome ? "text-green-700 font-medium" : ""}>Income?</span>
              </label>
          </div>
          <button
            type="submit"
            className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-700 transition w-full md:w-auto"
          >
            Add
          </button>
        </form>
      </div>

      <div className="overflow-x-auto">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <span>Calc</span>
                    <button
                      onClick={toggleAllCalc}
                      className={`w-5 h-5 rounded border transition-colors flex items-center justify-center hide-in-screenshot ${
                        transactions.length > 0 && transactions.every(t => t.is_in_calc)
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : transactions.some(t => t.is_in_calc)
                          ? 'bg-blue-300 border-blue-400 text-white'
                          : 'bg-gray-200 border-gray-300 text-gray-500'
                      }`}
                      title={transactions.some(t => t.is_in_calc) ? 'Toggle all off' : 'Toggle all on'}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </button>
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <SortableContext 
                items={transactions.map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {transactions.map((t) => (
                  <SortableTransactionRow
                    key={t.id}
                    transaction={t}
                    onToggleCalc={toggleCalc}
                    onDelete={deleteTransaction}
                    onUpdate={updateTransaction}
                    onDuplicate={duplicateTransaction}
                  />
                ))}
              </SortableContext>
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </DndContext>
      </div>
    </div>
  )
}