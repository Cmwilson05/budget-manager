import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Editor, EditorProvider, Toolbar, BtnBold, BtnItalic, BtnUnderline, BtnStrikeThrough, BtnBulletList, BtnNumberedList, BtnLink, BtnClearFormatting, BtnRedo, BtnUndo } from 'react-simple-wysiwyg'

interface NotesProps {
  userId: string
}

export default function Notes({ userId }: NotesProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  useEffect(() => {
    fetchNotes()
  }, [])

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('content, updated_at')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setContent(data.content || '')
        setLastSaved(new Date(data.updated_at))
      }
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveNotes = async (newContent: string) => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('notes')
        .upsert({ 
          user_id: userId, 
          content: newContent,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

      if (error) throw error
      setLastSaved(new Date())
    } catch (error) {
      console.error('Error saving notes:', error)
    } finally {
      setSaving(false)
    }
  }

  // Auto-save effect
  useEffect(() => {
    if (loading) return

    const timer = setTimeout(() => {
      saveNotes(content)
    }, 2000)

    return () => clearTimeout(timer)
  }, [content])

  if (loading) return <div className="text-gray-500">Loading notes...</div>

  return (
    <div className="bg-white rounded-lg shadow p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-gray-800">Shared Notes</h3>
        <div className="text-xs text-gray-400">
          {saving ? 'Saving...' : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : ''}
        </div>
      </div>
      <div className="flex-grow border rounded-md overflow-hidden">
        <EditorProvider>
          <Editor 
            value={content} 
            onChange={(e) => setContent(e.target.value)}
            containerProps={{ style: { height: '300px', overflowY: 'auto' } }}
          >
             <Toolbar className="hide-in-screenshot">
              <BtnUndo />
              <BtnRedo />
              <BtnBold />
              <BtnItalic />
              <BtnUnderline />
              <BtnStrikeThrough />
              <BtnBulletList />
              <BtnNumberedList />
              <BtnLink />
              <BtnClearFormatting />
            </Toolbar>
          </Editor>
        </EditorProvider>
      </div>
    </div>
  )
}