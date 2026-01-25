import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export type Frequency = 'bi-weekly' | 'monthly' | 'quarterly' | 'annually'

export interface BillTemplate {
  id: string
  name: string
  default_amount: number
  frequency: Frequency
  next_due_date: string | null
  last_advanced_at: string | null
}

interface WorkbenchOption {
  title: string
  tag?: string
}

interface BillScheduleProps {
  userId: string
  onTransactionAdded: () => void
  workbenchOptions?: WorkbenchOption[]
  onBillsUpdate?: (bills: BillTemplate[]) => void
}

function BillRow({
  template,
  onUpdate,
  onDelete,
  onAdvance,
  onAddToWorkbench,
  workbenchOptions,
  getFrequencyColor,
  formatDate,
  formatLastAdvanced,
  isDueSoon
}: {
  template: BillTemplate,
  onUpdate: (id: string, updates: Partial<BillTemplate>) => Promise<void>,
  onDelete: (id: string) => Promise<void>,
  onAdvance: (template: BillTemplate) => Promise<void>,
  onAddToWorkbench: (template: BillTemplate, tag?: string) => Promise<void>,
  workbenchOptions: WorkbenchOption[],
  getFrequencyColor: (freq: Frequency) => string,
  formatDate: (date: string | null) => string,
  formatLastAdvanced: (date: string | null) => string | null,
  isDueSoon: boolean
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(template.name)
  const [editAmount, setEditAmount] = useState(template.default_amount.toString())
  const [editFrequency, setEditFrequency] = useState<Frequency>(template.frequency)
  const [editDueDate, setEditDueDate] = useState(template.next_due_date || '')
  const [openMenuId, setOpenMenuId] = useState(false)

  const handleSave = async () => {
    if (!editName || !editAmount) return
    await onUpdate(template.id, {
      name: editName,
      default_amount: parseFloat(editAmount),
      frequency: editFrequency,
      next_due_date: editDueDate || null
    })
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="p-2 bg-blue-50 rounded border border-blue-200 text-sm space-y-2 hide-in-screenshot">
        <input
          type="text"
          placeholder="Name"
          className="w-full px-2 py-1 border rounded"
          value={editName}
          onChange={e => setEditName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        <div className="flex flex-col sm:flex-row gap-2 overflow-hidden">
          <div className="w-full sm:w-1/2">
            <input
              type="number"
              step="0.01"
              placeholder="Amount"
              className="w-full px-2 py-1 border rounded box-border"
              value={editAmount}
              onChange={e => setEditAmount(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
          <div className="w-full sm:w-1/2 min-w-0">
            <input
              type="date"
              className="w-full px-2 py-1 border rounded min-h-[30px] box-border"
              value={editDueDate}
              onChange={e => setEditDueDate(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            className="flex-1 px-2 py-1 border rounded bg-white"
            value={editFrequency}
            onChange={e => setEditFrequency(e.target.value as Frequency)}
          >
            <option value="bi-weekly">Bi-Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annually">Annually</option>
          </select>
          <div className="flex gap-2">
            <button onClick={handleSave} className="text-green-600 hover:text-green-800 font-medium">Save</button>
            <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-gray-700">Cancel</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-2 hover:bg-gray-50 rounded border group transition ${isDueSoon ? 'bg-yellow-50 border-l-4 border-l-amber-400 border-t-transparent border-r-transparent border-b-transparent' : 'border-transparent hover:border-gray-200'}`}>
      <div className="flex justify-between items-center">
        <div 
          className="cursor-pointer hover:text-blue-600 flex-1 min-w-0 pr-2"
          onClick={() => setIsEditing(true)}
        >
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-800 text-sm truncate">{template.name}</span>
            <span className="font-mono text-sm text-gray-700 whitespace-nowrap">${template.default_amount.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className={`text-[10px] px-1.5 py-0 rounded-full border ${getFrequencyColor(template.frequency)} whitespace-nowrap`}>
              {template.frequency}
            </span>
            <span className="text-xs text-gray-500 whitespace-nowrap">
              Due: <span className="font-medium">{formatDate(template.next_due_date)}</span>
            </span>
            {template.last_advanced_at && (
              <span className="text-[10px] text-gray-400 italic whitespace-nowrap">
                (Paid: {formatLastAdvanced(template.last_advanced_at)})
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0 hide-in-screenshot relative">
          <button
            onClick={() => onAdvance(template)}
            className="text-xs bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-600 px-2 py-1 rounded transition"
            title={`Advance date (${template.frequency})`}
            disabled={!template.next_due_date}
          >
            💸
          </button>
          <div className="flex items-stretch rounded overflow-hidden border border-blue-200">
            <button
              onClick={() => onAddToWorkbench(template)}
              className="text-xs bg-blue-50 text-blue-600 px-2 py-1 hover:bg-blue-100 font-medium border-r border-blue-200"
              title="Add to Main Workbench"
            >
              Add
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setOpenMenuId(!openMenuId)
              }}
              className="text-[10px] bg-blue-50 text-blue-600 px-1 hover:bg-blue-100"
              title="Select Workbench"
            >
              ▼
            </button>
          </div>

          {openMenuId && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setOpenMenuId(false)}
              />
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-lg z-20 min-w-[140px] py-1">
                {workbenchOptions.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      onAddToWorkbench(template, opt.tag)
                      setOpenMenuId(false)
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 text-gray-700"
                  >
                    Add to {opt.title}
                  </button>
                ))}
              </div>
            </>
          )}
          
          <div className="hidden group-hover:flex gap-1 ml-1 border-l pl-1 border-gray-200">
            <button
              onClick={() => setIsEditing(true)}
              className="text-gray-300 hover:text-blue-500 px-1"
              title="Edit Template"
            >
              ✎
            </button>
            <button
              onClick={() => onDelete(template.id)}
              className="text-gray-300 hover:text-red-500 px-1"
              title="Delete Template"
            >
              &times;
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BillSchedule({ userId, onTransactionAdded, workbenchOptions = [], onBillsUpdate }: BillScheduleProps) {
  const [templates, setTemplates] = useState<BillTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [showAnnual, setShowAnnual] = useState(false)

  // Sort State
  type SortField = 'name' | 'amount' | 'due_date' | 'frequency'
  const [sortField, setSortField] = useState<SortField>('due_date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Form State
  const [newName, setNewName] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newFrequency, setNewFrequency] = useState<Frequency>('monthly')
  const [newDueDate, setNewDueDate] = useState('')

  useEffect(() => {
    fetchTemplates()
  }, [])

  // Notify parent when templates change
  useEffect(() => {
    if (onBillsUpdate) {
      onBillsUpdate(templates)
    }
  }, [templates, onBillsUpdate])

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('bill_templates')
        .select('*')
        .order('next_due_date', { ascending: true, nullsFirst: false })
        .order('name', { ascending: true })
      
      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setNewName('')
    setNewAmount('')
    setNewFrequency('monthly')
    setNewDueDate('')
    setIsAdding(false)
  }

  const updateTemplate = async (id: string, updates: Partial<BillTemplate>) => {
    try {
      const { error } = await supabase
        .from('bill_templates')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      setTemplates(prev => {
        const updated = prev.map(t => t.id === id ? { ...t, ...updates } : t)
        return [...updated].sort((a, b) => {
          if (!a.next_due_date) return 1
          if (!b.next_due_date) return -1
          return a.next_due_date.localeCompare(b.next_due_date)
        })
      })
    } catch (error) {
      console.error('Error updating template:', error)
      alert('Failed to update template.')
      fetchTemplates()
    }
  }

  const saveTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName || !newAmount) return

    try {
      // Create new
      const { data, error } = await supabase
        .from('bill_templates')
        .insert([
          {
            user_id: userId,
            name: newName,
            default_amount: parseFloat(newAmount),
            frequency: newFrequency,
            next_due_date: newDueDate || null
          }
        ])
        .select()

      if (error) throw error

      if (data) {
        const newTemplates = [...templates, data[0]]
        newTemplates.sort((a, b) => {
          if (!a.next_due_date) return 1;
          if (!b.next_due_date) return -1;
          return a.next_due_date.localeCompare(b.next_due_date);
        });
        setTemplates(newTemplates)
      }
      resetForm()
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Failed to save template.')
    }
  }

  const addToWorkbench = async (template: BillTemplate, tag?: string) => {
    try {
      const amount = -Math.abs(template.default_amount)
      
      const { error } = await supabase
        .from('transactions')
        .insert([
          {
            user_id: userId,
            description: template.name,
            amount: amount,
            status: 'planning',
            is_in_calc: true,
            due_date: template.next_due_date || null,
            tag: tag || null
          }
        ])

      if (error) throw error
      
      onTransactionAdded()
      
    } catch (error) {
      console.error('Error adding bill to workbench:', error)
    }
  }

  const advanceDate = async (template: BillTemplate) => {
    if (!template.next_due_date) return

    const lastDueDate = template.next_due_date; // Capture the date before advancing

    const currentDate = new Date(template.next_due_date)
    const userTimezoneOffset = currentDate.getTimezoneOffset() * 60000
    const adjustedDate = new Date(currentDate.getTime() + userTimezoneOffset)
    
    let nextDate = new Date(adjustedDate)

    switch (template.frequency) {
      case 'bi-weekly':
        nextDate.setDate(adjustedDate.getDate() + 14)
        break
      case 'monthly':
        nextDate.setMonth(adjustedDate.getMonth() + 1)
        break
      case 'quarterly':
        nextDate.setMonth(adjustedDate.getMonth() + 3)
        break
      case 'annually':
        nextDate.setFullYear(adjustedDate.getFullYear() + 1)
        break
    }

    const nextDateString = nextDate.toISOString().split('T')[0]

    // Optimistic update
    const updatedTemplates = templates.map(t => 
      t.id === template.id ? { ...t, next_due_date: nextDateString, last_advanced_at: lastDueDate } : t
    )
    
    updatedTemplates.sort((a, b) => {
      if (!a.next_due_date) return 1;
      if (!b.next_due_date) return -1;
      return a.next_due_date.localeCompare(b.next_due_date);
    });

    setTemplates(updatedTemplates)

    try {
      const { error } = await supabase
        .from('bill_templates')
        .update({ 
          next_due_date: nextDateString,
          last_advanced_at: lastDueDate 
        })
        .eq('id', template.id)

      if (error) throw error
    } catch (error) {
      console.error('Error advancing date:', error)
      fetchTemplates()
    }
  }

  const deleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return

    try {
      const { error } = await supabase
        .from('bill_templates')
        .delete()
        .eq('id', id)

      if (error) throw error
      setTemplates(templates.filter(t => t.id !== id))
    } catch (error) {
      console.error('Error deleting template:', error)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    const [year, month, day] = dateString.split('-')
    return `${parseInt(month)}/${parseInt(day)}/${year.slice(-2)}`
  }

  const formatLastAdvanced = (dateString: string | null) => {
    if (!dateString) return null
    const [year, month, day] = dateString.split('-')
    return `${parseInt(month)}/${parseInt(day)}/${year.slice(-2)}`
  }

  const getFrequencyColor = (freq: Frequency) => {
    switch (freq) {
      case 'bi-weekly': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'monthly': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'quarterly': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'annually': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Check if a bill is due within the next 3 days
  const isDueSoon = (dateString: string | null): boolean => {
    if (!dateString) return false

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const dueDate = new Date(dateString + 'T00:00:00')
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays >= 0 && diffDays <= 3
  }

  const filteredTemplates = templates.filter(t => showAnnual || t.frequency !== 'annually')

  // Handle sort toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  // Sort filtered templates
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    const modifier = sortOrder === 'asc' ? 1 : -1

    switch (sortField) {
      case 'name':
        return modifier * a.name.localeCompare(b.name)
      case 'amount':
        return modifier * (a.default_amount - b.default_amount)
      case 'due_date':
        if (!a.next_due_date && !b.next_due_date) return 0
        if (!a.next_due_date) return 1
        if (!b.next_due_date) return -1
        return modifier * a.next_due_date.localeCompare(b.next_due_date)
      case 'frequency':
        const freqOrder = { 'bi-weekly': 0, 'monthly': 1, 'quarterly': 2, 'annually': 3 }
        return modifier * (freqOrder[a.frequency] - freqOrder[b.frequency])
      default:
        return 0
    }
  })

  // Calculate total monthly exposure (excludes annual bills)
  const totalMonthly = filteredTemplates
    .filter(t => t.frequency !== 'annually')
    .reduce((sum, t) => sum + (t.default_amount || 0), 0)

  if (loading) return <div className="text-gray-500 text-sm">Loading schedule...</div>

  return (
    <div className="bg-white rounded-lg shadow p-3 h-full">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-gray-800">Bill Schedule</h3>
        <div className="flex gap-2 hide-in-screenshot">
          <button
            onClick={() => setShowAnnual(!showAnnual)}
            className={`text-xs px-2 py-1 rounded transition border ${showAnnual ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
            title={showAnnual ? 'Hide Annual Bills' : 'Show Annual Bills'}
          >
            {showAnnual ? 'Hide Annual' : 'Show Annual'}
          </button>
          <button
            onClick={() => {
              resetForm()
              setIsAdding(!isAdding)
            }}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition"
          >
            {isAdding ? 'Cancel' : '+ New'}
          </button>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={saveTemplate} className="mb-2 bg-gray-50 p-2 rounded border border-gray-200 text-sm space-y-2 hide-in-screenshot">
          <input
            type="text"
            placeholder="Name (e.g. Netflix)"
            className="w-full px-2 py-1 border rounded"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            required
          />
          <div className="flex flex-col sm:flex-row gap-2 overflow-hidden">
            <div className="w-full sm:w-1/2">
              <input
                type="number"
                step="0.01"
                placeholder="Amount"
                className="w-full px-2 py-1 border rounded box-border"
                value={newAmount}
                onChange={e => setNewAmount(e.target.value)}
                required
              />
            </div>
            <div className="w-full sm:w-1/2 min-w-0">
              <input
                type="date"
                className="w-full px-2 py-1 border rounded min-h-[30px] box-border"
                value={newDueDate}
                onChange={e => setNewDueDate(e.target.value)}
              />
            </div>
          </div>
          <select
            className="w-full px-2 py-1 border rounded"
            value={newFrequency}
            onChange={e => setNewFrequency(e.target.value as Frequency)}
          >
            <option value="bi-weekly">Bi-Weekly (14 days)</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annually">Annually</option>
          </select>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-1 rounded hover:bg-blue-700"
          >
            Save Template
          </button>
        </form>
      )}

      {/* Sort Headers */}
      <div className="flex gap-1 mb-2 text-[10px] text-gray-500">
        <button
          onClick={() => handleSort('name')}
          className={`px-2 py-0.5 rounded transition ${sortField === 'name' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
        >
          Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button
          onClick={() => handleSort('amount')}
          className={`px-2 py-0.5 rounded transition ${sortField === 'amount' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
        >
          Amount {sortField === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button
          onClick={() => handleSort('due_date')}
          className={`px-2 py-0.5 rounded transition ${sortField === 'due_date' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
        >
          Due {sortField === 'due_date' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button
          onClick={() => handleSort('frequency')}
          className={`px-2 py-0.5 rounded transition ${sortField === 'frequency' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
        >
          Freq {sortField === 'frequency' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
      </div>

      <div className="space-y-1">
        {sortedTemplates.map(t => (
          <BillRow
            key={t.id}
            template={t}
            onUpdate={updateTemplate}
            onDelete={deleteTemplate}
            onAdvance={advanceDate}
            onAddToWorkbench={addToWorkbench}
            workbenchOptions={workbenchOptions}
            getFrequencyColor={getFrequencyColor}
            formatDate={formatDate}
            formatLastAdvanced={formatLastAdvanced}
            isDueSoon={isDueSoon(t.next_due_date)}
          />
        ))}
        {sortedTemplates.length === 0 && !isAdding && (
          <p className="text-xs text-gray-400 text-center py-4">
            No templates yet.
          </p>
        )}
      </div>

      {sortedTemplates.length > 0 && (
        <div className="mt-3 pt-2 border-t border-gray-200">
          <div className="text-right text-sm text-gray-600 font-semibold">
            Total Monthly Fixed: ${totalMonthly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      )}
    </div>
  )
}