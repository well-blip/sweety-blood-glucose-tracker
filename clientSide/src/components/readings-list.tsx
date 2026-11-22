import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate, readingsApi, slotLabel, type Reading, type ReadingsPage } from '@/lib/readings'
import { SLOTS } from '@/lib/slots'

const PAGE_SIZE = 10

type ReadingsListProps = {
  refreshKey: number // changes after any add/edit/delete, so the list reloads
  editingId: number | null
  onEdit: (reading: Reading) => void
  onDeleted: () => void
}

export function ReadingsList({ refreshKey, editingId, onEdit, onDeleted }: ReadingsListProps) {
  const [page, setPage] = useState(1)
  const [loaded, setLoaded] = useState<{ key: string; data: ReadingsPage } | null>(null)
  const [error, setError] = useState('')
  const requestKey = `${page}:${refreshKey}`

  useEffect(() => {
    let ignore = false
    readingsApi
      .list(page, PAGE_SIZE)
      .then((data) => {
        if (ignore) return
        // Deleting the last reading on a page leaves it empty: step back one page.
        if (data.readings.length === 0 && page > 1) setPage(page - 1)
        else setLoaded({ key: requestKey, data })
      })
      .catch(() => !ignore && setError("Couldn't load your readings. Please refresh the page."))
    return () => {
      ignore = true
    }
  }, [page, requestKey])

  const data = loaded?.key === requestKey ? loaded.data : (loaded?.data ?? null)

  async function deleteReading(id: number) {
    await readingsApi.remove(id)
    onDeleted()
  }

  return (
    <Card className="gap-0 pt-0">
      <CardHeader className="border-b py-5">
        <CardTitle className="text-lg">Your readings</CardTitle>
        <CardDescription>{data ? `${data.total} in total, newest first` : 'Newest first'}</CardDescription>
      </CardHeader>

      <CardContent className="px-0">
        {error ? (
          <p className="px-6 py-10 text-center text-destructive">{error}</p>
        ) : !data ? (
          <p className="px-6 py-10 text-center text-muted-foreground">Loading…</p>
        ) : data.total === 0 ? (
          <div className="grid gap-1 px-6 py-12 text-center">
            <p className="font-medium">No readings yet</p>
            <p className="text-muted-foreground">Add your first reading above to get started.</p>
          </div>
        ) : (
          <>
            <Table className="text-base">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Date</TableHead>
                  <TableHead>Time slot</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="pr-6 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.readings.map((reading) => {
                  const Icon = SLOTS.find((s) => s.id === reading.slot)?.icon
                  return (
                    <TableRow key={reading.id} data-state={reading.id === editingId ? 'selected' : undefined}>
                      <TableCell className="py-3 pl-6">{formatDate(reading.date)}</TableCell>
                      <TableCell className="py-3">
                        <span className="inline-flex items-center gap-2">
                          {Icon && <Icon className="size-4 text-muted-foreground" aria-hidden="true" />}
                          {slotLabel(reading.slot)}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 text-right font-semibold">
                        {reading.value} <span className="text-sm font-normal text-muted-foreground">mg/dl</span>
                      </TableCell>
                      <TableCell className="py-3 pr-6">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="lg" onClick={() => onEdit(reading)}>
                            <Pencil aria-hidden="true" />
                            Edit
                          </Button>
                          <DeleteButton reading={reading} onConfirm={() => deleteReading(reading.id)} />
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            {/* Pagination: GET /readings?page=…&limit=10 */}
            <div className="flex items-center justify-between gap-4 border-t px-6 pt-4">
              <p className="text-muted-foreground">
                Page {data.page} of {data.totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="lg" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft aria-hidden="true" />
                  Previous
                </Button>
                <Button variant="outline" size="lg" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>
                  Next
                  <ChevronRight aria-hidden="true" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// Asks before deleting, in a dialog on the page (not a browser popup), with the reading spelled out.
function DeleteButton({ reading, onConfirm }: { reading: Reading; onConfirm: () => Promise<void> }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="lg" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
          <Trash2 aria-hidden="true" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this reading?</AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            {slotLabel(reading.slot)} on {formatDate(reading.date)}: {reading.value} mg/dl. This can't be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep it</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Delete reading
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
