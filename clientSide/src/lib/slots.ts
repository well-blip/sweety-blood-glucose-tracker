import { Moon, Sun, SunMedium, Sunrise, type LucideIcon } from 'lucide-react'

// The four time slots Kenpath's spec allows, in the order they happen in a day.
// `id` is the value we'll send to the API later; `label` is what users see.
export type SlotId = 'MORNING_FASTING' | 'AFTER_BREAKFAST' | 'AFTER_LUNCH' | 'AFTER_DINNER'

export type Slot = {
  id: SlotId
  label: string
  caption: string
  icon: LucideIcon
  // CSS class that selects this slot's sky scene (see slot-scene.css)
  scene: 'dawn' | 'morning' | 'noon' | 'night'
}

export const SLOTS: Slot[] = [
  {
    id: 'MORNING_FASTING',
    label: 'Morning (fasting)',
    caption: 'Before food, just after waking',
    icon: Sunrise,
    scene: 'dawn',
  },
  {
    id: 'AFTER_BREAKFAST',
    label: 'After breakfast',
    caption: 'About 2 hours after your meal',
    icon: Sun,
    scene: 'morning',
  },
  {
    id: 'AFTER_LUNCH',
    label: 'After lunch',
    caption: 'Midday check',
    icon: SunMedium,
    scene: 'noon',
  },
  {
    id: 'AFTER_DINNER',
    label: 'After dinner',
    caption: 'Evening check before bed',
    icon: Moon,
    scene: 'night',
  },
]

// Pick the slot that best matches the time of day, so most entries need one click fewer.
//   04:00–08:59 → Morning (fasting)
//   09:00–11:59 → After breakfast
//   12:00–16:59 → After lunch
//   17:00–03:59 → After dinner
export function slotForHour(hour: number): SlotId {
  if (hour >= 4 && hour < 9) return 'MORNING_FASTING'
  if (hour >= 9 && hour < 12) return 'AFTER_BREAKFAST'
  if (hour >= 12 && hour < 17) return 'AFTER_LUNCH'
  return 'AFTER_DINNER'
}
