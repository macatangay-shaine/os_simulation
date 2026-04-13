import { useEffect, useState } from 'react'
import { Download, Heart } from 'lucide-react'

const STATUS_LABELS = {
  available: 'Get',
  downloading: 'Downloading...',
  added: 'Added'
}

export default function ContentCard({ item, isFavorited, status, onToggleFavorite, onAcquire }) {
  const actionLabel = STATUS_LABELS[status] || STATUS_LABELS.available
  const [imageSrc, setImageSrc] = useState(item.image)

  useEffect(() => {
    setImageSrc(item.image)
  }, [item.id, item.image])

  function handleImageError() {
    if (item.fallbackImage && imageSrc !== item.fallbackImage) {
      setImageSrc(item.fallbackImage)
    }
  }

  return (
    <article className={`armoury-crate-content-card ${status !== 'available' ? `status-${status}` : ''}`}>
      <div className="armoury-crate-content-card-cover">
        <img src={imageSrc} alt="" onError={handleImageError} />
      </div>

      <div className="armoury-crate-content-card-body">
        <h3 title={item.title}>{item.title}</h3>
        <span className="armoury-crate-content-card-badge">{item.badgeText}</span>

        <div className="armoury-crate-content-card-actions">
          <div className="armoury-crate-content-card-icon-row">
            <button
              type="button"
              className={`armoury-crate-content-card-icon ${isFavorited ? 'active' : ''}`}
              aria-pressed={isFavorited}
              aria-label={`${isFavorited ? 'Remove' : 'Add'} ${item.title} ${isFavorited ? 'from' : 'to'} favorites`}
              onClick={() => onToggleFavorite(item.id)}
            >
              <Heart size={22} strokeWidth={1.85} />
            </button>

            <button
              type="button"
              className={`armoury-crate-content-card-icon ${status !== 'available' ? 'active' : ''}`}
              aria-label={`${status === 'available' ? 'Download' : 'Open'} ${item.title}`}
              onClick={() => onAcquire(item.id)}
            >
              <Download size={22} strokeWidth={1.85} />
            </button>
          </div>

          <button
            type="button"
            className={`armoury-crate-content-card-get ${status}`}
            disabled={status === 'downloading'}
            onClick={() => onAcquire(item.id)}
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </article>
  )
}
