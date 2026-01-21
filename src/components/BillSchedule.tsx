import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

type Frequency = 'bi-weekly' | 'monthly' | 'quarterly' | 'annually'

interface BillTemplate {
  id: string
  name: string
  default_amount: number
  frequency: Frequency
  next_due_date: string | null
  last_advanced_at: string | null // New field
}

interface WorkbenchOption {
  title: string
  tag?: string
}

interface BillScheduleProps {
  userId: string
  onTransactionAdded: () => void
  workbenchOptions?: WorkbenchOption[]
}

export default function BillSchedule({ userId, onTransactionAdded, workbenchOptions = [] }: BillScheduleProps) {
  const [templates, setTemplates] = useState<BillTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAnnual, setShowAnnual] = useState(true)

  // Form State
  const [newName, setNewName] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newFrequency, setNewFrequency] = useState<Frequency>('monthly')
  const [newDueDate, setNewDueDate] = useState('')

  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

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
    setEditingId(null)
  }

  const startEditing = (template: BillTemplate) => {
    setNewName(template.name)
    setNewAmount(template.default_amount.toString())
    setNewFrequency(template.frequency)
    setNewDueDate(template.next_due_date || '')
    setEditingId(template.id)
    setIsAdding(true)
  }

  const saveTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName || !newAmount) return

    try {
      if (editingId) {
        // Update existing
        const { error } = await supabase
          .from('bill_templates')
          .update({
            name: newName,
            default_amount: parseFloat(newAmount),
            frequency: newFrequency,
            next_due_date: newDueDate || null,
            // Clear last_advanced_at if the due date is manually changed
            last_advanced_at: newDueDate !== templates.find(t => t.id === editingId)?.next_due_date 
              ? null 
              : templates.find(t => t.id === editingId)?.last_advanced_at
          })
          .eq('id', editingId)

        if (error) throw error

        const updatedTemplates = templates.map(t => 
          t.id === editingId 
            ? { 
                ...t, 
                name: newName, 
                default_amount: parseFloat(newAmount), 
                frequency: newFrequency, 
                next_due_date: newDueDate || null,
                // Clear locally too
                last_advanced_at: newDueDate !== t.next_due_date ? null : t.last_advanced_at
              }
            : t
        )
        
        updatedTemplates.sort((a, b) => {
          if (!a.next_due_date) return 1;
          if (!b.next_due_date) return -1;
          return new Date(a.next_due_date + 'T12:00:00').getTime() - new Date(b.next_due_date + 'T12:00:00').getTime();
        });

        setTemplates(updatedTemplates)

      } else {
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
            return new Date(a.next_due_date + 'T12:00:00').getTime() - new Date(b.next_due_date + 'T12:00:00').getTime();
          });
          setTemplates(newTemplates)
        }
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
      return new Date(a.next_due_date).getTime() - new Date(b.next_due_date).getTime();
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
    return `${parseInt(month)}/${parseInt(day)}/${year}`
  }

  const formatLastAdvanced = (dateString: string | null) => {
    if (!dateString) return null
    const [year, month, day] = dateString.split('-')
    return `${parseInt(month)}/${parseInt(day)}/${year}`
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

  const filteredTemplates = templates.filter(t => showAnnual || t.frequency !== 'annually')

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
            {editingId ? 'Update Template' : 'Save Template'}
          </button>
        </form>
      )}

      <div className="space-y-1">
        {filteredTemplates.map(t => (
          <div key={t.id} className="p-2 hover:bg-gray-50 rounded border border-transparent hover:border-gray-200 group transition">
            <div className="flex justify-between items-center">
              <div 
                className="cursor-pointer hover:text-blue-600 flex-1 min-w-0 pr-2"
                onClick={() => startEditing(t)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800 text-sm truncate">{t.name}</span>
                  <span className="font-mono text-sm text-gray-700 whitespace-nowrap">${t.default_amount.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className={`text-[10px] px-1.5 py-0 rounded-full border ${getFrequencyColor(t.frequency)} whitespace-nowrap`}>
                    {t.frequency}
                  </span>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    Due: <span className="font-medium">{formatDate(t.next_due_date)}</span>
                  </span>
                  {t.last_advanced_at && (
                    <span className="text-[10px] text-gray-400 italic whitespace-nowrap">
                      (Paid: {formatLastAdvanced(t.last_advanced_at)})
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1 flex-shrink-0 hide-in-screenshot relative">
                <button
                  onClick={() => advanceDate(t)}
                  className="text-xs bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-600 px-2 py-1 rounded transition"
                  title={`Advance date (${t.frequency})`}
                  disabled={!t.next_due_date}
                >
                  💸
                </button>
                <div className="flex items-stretch rounded overflow-hidden border border-blue-200">
                  <button
                    onClick={() => addToWorkbench(t)}
                    className="text-xs bg-blue-50 text-blue-600 px-2 py-1 hover:bg-blue-100 font-medium border-r border-blue-200"
                    title="Add to Main Workbench"
                  >
                    Add
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenMenuId(openMenuId === t.id ? null : t.id)
                    }}
                    className="text-[10px] bg-blue-50 text-blue-600 px-1 hover:bg-blue-100"
                    title="Select Workbench"
                  >
                    ▼
                  </button>
                </div>

                {openMenuId === t.id && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setOpenMenuId(null)}
                    />
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-lg z-20 min-w-[140px] py-1">
                      {workbenchOptions.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            addToWorkbench(t, opt.tag)
                            setOpenMenuId(null)
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
                    onClick={() => startEditing(t)}
                    className="text-gray-300 hover:text-blue-500 px-1"
                    title="Edit Template"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => deleteTemplate(t.id)}
                    className="text-gray-300 hover:text-red-500 px-1"
                    title="Delete Template"
                  >
                    &times;
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filteredTemplates.length === 0 && !isAdding && (
          <p className="text-xs text-gray-400 text-center py-4">
            No templates yet.
          </p>
        )}
      </div>
    </div>
  )
}