'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import type { KnowledgeBaseEntry } from '@/types'

const categories = [
  { value: 'all', label: 'All' },
  { value: 'hotel_info', label: 'Hotel Info' },
  { value: 'policy', label: 'Policy' },
  { value: 'room', label: 'Room' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'amenity', label: 'Amenity' },
  { value: 'travel', label: 'Travel' },
  { value: 'faq', label: 'FAQ' },
  { value: 'escalation_rule', label: 'Escalation Rule' },
  { value: 'sop', label: 'SOP' },
]

export default function KnowledgeBasePage() {
  const [entries, setEntries] = useState<KnowledgeBaseEntry[]>([])
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState<KnowledgeBaseEntry | null>(null)
  const [formData, setFormData] = useState({ title: '', content: '', category: 'faq' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchEntries()
  }, [])

  async function fetchEntries() {
    let query = getSupabase().from('knowledge_base').select('*').order('category').order('title')
    if (filter !== 'all') {
      query = query.eq('category', filter)
    }
    const { data } = await query
    setEntries((data || []) as KnowledgeBaseEntry[])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    if (editingEntry) {
      await getSupabase()
        .from('knowledge_base')
        .update({ title: formData.title, content: formData.content, category: formData.category })
        .eq('id', editingEntry.id)
    } else {
      await getSupabase().from('knowledge_base').insert({
        title: formData.title,
        content: formData.content,
        category: formData.category,
        hotel_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      } as any)
    }

    setShowForm(false)
    setEditingEntry(null)
    setFormData({ title: '', content: '', category: 'faq' })
    fetchEntries()
    setLoading(false)
  }

  async function handleDelete(entry: KnowledgeBaseEntry) {
    if (!confirm('Delete this entry?')) return
    await getSupabase().from('knowledge_base').delete().eq('id', entry.id)
    fetchEntries()
  }

  function handleEdit(entry: KnowledgeBaseEntry) {
    setEditingEntry(entry)
    setFormData({ title: entry.title, content: entry.content, category: entry.category })
    setShowForm(true)
  }

  async function toggleActive(entry: KnowledgeBaseEntry) {
    await getSupabase()
      .from('knowledge_base')
      .update({ is_active: !entry.is_active } as any)
      .eq('id', entry.id)
    fetchEntries()
  }

  const filteredEntries = filter === 'all' ? entries : entries.filter((e) => e.category === filter)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Knowledge Base</h1>
        <Button onClick={() => { setEditingEntry(null); setFormData({ title: '', content: '', category: 'faq' }); setShowForm(true) }}>
          Add Entry
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setFilter(cat.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === cat.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {!filteredEntries.length ? (
          <div className="col-span-2 text-center text-gray-500 dark:text-gray-400 py-12">
            No entries found.
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <Card key={entry.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{entry.title}</CardTitle>
                  <Badge variant={entry.is_active ? 'success' : 'default'}>
                    {entry.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-3">
                  {entry.content}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="info">{entry.category}</Badge>
                  <div className="flex-1" />
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(entry)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleActive(entry)}>
                    {entry.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(entry)}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={showForm} onClose={() => setShowForm(false)} title={editingEntry ? 'Edit Entry' : 'Add Entry'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              required
            >
              {categories
                .filter((c) => c.value !== 'all')
                .map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Content
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
              required
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : editingEntry ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
