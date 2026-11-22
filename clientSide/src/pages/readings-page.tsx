import { useState } from 'react'
import { AddReadingCard } from '@/components/add-reading-card'
import { GlucoseTrendChart } from '@/components/glucose-trend-chart'
import { ReadingsList } from '@/components/readings-list'
import { useAuth } from '@/lib/auth-context'
import type { Reading } from '@/lib/readings'

// Add a reading at the top, the chart underneath, then the full list.
export function ReadingsPage() {
  const { user } = useAuth()
  const [editing, setEditing] = useState<Reading | null>(null)
  // Bumped after every change; the chart and list watch it and reload their data.
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = () => setRefreshKey((key) => key + 1)

  function startEditing(reading: Reading) {
    setEditing(reading)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="grid gap-8">
      <div className="grid gap-1">
        <h1 className="text-3xl font-semibold">Hello, {user?.name.split(' ')[0]}</h1>
        <p className="text-muted-foreground">Log a reading, then see how your levels are moving over time.</p>
      </div>

      {/* A new `key` remounts the card, so its form resets cleanly between "add" and each "edit" */}
      <AddReadingCard
        key={editing ? `edit-${editing.id}` : 'new'}
        editing={editing}
        onSaved={() => {
          setEditing(null)
          refresh()
        }}
        onCancelEdit={() => setEditing(null)}
      />

      <GlucoseTrendChart refreshKey={refreshKey} />

      <ReadingsList
        refreshKey={refreshKey}
        editingId={editing?.id ?? null}
        onEdit={startEditing}
        onDeleted={() => {
          setEditing(null)
          refresh()
        }}
      />
    </div>
  )
}
