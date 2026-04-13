import {
  Bell,
  CalendarDays,
  Gift,
  Package2,
  Plus,
  ShieldCheck,
  Trophy,
  X
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  ARMOURY_USER_CENTER_STORAGE_KEY,
  formatUserCenterDate,
  formatUserCenterTime,
  loadArmouryUserCenterState,
  USER_CENTER_TABS
} from './userCenterData.js'
import '../../../styles/apps/armoury-crate-user-center.css'

const EMPTY_LOGIN_FORM = {
  email: '',
  password: ''
}

const EMPTY_PRODUCT_FORM = {
  productName: '',
  modelName: '',
  serialNumber: ''
}

function buildDisplayNameFromEmail(email) {
  const normalizedValue = String(email || '')
    .split('@')[0]
    .replace(/[._-]+/g, ' ')
    .trim()

  if (!normalizedValue) return 'ASUS Member'

  return normalizedValue
    .split(' ')
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ')
}

export default function UserCenterPage() {
  const [userCenterState, setUserCenterState] = useState(() => loadArmouryUserCenterState())
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [registerModalOpen, setRegisterModalOpen] = useState(false)
  const [loginForm, setLoginForm] = useState(EMPTY_LOGIN_FORM)
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT_FORM)
  const [transientMessage, setTransientMessage] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(ARMOURY_USER_CENTER_STORAGE_KEY, JSON.stringify(userCenterState))
  }, [userCenterState])

  useEffect(() => {
    if (!transientMessage) return undefined

    const timeoutId = window.setTimeout(() => setTransientMessage(''), 2600)
    return () => window.clearTimeout(timeoutId)
  }, [transientMessage])

  const unreadNotifications = useMemo(
    () => userCenterState.notifications.filter((item) => !item.read).length,
    [userCenterState.notifications]
  )

  function updateState(updater) {
    setUserCenterState((previous) => ({
      ...previous,
      ...(typeof updater === 'function' ? updater(previous) : updater)
    }))
  }

  function openLoginModal() {
    setLoginForm((previous) => ({
      ...EMPTY_LOGIN_FORM,
      email: previous.email
    }))
    setLoginModalOpen(true)
  }

  function closeLoginModal() {
    setLoginModalOpen(false)
  }

  function closeRegisterModal() {
    setRegisterModalOpen(false)
    setProductForm(EMPTY_PRODUCT_FORM)
  }

  function handleLoginSubmit(event) {
    event.preventDefault()

    const email = loginForm.email.trim() || 'member@asus.com'
    const loggedInAt = new Date().toISOString()

    updateState((previous) => ({
      account: {
        name: buildDisplayNameFromEmail(email),
        email,
        lastLoginAt: loggedInAt
      },
      notifications: [
        {
          id: `notif-login-${Date.now()}`,
          title: 'ASUS account signed in.',
          body: 'User Center is now syncing your products, notifications, and ROG Elite rewards.',
          createdAt: loggedInAt,
          read: false
        },
        ...previous.notifications
      ]
    }))

    setLoginModalOpen(false)
    setTransientMessage('ASUS account connected.')
  }

  function handleLogout() {
    updateState({ account: null })
    setTransientMessage('ASUS account signed out.')
  }

  function handleOpenRegisterProduct() {
    if (!userCenterState.account) {
      openLoginModal()
      return
    }

    setRegisterModalOpen(true)
  }

  function handleRegisterProduct(event) {
    event.preventDefault()

    const now = new Date().toISOString()
    const productName = productForm.productName.trim() || 'ROG Device'
    const modelName = productForm.modelName.trim() || 'Gaming Series'
    const serialNumber = productForm.serialNumber.trim() || `ASUS-${Date.now().toString().slice(-8)}`

    updateState((previous) => ({
      products: [
        {
          id: `product-${Date.now()}`,
          productName,
          modelName,
          serialNumber,
          registeredAt: now,
          warrantyUntil: new Date(new Date(now).setFullYear(new Date(now).getFullYear() + 2)).toISOString(),
          status: 'Registered'
        },
        ...previous.products
      ],
      notifications: [
        {
          id: `notif-product-${Date.now()}`,
          title: `${productName} was registered successfully.`,
          body: 'The device is now linked to your ASUS account and eligible features can be reviewed in User Center.',
          createdAt: now,
          read: false
        },
        ...previous.notifications
      ],
      elite: {
        ...previous.elite,
        points: previous.elite.points + 120,
        pointsToNextTier: Math.max(0, previous.elite.pointsToNextTier - 120),
        missions: previous.elite.missions.map((mission) =>
          mission.id === 'mission-register' ? { ...mission, completed: true } : mission
        )
      }
    }))

    closeRegisterModal()
    setTransientMessage('Product registration saved.')
  }

  function handleRedeemOffer(redemptionId) {
    if (!userCenterState.account) {
      openLoginModal()
      return
    }

    const redeemedOffer = userCenterState.redemptions.find((item) => item.id === redemptionId)
    if (!redeemedOffer || redeemedOffer.status === 'claimed') return

    const now = new Date().toISOString()

    updateState((previous) => ({
      redemptions: previous.redemptions.map((item) =>
        item.id === redemptionId ? { ...item, status: 'claimed', claimedAt: now } : item
      ),
      notifications: [
        {
          id: `notif-redeem-${Date.now()}`,
          title: `${redeemedOffer.title} was claimed.`,
          body: 'Redemption details were linked to your ASUS member account.',
          createdAt: now,
          read: false
        },
        ...previous.notifications
      ]
    }))

    setTransientMessage('Redemption claimed.')
  }

  function handleMarkAllNotificationsRead() {
    updateState((previous) => ({
      notifications: previous.notifications.map((item) => ({
        ...item,
        read: true
      }))
    }))
    setTransientMessage('Notifications marked as read.')
  }

  function renderTabBody() {
    if (!userCenterState.account && userCenterState.activeTab !== 'my-products') {
      return (
        <section className="armoury-crate-user-center-login-required">
          <div className="armoury-crate-content-empty-state-inner">
            <div className="armoury-crate-section-heading">
              <span className="armoury-crate-section-accent" aria-hidden="true" />
              <span>ASUS Account Required</span>
            </div>
            <p>Sign in to review redemption records, registered events, notifications, and your ROG Elite status.</p>
            <button type="button" className="armoury-crate-user-center-action-button" onClick={openLoginModal}>
              Login
            </button>
          </div>
        </section>
      )
    }

    if (userCenterState.activeTab === 'my-products') {
      return (
        <section className="armoury-crate-user-center-products-grid">
          <button type="button" className="armoury-crate-user-center-register-card" onClick={handleOpenRegisterProduct}>
            <span className="armoury-crate-user-center-register-frame" aria-hidden="true">
              <Plus size={54} strokeWidth={1.5} />
            </span>
            <strong>Register a new product</strong>
          </button>

          {userCenterState.account && userCenterState.products.length > 0
            ? userCenterState.products.map((product) => (
                <article key={product.id} className="armoury-crate-user-center-product-card">
                  <div className="armoury-crate-user-center-product-badge">
                    <Package2 size={18} strokeWidth={1.8} />
                    <span>{product.status}</span>
                  </div>
                  <h3>{product.productName}</h3>
                  <p>{product.modelName}</p>
                  <dl>
                    <div>
                      <dt>Serial Number</dt>
                      <dd>{product.serialNumber}</dd>
                    </div>
                    <div>
                      <dt>Registered</dt>
                      <dd>{formatUserCenterDate(product.registeredAt)}</dd>
                    </div>
                    <div>
                      <dt>Warranty</dt>
                      <dd>{formatUserCenterDate(product.warrantyUntil)}</dd>
                    </div>
                  </dl>
                </article>
              ))
            : null}
        </section>
      )
    }

    if (userCenterState.activeTab === 'redemption') {
      return (
        <section className="armoury-crate-user-center-stack">
          {userCenterState.redemptions.map((offer) => (
            <article key={offer.id} className="armoury-crate-user-center-list-card">
              <div className="armoury-crate-user-center-list-copy">
                <div className="armoury-crate-user-center-list-title">
                  <Gift size={18} strokeWidth={1.8} />
                  <strong>{offer.title}</strong>
                </div>
                <p>{offer.summary}</p>
                <div className="armoury-crate-user-center-list-meta">
                  <span>Expires {formatUserCenterDate(offer.expiresAt)}</span>
                  <span>{offer.serialRequired ? 'Product registration required' : 'Account only'}</span>
                </div>
              </div>

              <button
                type="button"
                className="armoury-crate-user-center-action-button"
                disabled={offer.status === 'claimed'}
                onClick={() => handleRedeemOffer(offer.id)}
              >
                {offer.status === 'claimed' ? 'Claimed' : 'Redeem'}
              </button>
            </article>
          ))}
        </section>
      )
    }

    if (userCenterState.activeTab === 'registered-events') {
      return (
        <section className="armoury-crate-user-center-stack">
          {userCenterState.events.map((eventItem) => (
            <article key={eventItem.id} className="armoury-crate-user-center-list-card">
              <div className="armoury-crate-user-center-list-copy">
                <div className="armoury-crate-user-center-list-title">
                  <CalendarDays size={18} strokeWidth={1.8} />
                  <strong>{eventItem.title}</strong>
                </div>
                <p>{eventItem.location}</p>
                <div className="armoury-crate-user-center-list-meta">
                  <span>{formatUserCenterTime(eventItem.startsAt)}</span>
                  <span>{eventItem.status}</span>
                </div>
              </div>
            </article>
          ))}
        </section>
      )
    }

    if (userCenterState.activeTab === 'notifications') {
      return (
        <section className="armoury-crate-user-center-stack">
          <div className="armoury-crate-user-center-section-head">
            <div className="armoury-crate-user-center-section-title">
              <Bell size={18} strokeWidth={1.8} />
              <span>{userCenterState.notifications.length} notification(s)</span>
            </div>

            <button type="button" className="armoury-crate-user-center-ghost-button" onClick={handleMarkAllNotificationsRead}>
              Mark all as read
            </button>
          </div>

          {userCenterState.notifications.map((item) => (
            <article key={item.id} className={`armoury-crate-user-center-notification-card ${item.read ? 'read' : 'unread'}`}>
              <div className="armoury-crate-user-center-notification-dot" aria-hidden="true" />
              <div className="armoury-crate-user-center-list-copy">
                <div className="armoury-crate-user-center-list-title">
                  <strong>{item.title}</strong>
                </div>
                <p>{item.body}</p>
                <div className="armoury-crate-user-center-list-meta">
                  <span>{formatUserCenterTime(item.createdAt)}</span>
                </div>
              </div>
            </article>
          ))}
        </section>
      )
    }

    return (
      <section className="armoury-crate-user-center-elite">
        <article className="armoury-crate-user-center-elite-hero">
          <div>
            <span className="armoury-crate-user-center-elite-kicker">ROG Elite</span>
            <h2>{userCenterState.elite.tier}</h2>
            <p>Earn rewards, unlock benefits, and keep your ASUS ecosystem tied to one member profile.</p>
          </div>

          <div className="armoury-crate-user-center-elite-points">
            <strong>{userCenterState.elite.points}</strong>
            <span>Points</span>
          </div>
        </article>

        <div className="armoury-crate-user-center-elite-grid">
          <article className="armoury-crate-user-center-elite-panel">
            <div className="armoury-crate-user-center-list-title">
              <Trophy size={18} strokeWidth={1.8} />
              <strong>Tier Progress</strong>
            </div>
            <p>{userCenterState.elite.pointsToNextTier} more points until {userCenterState.elite.nextTierLabel}.</p>
            <div className="armoury-crate-user-center-elite-bar" aria-hidden="true">
              <span style={{ width: `${Math.min(100, ((1500 - userCenterState.elite.pointsToNextTier) / 1500) * 100)}%` }} />
            </div>
          </article>

          <article className="armoury-crate-user-center-elite-panel">
            <div className="armoury-crate-user-center-list-title">
              <ShieldCheck size={18} strokeWidth={1.8} />
              <strong>Weekly Missions</strong>
            </div>
            <div className="armoury-crate-user-center-mission-list">
              {userCenterState.elite.missions.map((mission) => (
                <div key={mission.id} className={`armoury-crate-user-center-mission ${mission.completed ? 'completed' : ''}`}>
                  <span>{mission.title}</span>
                  <strong>+{mission.reward}</strong>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    )
  }

  return (
    <section className="armoury-crate-user-center-page">
      <header className="armoury-crate-device-header armoury-crate-user-center-header">
        <div className="armoury-crate-device-header-copy armoury-crate-user-center-header-copy">
          <h1>User Center</h1>
        </div>

        <div className="armoury-crate-device-header-tools armoury-crate-user-center-header-tools" aria-hidden="true">
          <UserCenterHeaderIcon />
        </div>
      </header>

      {transientMessage ? <div className="armoury-crate-user-center-toast">{transientMessage}</div> : null}

      <section className="armoury-crate-user-center-hero">
        <div className="armoury-crate-user-center-avatar-shell" aria-hidden="true">
          <UserCenterAvatarIcon />
        </div>

        <div className="armoury-crate-user-center-hero-copy">
          {userCenterState.account ? (
            <>
              <h2>{userCenterState.account.name}</h2>
              <p>{userCenterState.account.email}</p>
              <div className="armoury-crate-user-center-summary-row">
                <span>{userCenterState.products.length} product(s)</span>
                <span>{unreadNotifications} unread notification(s)</span>
                <span>Last login {formatUserCenterTime(userCenterState.account.lastLoginAt)}</span>
              </div>
            </>
          ) : (
            <>
              <h2>Log in to your ASUS account</h2>
              <ul className="armoury-crate-user-center-benefits">
                <li>Backup your Scenario Profile Settings</li>
              </ul>
            </>
          )}
        </div>

        <div className="armoury-crate-user-center-hero-actions">
          {userCenterState.account ? (
            <>
              <button type="button" className="armoury-crate-user-center-action-button secondary" onClick={handleOpenRegisterProduct}>
                Register Product
              </button>
              <button type="button" className="armoury-crate-user-center-action-button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <button type="button" className="armoury-crate-user-center-action-button" onClick={openLoginModal}>
              Login
            </button>
          )}
        </div>
      </section>

      <div className="armoury-crate-user-center-tabs" role="tablist" aria-label="User Center tabs">
        {USER_CENTER_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={userCenterState.activeTab === tab.id}
            className={`armoury-crate-user-center-tab ${userCenterState.activeTab === tab.id ? 'active' : ''}`}
            onClick={() => updateState({ activeTab: tab.id })}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="armoury-crate-user-center-body">
        {renderTabBody()}
      </div>

      {loginModalOpen ? (
        <div className="armoury-crate-user-center-modal-backdrop">
          <div className="armoury-crate-user-center-modal">
            <div className="armoury-crate-user-center-modal-head">
              <strong>ASUS Account Login</strong>
              <button type="button" className="armoury-crate-user-center-modal-close" onClick={closeLoginModal} aria-label="Close login dialog">
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <form className="armoury-crate-user-center-form" onSubmit={handleLoginSubmit}>
              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(event) => setLoginForm((previous) => ({ ...previous, email: event.target.value }))}
                  placeholder="member@asus.com"
                />
              </label>

              <label>
                <span>Password</span>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(event) => setLoginForm((previous) => ({ ...previous, password: event.target.value }))}
                  placeholder="Enter your ASUS account password"
                />
              </label>

              <div className="armoury-crate-user-center-form-actions">
                <button type="button" className="armoury-crate-user-center-action-button secondary" onClick={closeLoginModal}>
                  Cancel
                </button>
                <button type="submit" className="armoury-crate-user-center-action-button">
                  Sign In
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {registerModalOpen ? (
        <div className="armoury-crate-user-center-modal-backdrop">
          <div className="armoury-crate-user-center-modal">
            <div className="armoury-crate-user-center-modal-head">
              <strong>Register Product</strong>
              <button type="button" className="armoury-crate-user-center-modal-close" onClick={closeRegisterModal} aria-label="Close product registration dialog">
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <form className="armoury-crate-user-center-form" onSubmit={handleRegisterProduct}>
              <label>
                <span>Product Name</span>
                <input
                  type="text"
                  value={productForm.productName}
                  onChange={(event) => setProductForm((previous) => ({ ...previous, productName: event.target.value }))}
                  placeholder="ROG Strix G16"
                />
              </label>

              <label>
                <span>Model</span>
                <input
                  type="text"
                  value={productForm.modelName}
                  onChange={(event) => setProductForm((previous) => ({ ...previous, modelName: event.target.value }))}
                  placeholder="G614JZ"
                />
              </label>

              <label>
                <span>Serial Number</span>
                <input
                  type="text"
                  value={productForm.serialNumber}
                  onChange={(event) => setProductForm((previous) => ({ ...previous, serialNumber: event.target.value }))}
                  placeholder="R9NRCX001234"
                />
              </label>

              <div className="armoury-crate-user-center-form-actions">
                <button type="button" className="armoury-crate-user-center-action-button secondary" onClick={closeRegisterModal}>
                  Cancel
                </button>
                <button type="submit" className="armoury-crate-user-center-action-button">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}

function UserCenterAvatarIcon() {
  return (
    <svg viewBox="0 0 120 120" role="img">
      <path
        d="M56 27 68 34l5 17-6 13 11 17H59l-7-5H39l10-10-4-15 5-16 6-5Zm14 27-11 2-6 10 8 6h8l4-10Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.3"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function UserCenterHeaderIcon() {
  return (
    <svg viewBox="0 0 112 74" role="img">
      <g fill="none" stroke="#f2f2f2" strokeWidth="2.2" strokeLinecap="square" strokeLinejoin="miter">
        <path d="M56 14 67 24 61 39H51L45 24Z" />
        <path d="M42 35h28" />
        <path d="M49 44h14" />
        <path d="M34 52H78" opacity="0.82" />
      </g>
    </svg>
  )
}
