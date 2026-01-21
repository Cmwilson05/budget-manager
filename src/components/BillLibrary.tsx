import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

type Frequency = 'bi-weekly' | 'monthly' | 'quarterly' | 'annually'

interface BillTemplate {
  id: string
  name: string
  default_amount: number
  frequency: Frequency
  next_due_date: string | null
}

interface BillLibraryProps {
  userId: string
  onTransactionAdded: () => void
}

export default function BillLibrary({ userId, onTransactionAdded }: BillLibraryProps) {
  const [templates, setTemplates] = useState<BillTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form State
  const [newName, setNewName] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newFrequency, setNewFrequency] = useState<Frequency>('monthly')
  const [newDueDate, setNewDueDate] = useState('')

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('bill_templates')
        .select('*')
        .order('next_due_date', { ascending: true, nullsFirst: false }) // Sort by due date
        .order('name', { ascending: true }) // Fallback sort
      
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
            next_due_date: newDueDate || null
          })
          .eq('id', editingId)

        if (error) throw error

        // Optimistic update + re-sort locally
        const updatedTemplates = templates.map(t => 
          t.id === editingId 
            ? { ...t, name: newName, default_amount: parseFloat(newAmount), frequency: newFrequency, next_due_date: newDueDate || null }
            : t
        )
        
        // Simple local sort to reflect change immediately
        updatedTemplates.sort((a, b) => {
          if (!a.next_due_date) return 1;
          if (!b.next_due_date) return -1;
          return new Date(a.next_due_date).getTime() - new Date(b.next_due_date).getTime();
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
          // Sort new list
          newTemplates.sort((a, b) => {
            if (!a.next_due_date) return 1;
            if (!b.next_due_date) return -1;
            return new Date(a.next_due_date).getTime() - new Date(b.next_due_date).getTime();
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

  const addToWorkbench = async (template: BillTemplate) => {
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
            due_date: template.next_due_date || null
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
      t.id === template.id ? { ...t, next_due_date: nextDateString } : t
    )
    
    // Re-sort locally so the item jumps to its new position
    updatedTemplates.sort((a, b) => {
      if (!a.next_due_date) return 1;
      if (!b.next_due_date) return -1;
      return new Date(a.next_due_date).getTime() - new Date(b.next_due_date).getTime();
    });

    setTemplates(updatedTemplates)

    try {
      const { error } = await supabase
        .from('bill_templates')
        .update({ next_due_date: nextDateString })
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

  if (loading) return <div className="text-gray-500 text-sm">Loading library...</div>

  return (
    <div className="bg-white rounded-lg shadow p-4 h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-800">Bill Library</h3>
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

      {isAdding && (
        <form onSubmit={saveTemplate} className="mb-4 bg-gray-50 p-3 rounded border border-gray-200 text-sm space-y-2">
          <input
            type="text"
            placeholder="Name (e.g. Netflix)"
            className="w-full px-2 py-1 border rounded"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            required
          />
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              placeholder="Amount"
              className="w-1/2 px-2 py-1 border rounded"
              value={newAmount}
              onChange={e => setNewAmount(e.target.value)}
              required
            />
            <input
              type="date"
              className="w-1/2 px-2 py-1 border rounded"
              value={newDueDate}
              onChange={e => setNewDueDate(e.target.value)}
            />
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

      <div className="space-y-2">
        {templates.map(t => (
          <div key={t.id} className="flex flex-col p-3 hover:bg-gray-50 rounded border border-transparent hover:border-gray-200 group transition">
            <div className="flex justify-between items-start mb-1">
              <div 
                className="cursor-pointer hover:text-blue-600"
                onClick={() => startEditing(t)}
              >
                <div className="font-medium text-gray-800 text-sm">{t.name}</div>
                <div className="text-xs text-gray-500">
                  ${t.default_amount.toFixed(2)} • {t.frequency}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => startEditing(t)}
                  className="text-gray-300 hover:text-blue-500 px-1 opacity-0 group-hover:opacity-100 transition"
                  title="Edit Template"
                >
                  ✎
                </button>
                <button
                  onClick={() => deleteTemplate(t.id)}
                  className="text-gray-300 hover:text-red-500 px-1 opacity-0 group-hover:opacity-100 transition"
                  title="Delete Template"
                >
                  &times;
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-2 bg-white p-1 rounded border border-gray-100">
              <div className="text-xs text-gray-600 px-2">
                Due: <span className="font-medium">{t.next_due_date ? new Date(t.next_due_date).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => advanceDate(t)}
                  className="text-xs bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-600 px-2 py-1 rounded transition flex items-center gap-1"
                  title={`Advance date (${t.frequency})`}
                  disabled={!t.next_due_date}
                >
                  <span>⏩</span>
                </button>
                <button
                  onClick={() => addToWorkbench(t)}
                  className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100 font-medium"
                  title="Add to Workbench"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        ))}
        {templates.length === 0 && !isAdding && (
          <p className="text-xs text-gray-400 text-center py-4">
            No templates yet.
          </p>
        )}
      </div>
    </div>
  )
}