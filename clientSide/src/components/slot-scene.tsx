import { SLOTS, type SlotId } from '@/lib/slots'
import './slot-scene.css'

// Random star positions, created once when the file loads.
// Keeping them outside the component means they don't jump around on every re-render.
const STARS = Array.from({ length: 34 }, () => ({
  left: Math.random() * 96,
  top: Math.random() * 80,
  size: Math.random() < 0.25 ? 3 : 2,
  delay: Math.random() * 3,
  duration: 2 + Math.random() * 3,
}))

type SlotSceneProps = {
  slotId: SlotId
}

export function SlotScene({ slotId }: SlotSceneProps) {
  const slot = SLOTS.find((s) => s.id === slotId) ?? SLOTS[0]

  return (
    <div className="scene" aria-hidden="true">
      <div className={`scene-layer scene-dawn ${slot.scene === 'dawn' ? 'is-active' : ''}`}>
        <div className="scene-sun" />
      </div>

      <div className={`scene-layer scene-morning ${slot.scene === 'morning' ? 'is-active' : ''}`}>
        <div className="scene-rays" />
        <div className="scene-sun" />
      </div>

      <div className={`scene-layer scene-noon ${slot.scene === 'noon' ? 'is-active' : ''}`}>
        <div className="scene-sun" />
      </div>

      <div className={`scene-layer scene-night ${slot.scene === 'night' ? 'is-active' : ''}`}>
        {STARS.map((star, i) => (
          <span
            key={i}
            className="scene-star"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: star.size,
              height: star.size,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`,
            }}
          />
        ))}
        <div className="scene-moon" />
      </div>

      <div className="scene-caption">
        <p className="text-lg font-medium">{slot.label}</p>
        <p className="text-sm opacity-85">{slot.caption}</p>
      </div>
    </div>
  )
}
