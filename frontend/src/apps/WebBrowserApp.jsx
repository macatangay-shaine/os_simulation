import React, { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  Ellipsis,
  Grip,
  Maximize2,
  Mic,
  Minimize2,
  Minus,
  Plus,
  Puzzle,
  RotateCw,
  Search,
  Settings,
  Sparkles,
  Star,
  UserCircle2,
  X
} from "lucide-react";
import "../styles/apps/web-browser.css";

const EDGE_ICON_SRC = "/desktop-icons/webbrowser.png";

function createTab(id) {
  return {
    id,
    title: "New tab",
    url: null,
    input: "",
    searchResults: null,
    loading: false,
    reloadToken: 0
  };
}

function createHistoryEntry(tab) {
  return {
    title: tab.title,
    url: tab.url,
    input: tab.input,
    searchResults: tab.searchResults
  };
}

function getFullUrl(input) {
  if (/^https?:\/\//i.test(input)) return input;
  if (/^[\w\d-]+\.[\w\d-]+/.test(input)) return `https://${input}`;
  return null;
}

function getHostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch (error) {
    return url;
  }
}

export default function WebBrowserApp({ onDownload, windowControls }) {
  const [tabs, setTabs] = useState([createTab(1)]);
  const [activeTab, setActiveTab] = useState(1);
  const [history, setHistory] = useState({ 1: [createHistoryEntry(createTab(1))] });
  const [historyIndex, setHistoryIndex] = useState({ 1: 0 });

  const getTab = (id) => tabs.find((tab) => tab.id === id);
  const activeBrowserTab = getTab(activeTab) || tabs[0];

  const setTab = (id, data) => {
    setTabs((prev) => prev.map((tab) => (tab.id === id ? { ...tab, ...data } : tab)));
  };

  const pushHistoryEntry = (id, entry) => {
    const nextIndex = (historyIndex[id] ?? 0) + 1;
    setHistory((prev) => {
      const stack = prev[id] ? prev[id].slice(0, (historyIndex[id] ?? 0) + 1) : [];
      return { ...prev, [id]: [...stack, entry] };
    });
    setHistoryIndex((prev) => ({ ...prev, [id]: nextIndex }));
  };

  const restoreHistoryEntry = (id, entry) => {
    setTab(id, {
      title: entry.title || (entry.url ? entry.url : "New tab"),
      url: entry.url ?? null,
      input: entry.input ?? "",
      searchResults: entry.searchResults ?? null,
      loading: false
    });
  };

  const goTo = async (id, rawInput) => {
    const input = rawInput.trim();
    if (!input) {
      setTab(id, {
        title: "New tab",
        url: null,
        input: "",
        searchResults: null,
        loading: false
      });
      return;
    }

    const url = getFullUrl(input);
    if (url) {
      const nextTabState = {
        title: input,
        url,
        input,
        searchResults: null,
        loading: false
      };
      setTab(id, nextTabState);
      pushHistoryEntry(id, createHistoryEntry(nextTabState));
      return;
    }

    setTab(id, {
      title: input,
      url: null,
      input,
      searchResults: null,
      loading: true
    });

    let data;
    try {
      const response = await fetch(`http://localhost:8000/app/search/duckduckgo?q=${encodeURIComponent(input)}`);
      data = await response.json();
    } catch (error) {
      data = { error: "Search failed." };
    }

    const nextTabState = {
      title: input,
      url: null,
      input,
      searchResults: data,
      loading: false
    };

    setTab(id, nextTabState);
    pushHistoryEntry(id, createHistoryEntry(nextTabState));
  };

  const handleInputChange = (event) => {
    setTab(activeTab, { input: event.target.value });
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    const currentTab = getTab(activeTab);
    await goTo(activeTab, currentTab?.input || "");
  };

  const handleTabClick = (id) => {
    setActiveTab(id);
  };

  const handleNewTab = () => {
    const newId = Math.max(...tabs.map((tab) => tab.id)) + 1;
    const nextTab = createTab(newId);
    setTabs((prev) => [...prev, nextTab]);
    setActiveTab(newId);
    setHistory((prev) => ({ ...prev, [newId]: [createHistoryEntry(nextTab)] }));
    setHistoryIndex((prev) => ({ ...prev, [newId]: 0 }));
  };

  const handleCloseTab = (id) => {
    if (tabs.length === 1) return;
    const closedIndex = tabs.findIndex((tab) => tab.id === id);
    const nextTabs = tabs.filter((tab) => tab.id !== id);
    setTabs(nextTabs);
    setHistory((prev) => {
      const nextHistory = { ...prev };
      delete nextHistory[id];
      return nextHistory;
    });
    setHistoryIndex((prev) => {
      const nextIndexes = { ...prev };
      delete nextIndexes[id];
      return nextIndexes;
    });
    if (activeTab === id) {
      setActiveTab(nextTabs[Math.max(0, closedIndex - 1)].id);
    }
  };

  const handleBack = () => {
    if ((historyIndex[activeTab] ?? 0) <= 0) return;
    const nextIndex = historyIndex[activeTab] - 1;
    setHistoryIndex((prev) => ({ ...prev, [activeTab]: nextIndex }));
    restoreHistoryEntry(activeTab, history[activeTab][nextIndex]);
  };

  const handleForward = () => {
    if ((historyIndex[activeTab] ?? 0) >= (history[activeTab]?.length ?? 1) - 1) return;
    const nextIndex = historyIndex[activeTab] + 1;
    setHistoryIndex((prev) => ({ ...prev, [activeTab]: nextIndex }));
    restoreHistoryEntry(activeTab, history[activeTab][nextIndex]);
  };

  const handleReload = () => {
    const currentTab = getTab(activeTab);
    setTab(activeTab, {
      reloadToken: (currentTab?.reloadToken ?? 0) + 1
    });
  };

  const handleDownload = async () => {
    try {
      const url = getTab(activeTab)?.url;
      if (!url) throw new Error("Open a page first.");
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch page");
      const blob = await response.blob();
      const filename = url.split("/").pop() || "downloaded_page.html";
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result.split(",")[1];
        await fetch("http://localhost:8000/fs/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: `/home/user/Downloads/${filename}`,
            node_type: "file",
            content: base64data
          })
        });
        alert("Downloaded to Downloads folder!");
        if (onDownload) onDownload(filename);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      alert(`Download failed: ${error.message}`);
    }
  };

  const handleDocumentTitle = (id, title) => {
    if (!title) return;
    setTab(id, { title });
  };

  const renderSearchResults = (results) => {
    if (!results) return null;
    if (results.error) {
      return (
        <div className="browser-status-view">
          <div className="browser-status-card">
            <strong>Search unavailable</strong>
            <p>{results.error}</p>
          </div>
        </div>
      );
    }

    const getFavicon = (url) => `https://www.google.com/s2/favicons?domain=${encodeURIComponent(url)}&sz=64`;

    const ResultCard = ({ title, url, text }) => (
      <article className="browser-result-card">
        <div className="browser-result-site">
          <img className="browser-result-favicon" src={getFavicon(url)} alt="" />
          <span>{getHostname(url)}</span>
        </div>
        <button
          type="button"
          className="browser-result-title"
          onClick={() => {
            void goTo(activeTab, url);
          }}
        >
          {title || url}
        </button>
        {text ? <p className="browser-result-text">{text}</p> : null}
        <div className="browser-result-link">{url}</div>
      </article>
    );

    return (
      <div className="browser-results-view">
        <div className="browser-results-scroll">
          {results.Heading ? <h2 className="browser-results-heading">{results.Heading}</h2> : null}
          {results.AbstractText ? <p className="browser-results-abstract">{results.AbstractText}</p> : null}
          {results.Results?.map((result, index) => (
            <ResultCard key={`result-${index}`} title={result.Text} url={result.FirstURL} text={null} />
          ))}
          {results.RelatedTopics?.map((topic, index) =>
            topic.FirstURL ? (
              <ResultCard key={`topic-${index}`} title={topic.Text} url={topic.FirstURL} text={null} />
            ) : topic.Topics ? (
              topic.Topics.map((subTopic, subIndex) => (
                <ResultCard
                  key={`topic-${index}-${subIndex}`}
                  title={subTopic.Text}
                  url={subTopic.FirstURL}
                  text={null}
                />
              ))
            ) : null
          )}
          {!results.Heading && !results.AbstractText && !results.RelatedTopics?.length && !results.Results?.length ? (
            <div className="browser-status-card">
              <strong>No results found</strong>
              <p>Try a different search term or type a full website address.</p>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="web-browser-app">
      <div className="browser-tabs-bar" data-window-drag-handle="true">
        <div className="browser-tabs-scroll">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`browser-tab${tab.id === activeTab ? " active" : ""}`}
              data-no-window-drag="true"
              onClick={() => handleTabClick(tab.id)}
            >
              <img className="browser-tab-icon" src={EDGE_ICON_SRC} alt="" />
              <span className="browser-tab-title">{tab.title || "New tab"}</span>
              <span
                className="browser-tab-close"
                onClick={(event) => {
                  event.stopPropagation();
                  handleCloseTab(tab.id);
                }}
              >
                <X size={14} />
              </span>
            </button>
          ))}
        </div>
        <button type="button" className="browser-tab-add" data-no-window-drag="true" onClick={handleNewTab} aria-label="New tab">
          <Plus size={18} />
        </button>
        {windowControls ? (
          <div className="browser-window-controls" data-no-window-drag="true">
            <button type="button" className="browser-window-control" onClick={windowControls.onMinimize} aria-label="Minimize">
              <Minus size={14} />
            </button>
            {windowControls.canMaximize ? (
              <button type="button" className="browser-window-control" onClick={windowControls.onMaximize} aria-label={windowControls.isMaximized ? "Restore" : "Maximize"}>
                {windowControls.isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
            ) : null}
            <button type="button" className="browser-window-control close" onClick={windowControls.onClose} aria-label="Close">
              <X size={14} />
            </button>
          </div>
        ) : null}
      </div>

      <div className="browser-toolbar">
        <div className="browser-toolbar-nav">
          <button
            type="button"
            className="browser-nav-btn"
            onClick={handleBack}
            title="Back"
            disabled={(historyIndex[activeTab] ?? 0) === 0}
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            type="button"
            className="browser-nav-btn"
            onClick={handleForward}
            title="Forward"
            disabled={(historyIndex[activeTab] ?? 0) >= (history[activeTab]?.length ?? 1) - 1}
            aria-label="Forward"
          >
            <ArrowRight size={18} />
          </button>
          <button type="button" className="browser-nav-btn" onClick={handleReload} title="Reload" aria-label="Reload">
            <RotateCw size={17} />
          </button>
        </div>

        <form className="browser-search-form" onSubmit={handleSearch}>
          <div className="browser-search-shell">
            <Search size={18} className="browser-search-leading" />
            <input
              className="browser-search-input"
              type="text"
              value={activeBrowserTab?.input || activeBrowserTab?.url || ""}
              onChange={handleInputChange}
              placeholder="Search the web or type a URL"
            />
          </div>
        </form>

        <div className="browser-toolbar-actions">
          <button type="button" className="browser-action-btn" title="Favorites" aria-label="Favorites">
            <Star size={18} />
          </button>
          <button type="button" className="browser-action-btn" title="Extensions" aria-label="Extensions">
            <Puzzle size={18} />
          </button>
          <button type="button" className="browser-action-btn" title="Discover" aria-label="Discover">
            <Sparkles size={18} />
          </button>
          <button
            type="button"
            className="browser-action-btn"
            title="Download current page"
            aria-label="Download current page"
            onClick={handleDownload}
            disabled={!activeBrowserTab?.url}
          >
            <Download size={18} />
          </button>
          <button type="button" className="browser-action-btn" title="Profile" aria-label="Profile">
            <UserCircle2 size={22} />
          </button>
          <button type="button" className="browser-action-btn" title="More options" aria-label="More options">
            <Ellipsis size={18} />
          </button>
          <button type="button" className="browser-chat-pill" title="Chat" aria-label="Chat">
            <img src={EDGE_ICON_SRC} alt="" />
            <span>Chat</span>
          </button>
        </div>
      </div>

      <div className="browser-content-area">
        {activeBrowserTab?.loading ? (
          <div className="browser-status-view">
            <div className="browser-status-card">
              <strong>Loading...</strong>
              <p>We're pulling your page into the browser now.</p>
            </div>
          </div>
        ) : activeBrowserTab?.url ? (
          <IframeWithErrorHandler
            key={`${activeBrowserTab.url}-${activeBrowserTab.reloadToken}`}
            tabId={activeTab}
            url={activeBrowserTab.url}
            onTitleChange={handleDocumentTitle}
          />
        ) : activeBrowserTab?.searchResults ? (
          renderSearchResults(activeBrowserTab.searchResults)
        ) : (
          <BrowserHomePage
            inputValue={activeBrowserTab?.input || ""}
            onInputChange={handleInputChange}
            onSearch={handleSearch}
          />
        )}
      </div>
    </div>
  );
}

function BrowserHomePage({ inputValue, onInputChange, onSearch }) {
  return (
    <div className="browser-home-page">
      <div className="browser-home-surface">
        <div className="browser-home-topbar">
          <button type="button" className="browser-home-icon-btn" aria-label="Apps">
            <Grip size={24} />
          </button>
          <div className="browser-home-weather">
            <span className="browser-home-weather-location">San Pablo</span>
            <span className="browser-home-weather-sun" aria-hidden="true" />
            <span className="browser-home-weather-temp">34 C</span>
            <button type="button" className="browser-home-icon-btn" aria-label="Page settings">
              <Settings size={22} />
            </button>
          </div>
        </div>

        <div className="browser-home-main">
          <form className="browser-home-search" onSubmit={onSearch}>
            <Search size={24} className="browser-home-search-icon" />
            <input
              type="text"
              value={inputValue}
              onChange={onInputChange}
              placeholder="Search the web"
              className="browser-home-search-input"
            />
            <button type="button" className="browser-home-search-action" aria-label="Voice input">
              <Mic size={25} />
            </button>
            <button type="submit" className="browser-home-search-brand" aria-label="Search with browser">
              <img src={EDGE_ICON_SRC} alt="" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function IframeWithErrorHandler({ tabId, url, onTitleChange }) {
  const [blocked, setBlocked] = React.useState(false);
  const iframeRef = React.useRef(null);

  const handleLoad = () => {
    try {
      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentWindow || !iframe.contentDocument) return;
      const title = iframe.contentDocument.title;
      if (title && onTitleChange) onTitleChange(tabId, title);
      if (
        iframe.contentDocument.body.innerHTML.trim() === "" ||
        iframe.contentWindow.location.href === "about:blank"
      ) {
        setBlocked(true);
      }
    } catch (error) {
      setBlocked(true);
    }
  };

  if (blocked) {
    const isDuckDuckGo = url.includes("duckduckgo.com");
    return (
      <div className="browser-status-view">
        <div className="browser-status-card browser-status-card-error">
          <strong>{isDuckDuckGo ? "Search engine blocked inside the frame" : "This site can't be shown here"}</strong>
          <p>
            {isDuckDuckGo
              ? "DuckDuckGo and similar services block embedded loading for security reasons. Use the browser search box above to browse results in-app."
              : "This page blocks embedding inside an iframe. Open it in a separate browser window if you need the full site."}
          </p>
          <a href={url} target="_blank" rel="noopener noreferrer" className="browser-external-link">
            Open externally
          </a>
        </div>
      </div>
    );
  }

  return (
    <iframe
      ref={iframeRef}
      src={url}
      title="Web Browser"
      className="browser-iframe"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      onLoad={handleLoad}
    />
  );
}
