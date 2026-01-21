import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
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

interface Transaction {
  id: string
  description: string
  amount: number
  status: 'paid' | 'pending' | 'planning'
  is_in_calc: boolean
  due_date?: string
  sort_order: number
  tag?: string
}

interface WorkbenchProps {
  userId: string
  startingBalance: number
  refreshTrigger?: number
  title?: string
  filterTag?: string
  accountId?: string // New prop to link to a specific account
}

// Sortable Transaction Row
function SortableTransactionRow({ 
  transaction, 
  onToggleCalc, 
  onDelete 
}: { 
  transaction: Transaction, 
  onToggleCalc: (id: string, current: boolean) => void, 
  onDelete: (id: string) => void 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: transaction.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    position: isDragging ? 'relative' as const : 'static' as const,
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
          className="cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing p-1 flex-shrink-0"
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
          className={`w-10 h-6 rounded-full transition-colors duration-200 ease-in-out relative focus:outline-none flex-shrink-0 ${
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
        {transaction.due_date ? new Date(transaction.due_date).toLocaleDateString() : '-'}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 truncate max-w-[120px] md:max-w-none">
        {transaction.description}
      </td>
      <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-mono font-medium ${
        transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
      }`}>
        {transaction.amount >= 0 ? '+' : ''}{transaction.amount.toFixed(2)}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
        <button
          onClick={() => onDelete(transaction.id)}
          className="text-red-400 hover:text-red-600"
        >
          &times;
        </button>
      </td>
    </tr>
  )
}

export default function Workbench({ userId, startingBalance, refreshTrigger, title = "Forecasting Workbench", filterTag, accountId }: WorkbenchProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  
  // New Transaction State
  const [newDesc, setNewDesc] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newDate, setNewDate] = useState('')
  const [isIncome, setIsIncome] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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
          id: t.id,
          sort_order: index
        }))

        updates.forEach(async (update) => {
           await supabase.from('transactions').update({ sort_order: update.sort_order }).eq('id', update.id)
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

    // Get max sort order
    const maxSort = transactions.length > 0 ? Math.max(...transactions.map(t => t.sort_order || 0)) : 0

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
            sort_order: maxSort + 1,
            tag: filterTag || null // Save with the current tag (e.g., 'credit_card_1')
          }
        ])
        .select()

      if (error) throw error

      if (data) {
        setTransactions([...transactions, data[0]])
        setNewDesc('')
        setNewAmount('')
        setNewDate('')
        setIsIncome(false)
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

  const activeTransactions = transactions.filter(t => t.is_in_calc)
  const plannedIncome = activeTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0)
  const plannedExpenses = activeTransactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + t.amount, 0)
  
  const projectedBalance = startingBalance + plannedIncome + plannedExpenses

  if (loading) return <div className="text-gray-500">Loading workbench...</div>

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 mb-8">
      <div className="bg-gray-800 text-white p-6">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
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
          <div className="bg-blue-900 p-3 rounded-lg border border-blue-500 shadow-blue-500/50 shadow-sm">
            <div className="text-xs text-blue-200 uppercase font-bold">Projected</div>
            <div className="text-2xl font-mono font-bold text-white">${projectedBalance.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <form onSubmit={addTransaction} className="flex flex-col md:flex-row gap-3 items-end">
          <div className="flex-grow">
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
          <div className="flex gap-2 w-full md:w-auto">
            <div className="w-1/2 md:w-32">
              <label className="block text-xs font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="number"
                step="0.01"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="w-full px-3 py-2 border rounded text-sm"
                placeholder="0.00"
                required
              />
            </div>
            <div className="w-1/2 md:w-36">
              <label className="block text-xs font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3 py-2 border rounded text-sm"
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">Calc</th>
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