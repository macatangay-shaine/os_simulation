import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function ContentHeroCarousel({ slides, activeIndex, onSelect, onPrevious, onNext }) {
  const activeSlide = slides[activeIndex]
  const [shouldShowVideo, setShouldShowVideo] = useState(Boolean(activeSlide?.videoUrl))

  useEffect(() => {
    setShouldShowVideo(Boolean(activeSlide?.videoUrl))
  }, [activeSlide?.id, activeSlide?.videoUrl])

  if (!activeSlide) return null

  return (
    <section className="armoury-crate-content-hero-group" aria-label="Featured content">
      <div className="armoury-crate-content-hero">
        <button
          type="button"
          className="armoury-crate-content-hero-arrow left"
          aria-label="Previous featured content"
          onClick={onPrevious}
        >
          <ChevronLeft size={22} strokeWidth={1.9} />
        </button>

        <div className="armoury-crate-content-hero-media">
          {activeSlide.videoUrl && shouldShowVideo ? (
            <video
              key={activeSlide.id}
              className="armoury-crate-content-hero-video"
              src={activeSlide.videoUrl}
              poster={activeSlide.image}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              onError={() => setShouldShowVideo(false)}
            />
          ) : (
            <img src={activeSlide.image} alt="" />
          )}
        </div>

        <div className="armoury-crate-content-hero-copy">
          <h2>{activeSlide.title}</h2>
          <p>{activeSlide.description}</p>
        </div>

        <button
          type="button"
          className="armoury-crate-content-hero-arrow right"
          aria-label="Next featured content"
          onClick={onNext}
        >
          <ChevronRight size={22} strokeWidth={1.9} />
        </button>
      </div>

      <div className="armoury-crate-content-hero-pagination" aria-label="Featured content pages">
        {slides.map((slide, index) => {
          const isActive = index === activeIndex
          return (
            <button
              key={slide.id}
              type="button"
              className={`armoury-crate-content-hero-dot ${isActive ? 'active' : ''}`}
              aria-label={`View featured slide ${index + 1}`}
              aria-pressed={isActive}
              onClick={() => onSelect(index)}
            />
          )
        })}
      </div>
    </section>
  )
}
