import { ChevronLeft, ChevronRight, Grid2x2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import ContentCard from './ContentCard.jsx'

export default function ContentSection({ section, items, favorites, library, onToggleFavorite, onAcquire }) {
  const rowRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    const row = rowRef.current
    if (!row) return undefined

    const updateButtons = () => {
      setCanScrollLeft(row.scrollLeft > 10)
      setCanScrollRight(row.scrollWidth - row.clientWidth - row.scrollLeft > 10)
    }

    updateButtons()
    row.addEventListener('scroll', updateButtons)
    window.addEventListener('resize', updateButtons)

    return () => {
      row.removeEventListener('scroll', updateButtons)
      window.removeEventListener('resize', updateButtons)
    }
  }, [items])

  function handleScroll(direction) {
    const row = rowRef.current
    if (!row) return
    row.scrollBy({ left: direction * Math.max(row.clientWidth * 0.86, 320), behavior: 'smooth' })
  }

  return (
    <section className="armoury-crate-content-section">
      <div className="armoury-crate-content-section-header">
        <div className="armoury-crate-section-heading">
          <span className="armoury-crate-section-accent" aria-hidden="true" />
          <span>{section.title}</span>
        </div>

        <button type="button" className="armoury-crate-content-more-button">
          <span>More</span>
          <Grid2x2 size={20} strokeWidth={1.8} />
        </button>
      </div>

      <div className="armoury-crate-content-row-shell">
        {canScrollLeft ? (
          <button
            type="button"
            className="armoury-crate-content-row-arrow left"
            aria-label={`Scroll ${section.title} left`}
            onClick={() => handleScroll(-1)}
          >
            <ChevronLeft size={18} strokeWidth={2} />
          </button>
        ) : null}

        <div className="armoury-crate-content-row" ref={rowRef}>
          {items.map((item) => (
            <ContentCard
              key={`${section.id}-${item.id}`}
              item={item}
              isFavorited={Boolean(favorites[item.id])}
              status={library[item.id] || 'available'}
              onToggleFavorite={onToggleFavorite}
              onAcquire={onAcquire}
            />
          ))}
        </div>

        {canScrollRight ? (
          <button
            type="button"
            className="armoury-crate-content-row-arrow right"
            aria-label={`Scroll ${section.title} right`}
            onClick={() => handleScroll(1)}
          >
            <ChevronRight size={18} strokeWidth={2} />
          </button>
        ) : null}
      </div>
    </section>
  )
}
