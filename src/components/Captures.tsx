import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { getAccountColor } from '../lib/accountColors'
import CurrencyInput from './CurrencyInput'
import type { Account } from '../types'

interface Capture {
  id: string
  amount: number
  note: string
  source?: string
  created_at: string
}

interface CapturesProps {
  userId: string
  accounts?: Account[]
  onCapture?: (capture: Capture) => void
}

export default function Captures({ userId, accounts = [] }: CapturesProps) {
  const [captures, setCaptures] = useState<Capture[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [justCaptured, setJustCaptured] = useState(false)

  // Form state
  const [newAmount, setNewAmount] = useState('')
  const [newNote, setNewNote] = useState('')

  // Edit state
  const [editAmount, setEditAmount] = useState('')
  const [editNote, setEditNote] = useState('')

  // Use ref to avoid stale closure in event listener
  const userIdRef = useRef(userId)
  userIdRef.current = userId

  useEffect(() => {
    fetchCaptures()
  }, [])

  // Separate effect for event listener to handle captures
  useEffect(() => {
    const handleNewCapture = async (event: CustomEvent<{ amount: number; source: string }>) => {
      const { amount, source } = event.detail
      try {
        const { data, error } = await supabase
          .from('captures')
          .insert([
            {
              user_id: userIdRef.current,
              amount,
              note: source || '',
              source: source || null
            }
          ])
          .select()

        if (error) {
          console.error('Error adding capture:', error)
          alert('Failed to capture. Make sure the captures table exists in your database.')
          return
        }

        if (data) {
          setCaptures(prev => [data[0], ...prev])
          setJustCaptured(true)
          setTimeout(() => setJustCaptured(false), 2000)
        }
      } catch (error) {
        console.error('Error adding capture:', error)
      }
    }

    window.addEventListener('captureProjected' as any, handleNewCapture)
    return () => window.removeEventListener('captureProjected' as any, handleNewCapture)
  }, [])

  const fetchCaptures = async () => {
    try {
      const { data, error } = await supabase
        .from('captures')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCaptures(data || [])
    } catch (error) {
      console.error('Error fetching captures:', error)
    } finally {
      setLoading(false)
    }
  }


  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(newAmount)
    if (isNaN(amount)) return

    try {
      const { data, error } = await supabase
        .from('captures')
        .insert([
          {
            user_id: userId,
            amount,
            note: newNote,
            source: null
          }
        ])
        .select()

      if (error) throw error
      if (data) {
        setCaptures([data[0], ...captures])
        setNewAmount('')
        setNewNote('')
        setIsAdding(false)
      }
    } catch (error) {
      console.error('Error adding capture:', error)
    }
  }

  const updateCapture = async (id: string) => {
    const amount = parseFloat(editAmount)
    if (isNaN(amount)) return

    try {
      const { error } = await supabase
        .from('captures')
        .update({ amount, note: editNote })
        .eq('id', id)

      if (error) throw error

      setCaptures(captures.map(c =>
        c.id === id ? { ...c, amount, note: editNote } : c
      ))
      setEditingId(null)
    } catch (error) {
      console.error('Error updating capture:', error)
    }
  }

  const deleteCapture = async (id: string) => {
    try {
      const { error } = await supabase
        .from('captures')
        .delete()
        .eq('id', id)

      if (error) throw error
      setCaptures(captures.filter(c => c.id !== id))
    } catch (error) {
      console.error('Error deleting capture:', error)
    }
  }

  const startEdit = (capture: Capture) => {
    setEditingId(capture.id)
    setEditAmount(capture.amount.toString())
    setEditNote(capture.note || '')
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Render note with colored account names
  const renderColoredNote = (note: string) => {
    if (!note || accounts.length === 0) return note

    // Split by comma and check each part against account names
    const parts = note.split(',').map(part => part.trim())

    return (
      <span>
        {parts.map((part, partIndex) => {
          // Case-insensitive matching, also try partial match
          const partLower = part.toLowerCase()
          const account = accounts.find(a =>
            a.name.toLowerCase() === partLower ||
            a.name.toLowerCase().includes(partLower) ||
            partLower.includes(a.name.toLowerCase())
          )
          if (account) {
            // Liabilities are always red
            const colorClass = account.is_liability
              ? 'text-red-400'
              : getAccountColor(account.color_index ?? 0).text
            return (
              <span key={partIndex}>
                {partIndex > 0 && ', '}
                <span className={colorClass}>{part}</span>
              </span>
            )
          }
          return (
            <span key={partIndex}>
              {partIndex > 0 && ', '}
              {part}
            </span>
          )
        })}
      </span>
    )
  }

  if (loading) return <div className="text-gray-500">Loading captures...</div>

  return (
    <div className="captures-section">
      {/* Header - hidden in screenshot mode */}
      <div className="flex justify-between items-center mb-4 hide-in-screenshot">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-gray-800">Captured Projections</h2>
          {justCaptured && (
            <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded animate-pulse">
              Captured!
            </span>
          )}
        </div>
        <button
          onClick={() => {
            setIsAdding(!isAdding)
            setNewAmount('')
            setNewNote('')
          }}
          className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100 transition"
        >
          {isAdding ? 'Cancel' : '+ Add Capture'}
        </button>
      </div>

      {/* Add Form - hidden in screenshot mode */}
      {isAdding && (
        <form onSubmit={handleAddManual} className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200 hide-in-screenshot">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Amount</label>
              <CurrencyInput
                value={newAmount}
                onChange={setNewAmount}
                className="w-full px-3 py-2 border rounded text-sm"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Note</label>
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full px-3 py-2 border rounded text-sm"
                placeholder="e.g. After rent payment"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
            >
              Save Capture
            </button>
          </div>
        </form>
      )}

      {/* Screenshot mode header */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4 hidden screenshot-mode-show">Projected</h2>

      {/* Captures Grid */}
      {captures.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {captures.map((capture) => (
            <div
              key={capture.id}
              className="bg-blue-900 p-4 rounded-2xl border border-blue-500 shadow-blue-500/30 shadow-md relative group"
            >
              {editingId === capture.id ? (
                /* Edit Mode */
                <div className="space-y-2">
                  <CurrencyInput
                    value={editAmount}
                    onChange={setEditAmount}
                    onKeyDown={(e) => e.key === 'Enter' && updateCapture(capture.id)}
                    className="w-full px-2 py-1 border rounded text-sm text-right font-mono"
                  />
                  <input
                    type="text"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && updateCapture(capture.id)}
                    className="w-full px-2 py-1 border rounded text-sm"
                    placeholder="Add a note..."
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs text-gray-300 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => updateCapture(capture.id)}
                      className="text-xs text-green-300 hover:text-green-100 font-medium"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                /* Display Mode */
                <>
                  <div className="text-xs text-blue-300 mb-1">{formatDate(capture.created_at)}</div>
                  <div className={`text-2xl font-mono font-bold ${capture.amount >= 0 ? 'text-white' : 'text-red-300'}`}>
                    ${capture.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  {capture.note && (
                    <div className="text-sm text-blue-200 mt-2 leading-tight">{renderColoredNote(capture.note)}</div>
                  )}

                  {/* Action buttons - hidden in screenshot mode */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 hide-in-screenshot">
                    <button
                      onClick={() => startEdit(capture)}
                      className="text-xs text-blue-300 hover:text-white p-1"
                      title="Edit"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteCapture(capture.id)}
                      className="text-xs text-red-300 hover:text-red-100 p-1"
                      title="Delete"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg border border-gray-200 hide-in-screenshot">
          No captures yet. Use the "Capture" button on a workbench to save a projected balance.
        </div>
      )}
    </div>
  )
}

// Export function to trigger capture from workbench
export const triggerCapture = (amount: number, source: string) => {
  window.dispatchEvent(new CustomEvent('captureProjected', { detail: { amount, source } }))
}
