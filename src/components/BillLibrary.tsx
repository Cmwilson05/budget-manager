import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface BillTemplate {
  id: string
  name: string
  default_amount: number
  frequency: 'monthly' | 'yearly'
}

interface BillLibraryProps {
  userId: string
  onTransactionAdded: () => void // Callback to refresh workbench
}

export default function BillLibrary({ userId, onTransactionAdded }: BillLibraryProps) {
  const [templates, setTemplates] = useState<BillTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)

  // Form State
  const [newName, setNewName] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newFrequency, setNewFrequency] = useState<'monthly' | 'yearly'>('monthly')

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('bill_templates')
        .select('*')
        .order('name')
      
      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const createTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName || !newAmount) return

    try {
      const { data, error } = await supabase
        .from('bill_templates')
        .insert([
          {
            user_id: userId,
            name: newName,
            default_amount: parseFloat(newAmount),
            frequency: newFrequency
          }
        ])
        .select()

      if (error) throw error

      if (data) {
        setTemplates([...templates, data[0]])
        setNewName('')
        setNewAmount('')
        setIsAdding(false)
      }
    } catch (error) {
      console.error('Error creating template:', error)
    }
  }

  const addToWorkbench = async (template: BillTemplate) => {
    try {
      // Create a transaction from the template
      // We default it to "Expense" (negative amount)
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
            due_date: null // User can set date later
          }
        ])

      if (error) throw error
      
      // Trigger refresh in parent
      onTransactionAdded()
      
    } catch (error) {
      console.error('Error adding bill to workbench:', error)
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
          onClick={() => setIsAdding(!isAdding)}
          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition"
        >
          {isAdding ? 'Cancel' : '+ New'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={createTemplate} className="mb-4 bg-gray-50 p-3 rounded border border-gray-200 text-sm">
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Name (e.g. Netflix)"
              className="w-full px-2 py-1 border rounded"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              required
            />
            <input
              type="number"
              step="0.01"
              placeholder="Amount (e.g. 15.99)"
              className="w-full px-2 py-1 border rounded"
              value={newAmount}
              onChange={e => setNewAmount(e.target.value)}
              required
            />
            <select
              className="w-full px-2 py-1 border rounded"
              value={newFrequency}
              onChange={e => setNewFrequency(e.target.value as any)}
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-1 rounded hover:bg-blue-700"
            >
              Save Template
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {templates.map(t => (
          <div key={t.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded border border-transparent hover:border-gray-200 group transition">
            <div className="flex-grow">
              <div className="font-medium text-gray-800 text-sm">{t.name}</div>
              <div className="text-xs text-gray-500">
                ${t.default_amount.toFixed(2)} / {t.frequency}
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => addToWorkbench(t)}
                className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
                title="Add to Workbench"
              >
                Add
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