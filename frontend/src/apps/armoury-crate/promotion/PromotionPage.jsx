import { ChevronDown, ChevronUp, ExternalLink, ImageIcon, MessageSquareText, Play, Search, ShoppingCart } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  PROMOTION_AURA_READY_DEALS,
  PROMOTION_FAQ,
  PROMOTION_FEATURED_DEAL,
  PROMOTION_GAME_DEAL_FILTERS,
  PROMOTION_GAME_DEALS,
  PROMOTION_GAMESPLANET_DEALS,
  PROMOTION_NEWS,
  PROMOTION_OFFER_HIGHLIGHTS,
  PROMOTION_RECOMMENDED,
  PROMOTION_STORAGE_KEY,
  PROMOTION_TABS
} from './promotionData.js'
import '../../../styles/apps/armoury-crate-promotion.css'

const DEFAULT_STATE = {
  activeTab: 'game-deals',
  activeGameDealsFilter: 'all-games',
  searchQuery: '',
  expandedFaqId: PROMOTION_FAQ[0]?.id || null,
  selectedNewsId: 'wallpapers'
}

function loadPromotionState() {
  if (typeof window === 'undefined') return DEFAULT_STATE

  try {
    const rawValue = window.localStorage.getItem(PROMOTION_STORAGE_KEY)
    if (!rawValue) return DEFAULT_STATE

    const parsed = JSON.parse(rawValue)
    return {
      ...DEFAULT_STATE,
      ...parsed
    }
  } catch (error) {
    return DEFAULT_STATE
  }
}

function matchesSearch(item, searchQuery) {
  if (!searchQuery.trim()) return true

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const haystack = [
    item.title,
    item.question,
    item.answer,
    item.summary,
    item.description,
    item.eyebrow,
    item.category,
    ...(item.searchTerms || [])
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return haystack.includes(normalizedQuery)
}

export default function PromotionPage() {
  const [uiState, setUiState] = useState(() => loadPromotionState())

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(PROMOTION_STORAGE_KEY, JSON.stringify(uiState))
  }, [uiState])

  const visibleDeals = PROMOTION_GAME_DEALS.filter((item) => matchesSearch(item, uiState.searchQuery))
  const visibleGamesplanetDeals = PROMOTION_GAMESPLANET_DEALS.filter((item) => matchesSearch(item, uiState.searchQuery))
  const visibleAuraReadyDeals = PROMOTION_AURA_READY_DEALS.filter((item) => matchesSearch(item, uiState.searchQuery))
  const visibleOfferHighlights = PROMOTION_OFFER_HIGHLIGHTS.filter((item) => matchesSearch(item, uiState.searchQuery))
  const visibleRecommended = PROMOTION_RECOMMENDED.filter((item) => matchesSearch(item, uiState.searchQuery))
  const visibleNews = PROMOTION_NEWS.filter((item) => matchesSearch(item, uiState.searchQuery))
  const visibleFaq = PROMOTION_FAQ.filter((item) => matchesSearch(item, uiState.searchQuery))
  const featuredDealVisible = matchesSearch(PROMOTION_FEATURED_DEAL, uiState.searchQuery)
  const showingFaq = uiState.activeTab === 'game-deals' && uiState.activeGameDealsFilter === 'faq'

  function updateUiState(partialState) {
    setUiState((previous) => ({
      ...previous,
      ...(typeof partialState === 'function' ? partialState(previous) : partialState)
    }))
  }

  function handleTabSelect(tabId) {
    updateUiState({ activeTab: tabId })
  }

  function renderBody() {
    if (uiState.activeTab === 'recommended') {
      if (visibleRecommended.length === 0) {
        return <PromotionEmptyState message="No recommended promotions match the current search." />
      }

      return (
        <div className="armoury-crate-promotion-recommended-grid">
          {visibleRecommended.map((item) => (
            <article key={item.id} className="armoury-crate-promotion-story-card">
              <div className="armoury-crate-promotion-story-media">
                <img src={item.image} alt={item.title} loading="lazy" />
              </div>
              <div className="armoury-crate-promotion-story-copy">
                <span>{item.eyebrow}</span>
                <h2>{item.title}</h2>
                <p>{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      )
    }

    if (uiState.activeTab === 'news') {
      if (visibleNews.length === 0) {
        return <PromotionEmptyState message="No promotion news items match the current search." />
      }

      return (
        <PromotionNewsGrid
          items={visibleNews}
          selectedId={uiState.selectedNewsId}
          onSelect={(selectedNewsId) => updateUiState({ selectedNewsId })}
        />
      )
    }

    if (showingFaq) {
      if (visibleFaq.length === 0) {
        return <PromotionEmptyState message="No FAQ entries match the current search." />
      }

      return (
        <div className="armoury-crate-promotion-faq-list">
          {visibleFaq.map((item) => {
            const isExpanded = uiState.expandedFaqId === item.id
            return (
              <article key={item.id} className={`armoury-crate-promotion-faq-card ${isExpanded ? 'expanded' : ''}`}>
                <button
                  type="button"
                  className="armoury-crate-promotion-faq-toggle"
                  onClick={() => updateUiState({ expandedFaqId: isExpanded ? null : item.id })}
                >
                  <span>{item.question}</span>
                  {isExpanded ? <ChevronUp size={18} strokeWidth={2.1} /> : <ChevronDown size={18} strokeWidth={2.1} />}
                </button>
                {isExpanded ? <p>{item.answer}</p> : null}
              </article>
            )
          })}
        </div>
      )
    }

    const hasVisibleGameDeals =
      featuredDealVisible ||
      visibleDeals.length > 0 ||
      visibleGamesplanetDeals.length > 0 ||
      visibleAuraReadyDeals.length > 0 ||
      visibleOfferHighlights.length > 0

    if (!hasVisibleGameDeals) {
      return <PromotionEmptyState message="No game deals match the current search." />
    }

    return (
      <div className="armoury-crate-promotion-catalog">
        {featuredDealVisible ? (
          <article className="armoury-crate-promotion-hero-card">
            <img src={PROMOTION_FEATURED_DEAL.image} alt={PROMOTION_FEATURED_DEAL.title} />
            <div className="armoury-crate-promotion-hero-overlay" />
            <div className="armoury-crate-promotion-hero-title">{PROMOTION_FEATURED_DEAL.title}</div>
            <div className="armoury-crate-promotion-price-tag">
              <span className="discount">{PROMOTION_FEATURED_DEAL.discountLabel}</span>
              <span className="price">{PROMOTION_FEATURED_DEAL.priceLabel}</span>
            </div>
          </article>
        ) : null}

        <section className="armoury-crate-promotion-vip-banner" aria-label="ROG VIP promotion">
          <div className="armoury-crate-promotion-vip-mark" aria-hidden="true">
            <RogVipIcon />
            <span>REPUBLIC OF GAMERS</span>
          </div>
          <div className="armoury-crate-promotion-vip-copy">
            <strong>Our best gaming deals are exclusive to ROG VIPs</strong>
            <p>Check back each week to see the latest offers, only at ROG. Become a ROG VIP today.</p>
          </div>
        </section>

        {visibleDeals.length > 0 ? (
          <PromotionDealGrid deals={visibleDeals} />
        ) : null}

        {visibleAuraReadyDeals.length > 0 ? (
          <section className="armoury-crate-promotion-section armoury-crate-promotion-section--aura-ready">
            <div className="armoury-crate-promotion-aura-ready-badge" aria-hidden="true">
              <AuraReadyBadge />
            </div>
            <p className="armoury-crate-promotion-aura-ready-copy">
              Enjoy unprecedented RGB lighting experiences with your favorite games
            </p>
            <div className="armoury-crate-promotion-aura-ready-rule" aria-hidden="true" />
            <PromotionDealGrid deals={visibleAuraReadyDeals} />
          </section>
        ) : null}

        {visibleGamesplanetDeals.length > 0 ? (
          <section className="armoury-crate-promotion-section armoury-crate-promotion-section--partner">
            <PromotionDealGrid deals={visibleGamesplanetDeals} />
            <div className="armoury-crate-promotion-partner-mark" aria-hidden="true">
              <GamesplanetLogo />
              <span>GAMESPLANET</span>
            </div>
          </section>
        ) : null}

        {visibleOfferHighlights.length > 0 ? (
          <section className="armoury-crate-promotion-section armoury-crate-promotion-section--highlights">
            <h2 className="armoury-crate-promotion-section-title">GAME OFFER HIGHLIGHTS</h2>
            <PromotionDealGrid deals={visibleOfferHighlights} variant="compact" />
          </section>
        ) : null}
      </div>
    )
  }

  return (
    <section className="armoury-crate-promotion-page">
      <header className="armoury-crate-promotion-header">
        <div className="armoury-crate-promotion-header-copy">
          <h1>Promotion</h1>
        </div>

        <div className="armoury-crate-device-header-tools armoury-crate-promotion-header-tools" aria-hidden="true">
          <PromotionHeaderIcon />
        </div>
      </header>

      <div className="armoury-crate-promotion-tabs" role="tablist" aria-label="Promotion sections">
        {PROMOTION_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={uiState.activeTab === tab.id}
            className={`armoury-crate-promotion-tab ${uiState.activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabSelect(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className={`armoury-crate-promotion-shell ${uiState.activeTab === 'news' ? 'news-mode' : ''}`}>
        {uiState.activeTab !== 'news' ? (
          <div className="armoury-crate-promotion-toolbar">
            <div className="armoury-crate-promotion-toolbar-left">
              {uiState.activeTab === 'game-deals' ? (
                <div className="armoury-crate-promotion-filter-row" role="tablist" aria-label="Game deals view">
                  {PROMOTION_GAME_DEAL_FILTERS.map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      role="tab"
                      aria-selected={uiState.activeGameDealsFilter === filter.id}
                      className={`armoury-crate-promotion-filter ${uiState.activeGameDealsFilter === filter.id ? 'active' : ''}`}
                      onClick={() => updateUiState({ activeGameDealsFilter: filter.id })}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="armoury-crate-promotion-toolbar-title">ROG Curation</div>
              )}
            </div>

            <label className="armoury-crate-promotion-search">
              <input
                type="search"
                value={uiState.searchQuery}
                onChange={(event) => updateUiState({ searchQuery: event.target.value })}
                placeholder="Search for games"
                aria-label="Search promotions"
              />
              <Search size={22} strokeWidth={1.8} />
            </label>
          </div>
        ) : null}

        <div className={`armoury-crate-promotion-scroll ${uiState.activeTab === 'news' ? 'news-mode' : ''}`}>
          {renderBody()}
        </div>
      </section>
    </section>
  )
}

function PromotionNewsGrid({ items, selectedId, onSelect }) {
  return (
    <div className="armoury-crate-promotion-news-grid">
      {items.map((item) => (
        <PromotionNewsCard
          key={item.id}
          item={item}
          selected={selectedId === item.id}
          onSelect={() => onSelect(item.id)}
        />
      ))}
    </div>
  )
}

function PromotionNewsCard({ item, selected, onSelect }) {
  const layoutClassName = item.layout === 'wide' ? 'wide' : 'standard'

  return (
    <article className={`armoury-crate-promotion-news-tile ${layoutClassName} ${selected ? 'selected' : ''}`}>
      <button type="button" className="armoury-crate-promotion-news-button" onClick={onSelect}>
        <div className="armoury-crate-promotion-news-tile-media">
          <PromotionNewsArtwork item={item} />
          <PromotionNewsBadge kind={item.badgeKind} tone={item.badgeTone} />
        </div>
        <div className="armoury-crate-promotion-news-tile-copy">
          <h2>{item.title}</h2>
          {item.summary ? <p>{item.summary}</p> : null}
        </div>
      </button>
    </article>
  )
}

function PromotionNewsArtwork({ item }) {
  if (!item.artworkKind) {
    return <PromotionArtwork src={item.image} fallbackSrc={item.fallbackImage} title={item.title} />
  }

  if (item.artworkKind === 'pocket-gear') {
    return (
      <div className="armoury-crate-promotion-news-art pocket-gear">
        <div className="armoury-crate-promotion-news-art-copy">
          <span className="headline">POCKET GEAR</span>
          <div className="callouts">
            <span className="blind-box">BLIND BOX</span>
            <span className="cta">Complete the Set. Unlock the Pocket Gear.</span>
          </div>
        </div>
        <div className="armoury-crate-promotion-news-art-pocket-items" aria-hidden="true">
          <span className="item item-keyboard" />
          <span className="item item-headset" />
          <span className="item item-clock" />
          <span className="item item-chip" />
        </div>
      </div>
    )
  }

  if (item.artworkKind === 'zenbook-duo') {
    return (
      <div className="armoury-crate-promotion-news-art zenbook-duo">
        <div className="armoury-crate-promotion-news-art-copy">
          <span className="kicker">ASUS Zenbook DUO</span>
          <strong>Dual-Screen Powerhouse</strong>
          <p>for Seamless Multitasking</p>
          <small>Copilot+ PC</small>
        </div>
        <div className="armoury-crate-promotion-news-art-zenbook-devices" aria-hidden="true">
          <span className="device device-rear" />
          <span className="device device-front" />
          <span className="reflection" />
        </div>
      </div>
    )
  }

  if (item.artworkKind === 'wallpapers') {
    return (
      <div className="armoury-crate-promotion-news-art wallpapers">
        <span className="streak streak-a" aria-hidden="true" />
        <span className="streak streak-b" aria-hidden="true" />
        <span className="streak streak-c" aria-hidden="true" />
        <img src="/armoury-crate-icon.png" alt="" aria-hidden="true" />
      </div>
    )
  }

  if (item.artworkKind === 'armoury-crate') {
    return (
      <div className="armoury-crate-promotion-news-art armoury-crate">
        <span className="beam beam-a" aria-hidden="true" />
        <span className="beam beam-b" aria-hidden="true" />
        <span className="beam beam-c" aria-hidden="true" />
        <img src="/armoury-crate-icon.png" alt="" aria-hidden="true" />
      </div>
    )
  }

  if (item.artworkKind === 'aura-creator') {
    return (
      <div className="armoury-crate-promotion-news-art aura-creator">
        <span className="aura-line aura-line-a" aria-hidden="true" />
        <span className="aura-line aura-line-b" aria-hidden="true" />
        <span className="aura-line aura-line-c" aria-hidden="true" />
        <div className="prism" aria-hidden="true" />
      </div>
    )
  }

  if (item.artworkKind === 'asus-store') {
    return (
      <div className="armoury-crate-promotion-news-art asus-store">
        <div className="store-copy">
          <span>Discover the best products and solutions on the ASUS website.</span>
        </div>
        <div className="store-category category-a">
          <span>Mobile &amp; Wearables</span>
        </div>
        <div className="store-category category-b">
          <span>Laptops</span>
        </div>
        <div className="store-category category-c">
          <span>Motherboards / Components</span>
        </div>
        <div className="store-category category-d">
          <span>Networking</span>
        </div>
        <div className="store-category category-e">
          <span>Accessories</span>
        </div>
        <div className="product product-phone" />
        <div className="product product-watch" />
        <div className="product product-laptop" />
        <div className="product product-monitor" />
        <div className="product product-board" />
        <div className="product product-router" />
        <div className="product product-keyboard" />
      </div>
    )
  }

  if (item.artworkKind === 'rog-discord') {
    return (
      <div className="armoury-crate-promotion-news-art rog-discord">
        <div className="discord-mark" aria-hidden="true">
          <DiscordIcon />
        </div>
        <span>DISCORD</span>
      </div>
    )
  }

  if (item.artworkKind === 'rog-facebook') {
    return (
      <div className="armoury-crate-promotion-news-art rog-facebook">
        <div className="anniversary-mark" aria-hidden="true">
          <span className="twenty">20</span>
          <span className="anniversary-text">ANNIVERSARY</span>
          <span className="rog-mark">ROG</span>
        </div>
        <span className="philippines">PHILIPPINES</span>
      </div>
    )
  }

  return <PromotionArtwork src={item.image} fallbackSrc={item.fallbackImage} title={item.title} />
}

function PromotionNewsBadge({ kind, tone }) {
  return (
    <span className={`armoury-crate-promotion-news-badge ${tone || 'gold'}`}>
      {kind === 'video' ? <Play size={18} strokeWidth={2.1} /> : null}
      {kind === 'image' ? <ImageIcon size={18} strokeWidth={2.1} /> : null}
      {kind === 'forum' ? <MessageSquareText size={18} strokeWidth={2.1} /> : null}
      {kind === 'store' ? <ShoppingCart size={18} strokeWidth={2.1} /> : null}
      {kind === 'discord' ? <DiscordIcon /> : null}
      {kind === 'facebook' ? <NewsFacebookIcon /> : null}
      {(!kind || kind === 'external') ? <ExternalLink size={18} strokeWidth={2.1} /> : null}
    </span>
  )
}

function PromotionDealGrid({ deals, variant = 'default' }) {
  return (
    <div className={`armoury-crate-promotion-deal-grid ${variant === 'compact' ? 'compact' : ''}`}>
      {deals.map((deal) => (
        <PromotionDealCard key={deal.id} deal={deal} compact={variant === 'compact'} />
      ))}
    </div>
  )
}

function PromotionDealCard({ deal, compact = false }) {
  return (
    <article className={`armoury-crate-promotion-deal-card ${compact ? 'compact' : ''}`} aria-label={deal.title}>
      <div className="armoury-crate-promotion-deal-media">
        <PromotionArtwork src={deal.image} fallbackSrc={deal.fallbackImage} title={deal.title} />
      </div>
      <div className="armoury-crate-promotion-deal-bar">
        <div className="armoury-crate-promotion-vip-price">
          <RogVipMiniIcon />
          <span>VIP: {deal.vipPrice}</span>
        </div>
        <div className={`armoury-crate-promotion-regular-price ${deal.discountLabel ? '' : 'no-discount'}`}>
          {deal.discountLabel ? <strong>{deal.discountLabel}</strong> : null}
          <span>{deal.salePrice}</span>
        </div>
      </div>
    </article>
  )
}

function PromotionArtwork({ src, fallbackSrc, title }) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc || null)

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc || null)
  }, [src, fallbackSrc])

  if (!currentSrc) {
    return (
      <div className="armoury-crate-promotion-artwork-fallback">
        <span>{title}</span>
      </div>
    )
  }

  return (
    <img
      src={currentSrc}
      alt={title}
      loading="lazy"
      onError={() => {
        if (currentSrc !== fallbackSrc && fallbackSrc) {
          setCurrentSrc(fallbackSrc)
          return
        }

        setCurrentSrc(null)
      }}
    />
  )
}

function NewsFacebookIcon() {
  return (
    <svg viewBox="0 0 20 20" role="img" aria-hidden="true">
      <path
        d="M11.7 18v-6h2.1l.3-2.4h-2.4V8.1c0-.7.2-1.1 1.2-1.1H14V4.9c-.6-.1-1.3-.1-1.9-.1-1.9 0-3.2 1.2-3.2 3.3v1.5H7v2.4h1.9v6Z"
        fill="currentColor"
      />
    </svg>
  )
}

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
      <path
        d="M8.1 8.2a12.5 12.5 0 0 1 3-.5l.4.8a9.3 9.3 0 0 0-2.8.7c.2.1.4.3.6.4 1.7-.8 3.7-.8 5.4 0 .2-.1.4-.3.6-.4a9.2 9.2 0 0 0-2.9-.7l.4-.8c1 .1 2 .3 3 .5 1.6 2.3 2 4.6 1.8 6.8a12.3 12.3 0 0 1-3.7 1.9l-.8-1.2c.6-.2 1.2-.5 1.8-.9a4.6 4.6 0 0 1-1 .5c-1.6.5-3.3.5-4.8 0a4.9 4.9 0 0 1-1-.5c.6.4 1.2.7 1.8.9l-.8 1.2A12.3 12.3 0 0 1 6.3 15c-.2-2.2.2-4.5 1.8-6.8ZM9.8 13.7c.6 0 1-.5 1-1.2s-.4-1.2-1-1.2-1 .5-1 1.2.5 1.2 1 1.2Zm4.4 0c.6 0 1-.5 1-1.2s-.4-1.2-1-1.2-1 .5-1 1.2.4 1.2 1 1.2Z"
        fill="currentColor"
      />
    </svg>
  )
}

function PromotionEmptyState({ message }) {
  return (
    <section className="armoury-crate-promotion-empty">
      <div className="armoury-crate-content-empty-state-inner">
        <div className="armoury-crate-section-heading">
          <span className="armoury-crate-section-accent" aria-hidden="true" />
          <span>No Results</span>
        </div>
        <p>{message}</p>
      </div>
    </section>
  )
}

function GamesplanetLogo() {
  return (
    <svg viewBox="0 0 56 56" role="img">
      <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="4" />
      <path d="M19 28h18l-7 7" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="square" />
      <path d="M30 17a11 11 0 1 1-11 11" fill="none" stroke="currentColor" strokeWidth="4" />
    </svg>
  )
}

function AuraReadyBadge() {
  return (
    <svg viewBox="0 0 120 120" role="img">
      <defs>
        <linearGradient id="armoury-crate-aura-ready-ring" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff5941" />
          <stop offset="28%" stopColor="#ffc93a" />
          <stop offset="52%" stopColor="#68ff7d" />
          <stop offset="76%" stopColor="#32d4ff" />
          <stop offset="100%" stopColor="#ff48cf" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="52" fill="#050505" stroke="url(#armoury-crate-aura-ready-ring)" strokeWidth="7" />
      <circle cx="60" cy="60" r="40" fill="#0b0b0b" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
      <text x="60" y="34" fill="#f4f4f2" fontSize="14" fontWeight="700" textAnchor="middle">
        ASUS
      </text>
      <text x="60" y="59" fill="#ffffff" fontSize="24" fontWeight="800" textAnchor="middle">
        AURA
      </text>
      <text x="60" y="82" fill="#f4f4f2" fontSize="16" fontWeight="700" textAnchor="middle">
        READY
      </text>
    </svg>
  )
}

function PromotionHeaderIcon() {
  return (
    <svg viewBox="0 0 112 74" role="img">
      <g fill="none" stroke="#f2f2f2" strokeWidth="2.2" strokeLinecap="square" strokeLinejoin="miter">
        <path d="M34 12H62V58H34Z" />
        <path d="M41 51H55" />
        <path d="M72 18V52" opacity="0.96" />
        <path d="M80 24V46" opacity="0.72" />
        <path d="M88 14V56" opacity="0.46" />
        <path d="M96 22V48" opacity="0.26" />
      </g>
    </svg>
  )
}

function RogVipIcon() {
  return (
    <svg viewBox="0 0 120 60" role="img">
      <path
        d="M8 26 64 9c11-3 30-3 44 0L55 24l34 2-16 9H21l38 5-18 11L8 41l29-8Z"
        fill="currentColor"
      />
    </svg>
  )
}

function RogVipMiniIcon() {
  return (
    <svg viewBox="0 0 30 16" role="img">
      <path d="M2 8 16 3c4-1 8-1 12 0l-10 4 7 1-5 3H6l10 1-5 3-9-3 8-2Z" fill="currentColor" />
    </svg>
  )
}
