import { AddReadingCard } from '@/components/add-reading-card'

// Step 11 connects the card to the API and adds the list of readings below it.
export function ReadingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Readings</h1>
      <AddReadingCard />
    </div>
  )
}
