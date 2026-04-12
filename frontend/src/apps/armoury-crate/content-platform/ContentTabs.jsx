export default function ContentTabs({ tabs, activeTab, onSelect }) {
  return (
    <div className="armoury-crate-content-tabs" role="tablist" aria-label="Content Platform tabs">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`armoury-crate-content-tab ${isActive ? 'active' : ''}`}
            onClick={() => onSelect(tab.id)}
          >
            <span>{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
