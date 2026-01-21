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

interface Account {
  id: string
  name: string
  current_balance: number
  is_liability: boolean
  sort_order: number
  include_in_workbench?: boolean // Computed field
}

interface AccountsProps {
  userId: string
  onBalanceChange: (netWorth: number) => void
  onAccountsUpdate?: (accounts: Account[]) => void
}

// Sortable Row Component
function SortableAccountRow({ 
  account, 
  onEdit, 
  onDelete,
  onToggleWorkbench
}: { 
  account: Account, 
  onEdit: (acc: Account) => void, 
  onDelete: (id: string) => void,
  onToggleWorkbench: (id: string, currentValue: boolean) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: account.id })

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
      className={`hover:bg-gray-50 transition-colors ${isDragging ? 'bg-blue-50 shadow-lg opacity-80' : 'bg-white'}`}
    >
      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center gap-2">
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
        
        {/* Workbench Toggle */}
        <input
          type="checkbox"
          checked={account.include_in_workbench !== false}
          onChange={() => onToggleWorkbench(account.id, account.include_in_workbench !== false)}
          className="rounded text-blue-600 focus:ring-blue-500 mr-2"
          title="Include in Workbench Calculation"
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        />

        <button 
          onClick={() => onEdit(account)}
          className="hover:text-blue-600 hover:underline text-left truncate max-w-[120px] md:max-w-none"
        >
          {account.name}
        </button>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500 font-mono">
        ${account.current_balance.toFixed(2)}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-right hidden sm:table-cell">
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          account.is_liability ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
        }`}>
          {account.is_liability ? 'Liability' : 'Asset'}
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
        <button
          onClick={() => onEdit(account)}
          className="text-blue-600 hover:text-blue-900"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(account.id)}
          className="text-red-600 hover:text-red-900"
        >
          Delete
        </button>
      </td>
    </tr>
  )
}

export default function Accounts({ userId, onBalanceChange, onAccountsUpdate }: AccountsProps) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [excludedIds, setExcludedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Form state
  const [name, setName] = useState('')
  const [balance, setBalance] = useState('')
  const [isLiability, setIsLiability] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    // Load excluded IDs from local storage
    const saved = localStorage.getItem('budget-manager-excluded-accounts')
    if (saved) {
      try {
        setExcludedIds(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse excluded accounts', e)
      }
    }
    fetchAccounts()
  }, [])

  useEffect(() => {
    // Calculate net worth based on ALL accounts (for display in Accounts widget)
    const totalAssets = accounts
      .filter(a => !a.is_liability)
      .reduce((sum, a) => sum + a.current_balance, 0)

    const totalLiabilities = accounts
      .filter(a => a.is_liability)
      .reduce((sum, a) => sum + a.current_balance, 0)

    // Calculate workbench balance based ONLY on selected accounts (not in excludedIds)
    const workbenchAssets = accounts
      .filter(a => !a.is_liability && !excludedIds.includes(a.id))
      .reduce((sum, a) => sum + a.current_balance, 0)

    const workbenchLiabilities = accounts
      .filter(a => a.is_liability && !excludedIds.includes(a.id))
      .reduce((sum, a) => sum + a.current_balance, 0)
      
    const workbenchNetWorth = workbenchAssets - workbenchLiabilities

    // Pass the WORKBENCH net worth to the parent
    onBalanceChange(workbenchNetWorth)
    
    if (onAccountsUpdate) {
      onAccountsUpdate(accounts)
    }
  }, [accounts, excludedIds, onBalanceChange, onAccountsUpdate])

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })
      
      if (error) throw error
      setAccounts(data || [])
    } catch (error) {
      console.error('Error fetching accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (active.id !== over?.id) {
      setAccounts((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over?.id)
        
        const newOrder = arrayMove(items, oldIndex, newIndex)
        
        const updates = newOrder.map((acc, index) => ({
          id: acc.id,
          sort_order: index
        }))

        updates.forEach(async (update) => {
           await supabase.from('accounts').update({ sort_order: update.sort_order }).eq('id', update.id)
        })

        return newOrder
      })
    }
  }

  const toggleWorkbenchInclusion = (id: string, currentIncluded: boolean) => {
    let newExcludedIds: string[]
    
    if (currentIncluded) {
      // If currently included, we want to exclude it
      newExcludedIds = [...excludedIds, id]
    } else {
      // If currently excluded, we want to include it (remove from excluded list)
      newExcludedIds = excludedIds.filter(exId => exId !== id)
    }
    
    setExcludedIds(newExcludedIds)
    localStorage.setItem('budget-manager-excluded-accounts', JSON.stringify(newExcludedIds))
  }

  const resetForm = () => {
    setName('')
    setBalance('')
    setIsLiability(false)
    setIsAdding(false)
    setEditingId(null)
  }

  const startEditing = (account: Account) => {
    setName(account.name)
    setBalance(account.current_balance.toString())
    setIsLiability(account.is_liability)
    setEditingId(account.id)
    setIsAdding(true)
  }

  const saveAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !balance) return

    try {
      if (editingId) {
        const { error } = await supabase
          .from('accounts')
          .update({
            name,
            current_balance: parseFloat(balance),
            is_liability: isLiability
          })
          .eq('id', editingId)

        if (error) throw error

        setAccounts(accounts.map(acc => 
          acc.id === editingId 
            ? { ...acc, name, current_balance: parseFloat(balance), is_liability: isLiability }
            : acc
        ))
      } else {
        const maxSort = accounts.length > 0 ? Math.max(...accounts.map(a => a.sort_order || 0)) : 0

        const { data, error } = await supabase
          .from('accounts')
          .insert([
            {
              user_id: userId,
              name,
              current_balance: parseFloat(balance),
              is_liability: isLiability,
              sort_order: maxSort + 1
            }
          ])
          .select()

        if (error) throw error
        if (data) {
          setAccounts([...accounts, data[0]])
        }
      }
      resetForm()
    } catch (error) {
      console.error('Error saving account:', error)
      alert('Error saving account')
    }
  }

  const deleteAccount = async (id: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return

    try {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id)

      if (error) throw error
      setAccounts(accounts.filter(acc => acc.id !== id))
    } catch (error) {
      console.error('Error deleting account:', error)
    }
  }

  const totalAssets = accounts
    .filter(a => !a.is_liability)
    .reduce((sum, a) => sum + a.current_balance, 0)

  const totalLiabilities = accounts
    .filter(a => a.is_liability)
    .reduce((sum, a) => sum + a.current_balance, 0)

  const netWorth = totalAssets - totalLiabilities

  if (loading) return <div className="text-gray-500">Loading accounts...</div>

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Accounts</h2>
        <button
          onClick={() => {
            resetForm()
            setIsAdding(!isAdding)
          }}
          className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100 transition"
        >
          {isAdding ? 'Cancel' : '+ Add Account'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={saveAccount} className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded text-sm"
                placeholder="e.g. Chase Checking"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Balance</label>
              <input
                type="number"
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full px-3 py-2 border rounded text-sm"
                placeholder="0.00"
                required
              />
            </div>
            <div className="flex items-center h-10">
              <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isLiability}
                  onChange={(e) => setIsLiability(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Is Liability (Credit Card)</span>
              </label>
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
            >
              {editingId ? 'Update Account' : 'Save Account'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <div className="text-xs text-green-600 uppercase font-bold">Total Assets</div>
          <div className="text-2xl font-bold text-green-700">${totalAssets.toFixed(2)}</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
          <div className="text-xs text-red-600 uppercase font-bold">Total Liabilities</div>
          <div className="text-2xl font-bold text-red-700">${totalLiabilities.toFixed(2)}</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div className="text-xs text-blue-600 uppercase font-bold">Net Worth</div>
          <div className="text-2xl font-bold text-blue-700">${netWorth.toFixed(2)}</div>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden overflow-x-auto">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Type</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <SortableContext 
                items={accounts.map(a => a.id)}
                strategy={verticalListSortingStrategy}
              >
                {accounts.map((account) => (
                  <SortableAccountRow 
                    key={account.id} 
                    account={{
                      ...account,
                      include_in_workbench: !excludedIds.includes(account.id)
                    }}
                    onEdit={startEditing}
                    onDelete={deleteAccount}
                    onToggleWorkbench={toggleWorkbenchInclusion}
                  />
                ))}
              </SortableContext>
              {accounts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    No accounts added yet.
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