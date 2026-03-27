

import React, { useRef, useState } from "react";
import '../styles/apps/web-browser.css';

const DEFAULT_URL = "duckduckgo.com";

function isLikelyUrl(input) {
  return /^https?:\/\//i.test(input) || /^[\w\d\-]+\.[\w\d\-]+/.test(input);
}

function getFullUrl(input) {
  if (/^https?:\/\//i.test(input)) return input;
  if (/^[\w\d\-]+\.[\w\d\-]+/.test(input)) return `https://${input}`;
  return null;
}


export default function WebBrowserApp({ onDownload }) {
  const iframeRef = useRef(null);
  const [tabs, setTabs] = useState([
    { id: 1, title: "New Tab", url: null, input: "", searchResults: null, loading: false }
  ]);
  const [activeTab, setActiveTab] = useState(1);

  // Navigation state
  const [history, setHistory] = useState({ 1: [null] });
  const [historyIndex, setHistoryIndex] = useState({ 1: 0 });

  // Tab helpers
  const getTab = (id) => tabs.find((t) => t.id === id);
  const setTab = (id, data) => setTabs((prev) => prev.map((t) => t.id === id ? { ...t, ...data } : t));

  // Navigation
  const goTo = async (id, input) => {
    // If input is a likely URL, try to load in iframe
    const url = getFullUrl(input);
    if (url) {
      setTab(id, { url, input, searchResults: null, loading: false });
      setHistory((prev) => {
        const h = prev[id] ? prev[id].slice(0, historyIndex[id] + 1) : [];
        return { ...prev, [id]: [...h, input] };
      });
      setHistoryIndex((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
      return;
    }
    // Otherwise, treat as search query
    setTab(id, { url: null, input, searchResults: null, loading: true });
    try {
      const resp = await fetch(`http://localhost:8000/app/search/duckduckgo?q=${encodeURIComponent(input)}`);
      const data = await resp.json();
      setTab(id, { url: null, input, searchResults: data, loading: false });
    } catch (e) {
      setTab(id, { url: null, input, searchResults: { error: "Search failed." }, loading: false });
    }
    setHistory((prev) => {
      const h = prev[id] ? prev[id].slice(0, historyIndex[id] + 1) : [];
      return { ...prev, [id]: [...h, input] };
    });
    setHistoryIndex((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };


  const handleInputChange = (e) => {
    setTab(activeTab, { input: e.target.value });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const tab = getTab(activeTab);
    await goTo(activeTab, tab.input);
  };

  const handleTabClick = (id) => setActiveTab(id);
  const handleNewTab = () => {
    const newId = Math.max(...tabs.map((t) => t.id)) + 1;
    setTabs([...tabs, { id: newId, title: "New Tab", url: null, input: "", searchResults: null, loading: false }]);
    setActiveTab(newId);
    setHistory((prev) => ({ ...prev, [newId]: [null] }));
    setHistoryIndex((prev) => ({ ...prev, [newId]: 0 }));
  };
  const handleCloseTab = (id) => {
    if (tabs.length === 1) return;
    const idx = tabs.findIndex((t) => t.id === id);
    const newTabs = tabs.filter((t) => t.id !== id);
    setTabs(newTabs);
    if (activeTab === id) {
      setActiveTab(newTabs[Math.max(0, idx - 1)].id);
    }
  };

  // Navigation controls
  const handleBack = () => {
    if (historyIndex[activeTab] > 0) {
      setHistoryIndex((prev) => ({ ...prev, [activeTab]: prev[activeTab] - 1 }));
      const url = history[activeTab][historyIndex[activeTab] - 1];
      setTab(activeTab, { url, input: url });
    }
  };
  const handleForward = () => {
    if (historyIndex[activeTab] < history[activeTab].length - 1) {
      setHistoryIndex((prev) => ({ ...prev, [activeTab]: prev[activeTab] + 1 }));
      const url = history[activeTab][historyIndex[activeTab] + 1];
      setTab(activeTab, { url, input: url });
    }
  };
  const handleReload = () => {
    setTab(activeTab, { url: getTab(activeTab).url });
  };

  // Download current page
  const handleDownload = async () => {
    try {
      const url = getTab(activeTab).url;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch page');
      const blob = await response.blob();
      const filename = url.split('/').pop() || 'downloaded_page.html';
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result.split(',')[1];
        await fetch('http://localhost:8000/fs/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: `/home/user/Downloads/${filename}`,
            node_type: 'file',
            content: base64data
          })
        });
        alert('Downloaded to Downloads folder!');
        if (onDownload) onDownload(filename);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      alert('Download failed: ' + err.message);
    }
  };


  // Responsive, non-overlapping UI and dynamic tab title
  const tab = getTab(activeTab);

  // Update tab title on iframe load
  const handleIframeLoad = () => {
    try {
      const iframe = iframeRef.current;
      if (iframe && iframe.contentDocument) {
        const title = iframe.contentDocument.title;
        if (title && title !== tab.title) {
          setTab(activeTab, { title });
        }
      }
    } catch (e) {
      // Cross-origin, fallback to URL
      setTab(activeTab, { title: tab.url });
    }
  };

  // Render search results from DuckDuckGo API
  function renderSearchResults(results) {
    if (!results) return null;
    if (results.error) return <div style={{ padding: 24, color: 'red' }}>{results.error}</div>;
    // Helper to get favicon
    const getFavicon = url => `https://www.google.com/s2/favicons?domain=${encodeURIComponent(url)}`;
    // Helper to render a result card
    const ResultCard = ({ title, url, text }) => (
      <div style={{
        border: '1px solid var(--win-border)',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        background: 'var(--win-surface)',
        boxShadow: '0 1px 4px #0001',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        color: 'var(--win-text)'
      }}>
        <img src={getFavicon(url)} alt="" style={{ width: 20, height: 20, marginTop: 2 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 500, fontSize: 16, marginBottom: 2, color: 'var(--win-text)' }}>{title || url}</div>
          {text && <div style={{ color: 'var(--win-muted)', marginBottom: 4 }}>{text}</div>}
          <a
            href={url}
            style={{ color: 'var(--win-accent)', fontSize: 14 }}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => {
              // Allow Ctrl/Cmd+Click or middle-click to open in new tab
              if (e.ctrlKey || e.metaKey || e.button === 1) return;
              e.preventDefault();
              goTo(activeTab, url);
            }}
          >
            {url}
          </a>
        </div>
      </div>
    );
    return (
      <div style={{ padding: 24, overflowY: 'auto', width: '100%', background: 'var(--win-surface-strong)', color: 'var(--win-text)' }}>
        {results.Heading && <h2 style={{ marginTop: 0, color: 'var(--win-text)' }}>{results.Heading}</h2>}
        {results.AbstractText && <div style={{ marginBottom: 20, fontSize: 17, color: 'var(--win-muted)' }}>{results.AbstractText}</div>}
        {/* Main Results */}
        {results.Results && results.Results.length > 0 && results.Results.map((res, i) => (
          <ResultCard key={i} title={res.Text} url={res.FirstURL} text={null} />
        ))}
        {/* Related Topics */}
        {results.RelatedTopics && results.RelatedTopics.length > 0 && results.RelatedTopics.map((topic, i) => (
          topic.FirstURL ? (
            <ResultCard key={i} title={topic.Text} url={topic.FirstURL} text={null} />
          ) : topic.Topics ? (
            topic.Topics.map((sub, j) => (
              <ResultCard key={i + '-' + j} title={sub.Text} url={sub.FirstURL} text={null} />
            ))
          ) : null
        ))}
        {/* No results */}
        {!results.Heading && !results.AbstractText && !results.RelatedTopics?.length && !results.Results?.length && (
          <div>No results found.</div>
        )}
      </div>
    );
  }

  return (
    <div className="web-browser-app">
      {/* Tabs Bar */}
      <div className="browser-tabs-bar">
        {tabs.map((t) => (
          <div key={t.id} className={"browser-tab" + (t.id === activeTab ? " active" : "")}
            onClick={() => handleTabClick(t.id)}>
            <span className="browser-tab-title">{t.title || "New Tab"}</span>
            {tabs.length > 1 && <span className="browser-tab-close" onClick={e => { e.stopPropagation(); handleCloseTab(t.id); }}>×</span>}
          </div>
        ))}
        <button className="browser-tab-add" onClick={handleNewTab}>+</button>
      </div>
      {/* Toolbar */}
      <div className="browser-toolbar">
        <button className="browser-nav-btn" onClick={handleBack} title="Back" disabled={historyIndex[activeTab] === 0}>{"<"}</button>
        <button className="browser-nav-btn" onClick={handleForward} title="Forward" disabled={historyIndex[activeTab] >= (history[activeTab]?.length - 1)}>{">"}</button>
        <button className="browser-nav-btn" onClick={handleReload} title="Reload">⟳</button>
        <form className="browser-search-form" onSubmit={handleSearch}>
          <input
            className="browser-search-input"
            type="text"
            value={tab.input || (tab.url || "")}
            onChange={handleInputChange}
            placeholder="Search or type a URL"
          />
        </form>
        <button className="browser-download-btn" onClick={handleDownload}>Download</button>
      </div>
      {/* Webview or Search Results */}
      <div className="browser-content-area">
        {tab.loading ? (
          <div className="browser-loading">Loading...</div>
        ) : tab.url ? (
          <IframeWithErrorHandler
            url={tab.url}
            onLoad={handleIframeLoad}
          />
        ) : tab.searchResults ? (
          renderSearchResults(tab.searchResults)
        ) : (
          <div className="browser-placeholder">Enter a search or URL above.</div>
        )}
      </div>
    </div>
  );
}

// Helper component to handle iframe embedding errors
function IframeWithErrorHandler({ url, onLoad }) {
  const [blocked, setBlocked] = React.useState(false);
  const iframeRef = React.useRef(null);

  // Try to detect embedding errors after load
  const handleLoad = () => {
    if (onLoad) onLoad();
    // Try to access contentWindow; if blocked, show error
    try {
      const iframe = iframeRef.current;
      // Some sites will throw on access or have blank content
      if (!iframe || !iframe.contentWindow || !iframe.contentDocument) return;
      // If the document is empty or about:blank, likely blocked
      if (
        iframe.contentDocument.body.innerHTML.trim() === '' ||
        iframe.contentWindow.location.href === 'about:blank'
      ) {
        setBlocked(true);
      }
    } catch (e) {
      setBlocked(true);
    }
  };

  if (blocked) {
    // Special message for DuckDuckGo and similar search engines
    const isDuckDuckGo = url.includes('duckduckgo.com');
    return (
      <div style={{ padding: 32, textAlign: 'center', width: '100%' }}>
        <div style={{ color: 'red', marginBottom: 16 }}>
          {isDuckDuckGo ? (
            <>
              DuckDuckGo and most search engines cannot be displayed in the browser window.<br />
              (They block embedding for security reasons.)<br />
              Use the search box above to get results here instead.
            </>
          ) : (
            <>
              This site cannot be displayed in the browser window.<br />
              (It blocks embedding for security reasons.)
            </>
          )}
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2', fontWeight: 500 }}>
          Open Externally
        </a>
      </div>
    );
  }
  return (
    <iframe
      ref={iframeRef}
      src={url}
      title="Web Browser"
      style={{ flex: 1, border: 'none', background: '#fff', minHeight: 0, minWidth: 0 }}
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      onLoad={handleLoad}
    />
  );
}
