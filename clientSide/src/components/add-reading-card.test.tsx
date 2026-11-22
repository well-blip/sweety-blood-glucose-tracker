import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AddReadingCard } from '@/components/add-reading-card'
import { ApiError } from '@/lib/api'
import { readingsApi, todayLocal, type Reading } from '@/lib/readings'

// These tests use the form the way a person would: type into fields, click buttons, read what's on
// screen. The network is replaced with fakes (vi.mock), so no server is needed and we can check
// exactly what the form sends.
vi.mock('@/lib/readings', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/readings')>()
  return { ...actual, readingsApi: { ...actual.readingsApi, create: vi.fn(), update: vi.fn() } }
})

const create = vi.mocked(readingsApi.create)
const update = vi.mocked(readingsApi.update)
const today = todayLocal()

function renderForm(props: Partial<Parameters<typeof AddReadingCard>[0]> = {}) {
  const onSaved = vi.fn()
  const user = userEvent.setup()
  render(<AddReadingCard onSaved={onSaved} {...props} />)
  return { user, onSaved }
}

const valueInput = () => screen.getByLabelText('Value')
const addButton = () => screen.getByRole('button', { name: 'Add reading' })

beforeEach(() => {
  create.mockReset()
  update.mockReset()
})

describe('AddReadingCard: checks in the browser (no request is sent)', () => {
  it('asks for a value when the field is empty', async () => {
    const { user } = renderForm()
    await user.click(addButton())

    expect(screen.getByText('Please enter a glucose value.')).toBeInTheDocument()
    expect(create).not.toHaveBeenCalled()
  })

  it.each(['700', '39', '12.5', 'abc'])('rejects %s with the 40–600 message', async (typed) => {
    const { user } = renderForm()
    await user.type(valueInput(), typed)
    await user.click(addButton())

    expect(screen.getByText('Value must be between 40 and 600 mg/dl.')).toBeInTheDocument()
    expect(valueInput()).toHaveAttribute('aria-invalid', 'true')
    expect(create).not.toHaveBeenCalled()
  })

  it('rejects a date in the future', async () => {
    const { user } = renderForm()
    // Date pickers can't be typed into in jsdom, so set the value directly
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2999-01-01' } })
    await user.type(valueInput(), '110')
    await user.click(addButton())

    expect(screen.getByText('Date cannot be in the future.')).toBeInTheDocument()
    expect(create).not.toHaveBeenCalled()
  })
})

describe('AddReadingCard: saving', () => {
  it('sends the chosen slot, date and value, then confirms and clears the field', async () => {
    const saved: Reading = { id: 1, date: today, slot: 'AFTER_LUNCH', value: 112 }
    create.mockResolvedValue({ reading: saved })
    const { user, onSaved } = renderForm()

    await user.click(screen.getByRole('button', { name: 'After lunch' }))
    await user.type(valueInput(), '112')
    await user.click(addButton())

    expect(create).toHaveBeenCalledWith({ date: today, slot: 'AFTER_LUNCH', value: '112' })
    expect(await screen.findByText('Reading saved.')).toBeInTheDocument()
    expect(onSaved).toHaveBeenCalledWith(saved)
    expect(valueInput()).toHaveValue('')
  })

  it("shows the server's duplicate-slot message under the time slots", async () => {
    const message = 'You already have an After lunch reading for this date.'
    create.mockRejectedValue(new ApiError(409, message, { slot: message }))
    const { user, onSaved } = renderForm()

    await user.click(screen.getByRole('button', { name: 'After lunch' }))
    await user.type(valueInput(), '150')
    await user.click(addButton())

    expect(await screen.findByText(message)).toBeInTheDocument()
    expect(onSaved).not.toHaveBeenCalled()
  })

  it("shows the server's 4-per-day message", async () => {
    const message = 'You can add only 4 readings per day.'
    create.mockRejectedValue(new ApiError(409, message, { date: message }))
    const { user } = renderForm()

    await user.type(valueInput(), '150')
    await user.click(addButton())

    expect(await screen.findByText(message)).toBeInTheDocument()
  })
})

describe('AddReadingCard: time slots and the colour scale', () => {
  it('marks the clicked slot as selected', async () => {
    const { user } = renderForm()
    const dinner = screen.getByRole('button', { name: 'After dinner' })
    await user.click(dinner)

    expect(dinner).toHaveAttribute('aria-pressed', 'true')
    for (const name of ['Morning (fasting)', 'After breakfast', 'After lunch']) {
      expect(screen.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'false')
    }
  })

  it('explains where the typed value sits on the scale', async () => {
    const { user } = renderForm()
    expect(screen.getByText('Type a value to see where it sits on the scale.')).toBeInTheDocument()

    await user.type(valueInput(), '196')
    expect(screen.getByText('196 mg/dl is high.')).toBeInTheDocument()
  })
})

describe('AddReadingCard: editing', () => {
  const existing: Reading = { id: 7, date: '2026-11-20', slot: 'AFTER_DINNER', value: 140 }

  it('starts filled in with the reading and saves changes with update', async () => {
    update.mockResolvedValue({ reading: { ...existing, value: 150 } })
    const { user, onSaved } = renderForm({ editing: existing })

    expect(screen.getByRole('heading', { name: 'Edit reading' })).toBeInTheDocument()
    expect(valueInput()).toHaveValue('140')
    expect(screen.getByRole('button', { name: 'After dinner' })).toHaveAttribute('aria-pressed', 'true')

    await user.clear(valueInput())
    await user.type(valueInput(), '150')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(update).toHaveBeenCalledWith(7, { date: '2026-11-20', slot: 'AFTER_DINNER', value: '150' })
    expect(create).not.toHaveBeenCalled()
    expect(onSaved).toHaveBeenCalled()
  })

  it('calls onCancelEdit when Cancel is clicked', async () => {
    const onCancelEdit = vi.fn()
    const { user } = renderForm({ editing: existing, onCancelEdit })
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancelEdit).toHaveBeenCalled()
  })
})
