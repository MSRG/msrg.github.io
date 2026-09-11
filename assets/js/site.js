document.addEventListener("DOMContentLoaded", () => {
  const navButton = document.querySelector("[data-nav-toggle]");
  const navPanel = document.querySelector("[data-nav-panel]");

  if (navButton && navPanel) {
    // Match the phone navigation breakpoint in assets/css/main.css.
    const mobileNav = window.matchMedia("(max-width: 760px)");
    const setNavOpen = (open) => {
      navButton.setAttribute("aria-expanded", String(open));
      navPanel.classList.toggle("is-open", open);
    };
    navButton.addEventListener("click", () => {
      const expanded = navButton.getAttribute("aria-expanded") === "true";
      setNavOpen(!expanded);
    });
    navPanel.addEventListener("click", (event) => {
      if (event.target.closest("a")) setNavOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && navButton.getAttribute("aria-expanded") === "true") {
        setNavOpen(false);
        navButton.focus();
      }
    });
    document.addEventListener("click", (event) => {
      if (!navPanel.contains(event.target) && !navButton.contains(event.target)) setNavOpen(false);
    });
    mobileNav.addEventListener("change", () => setNavOpen(false));
  }

  const cookieNotice = document.querySelector("[data-cookie-notice]");

  if (cookieNotice) {
    const acceptButton = cookieNotice.querySelector("[data-cookie-accept]");
    const cookieKey = "msrg_cookie_notice_accepted";
    let accepted = false;

    try {
      accepted = window.localStorage.getItem(cookieKey) === "true";
    } catch (error) {
      try {
        accepted = document.cookie.includes(`${cookieKey}=true`);
      } catch (error) {
        accepted = false;
      }
    }

    if (!accepted) {
      cookieNotice.hidden = false;
    }

    acceptButton?.addEventListener("click", () => {
      cookieNotice.hidden = true;

      try {
        window.localStorage.setItem(cookieKey, "true");
      } catch (error) {
        try {
          document.cookie = `${cookieKey}=true; max-age=31536000; path=/; SameSite=Lax`;
        } catch (error) {
          // The notice can still be dismissed for this page when storage is disabled.
        }
      }
    });
  }

  const searchInput = document.querySelector("[data-publication-search]");
  if (searchInput) {
    const archive = document.querySelector("[data-publication-archive]");
    const results = document.querySelector("[data-publication-results]");
    const paginations = [...document.querySelectorAll("[data-publication-pagination]")];
    const errorState = document.querySelector("[data-publication-error]");
    const emptyState = document.querySelector("[data-publication-empty]");
    const controls = document.querySelector("[data-publication-controls]");
    const researchSelect = document.querySelector("[data-publication-research]");
    const resultCount = document.querySelector("[data-publication-count]");
    const clearButton = document.querySelector("[data-publication-clear]");
    const filterButtons = [...document.querySelectorAll("[data-publication-tag]")];
    const normalize = (text) => text.normalize("NFD").replace(/\p{M}/gu, "").replace(/[‘’]/g, "'").toLowerCase();
    const pageSize = 100;
    let records;
    let indexRequest;
    let activeTag = "all";
    let currentPage = Number(archive.dataset.publicationPage);
    let revision = 0;
    let searchTimer;

    // The initial page is server-rendered. Fetch the searchable metadata once,
    // only when filters (including a shared search URL) are used.
    const loadIndex = async () => {
      if (!indexRequest) {
        indexRequest = fetch(archive.dataset.publicationIndex)
          .then((response) => {
            if (!response.ok) throw new Error("Publication index unavailable");
            return response.json();
          })
          .then((data) => {
            records = data.map((record) => ({ ...record, search: normalize(record.search) }));
            return records;
          })
          .catch((error) => { indexRequest = null; throw error; });
      }
      return indexRequest;
    };
    const element = (tag, text, className) => {
      const node = document.createElement(tag);
      if (text !== undefined) node.textContent = text;
      if (className) node.className = className;
      return node;
    };
    const cardFor = (record) => {
      const card = element("article", undefined, "list-card publication-card");
      card.dataset.publicationCard = "";
      const title = element("h2");
      const link = element("a", record.title);
      link.href = record.url;
      title.append(link);
      card.append(element("p", record.authors.join(" / "), "muted"), title,
        element("p", `${record.venue}, ${record.year} · ${record.type}`));
      if (record.tags.length) {
        const tags = element("div", undefined, "chip-row");
        record.tags.forEach((tag) => tags.append(element("span", tag, "chip chip-muted")));
        card.append(tags);
      }
      return card;
    };
    const filterURL = (page = currentPage) => {
      const url = new URL(archive.dataset.publicationBase, location.href);
      for (const [key, value] of [["q", searchInput.value.trim()], ["tag", activeTag], ["research", researchSelect?.value]]) {
        if (value && value !== "all") url.searchParams.set(key, value);
      }
      if (page > 1) url.searchParams.set("page", page);
      return url;
    };
    const renderPagination = (pageCount) => {
      paginations.forEach((nav) => {
        nav.replaceChildren();
        const addLink = (label, page, relation) => {
          const link = element("a", label, "button button-secondary");
          link.href = filterURL(page);
          link.rel = relation;
          link.addEventListener("click", (event) => {
            if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
            event.preventDefault();
            clearTimeout(searchTimer);
            currentPage = page;
            history.pushState(null, "", filterURL());
            applyFilter(false).then(() => {
              results.focus({ preventScroll: true });
              results.scrollIntoView({ block: "start" });
            });
          });
          nav.append(link);
        };
        if (currentPage > 1) addLink("Previous", currentPage - 1, "prev");
        nav.append(element("span", `Page ${currentPage} of ${pageCount}`));
        if (currentPage < pageCount) addLink("Next", currentPage + 1, "next");
      });
    };
    const applyFilter = async (updateURL = true) => {
      const requestRevision = ++revision;
      if (!records) resultCount.textContent = "Loading publication search…";
      try { await loadIndex(); } catch {
        if (requestRevision === revision) {
          errorState.hidden = false;
          resultCount.textContent = "Browse publications using the page links below.";
        }
        return;
      }
      if (requestRevision !== revision) return;
      errorState.hidden = true;
      const terms = normalize(searchInput.value.trim()).split(/\s+/).filter(Boolean);
      const research = researchSelect?.value || "all";
      const matches = records.filter((record) => terms.every((term) => record.search.includes(term)) &&
        (activeTag === "all" || record.tags.includes(activeTag)) &&
        (research === "all" || record.research.includes(research)));
      const pageCount = Math.max(1, Math.ceil(matches.length / pageSize));
      currentPage = Math.min(Math.max(1, currentPage), pageCount);
      const start = (currentPage - 1) * pageSize;
      results.replaceChildren(...matches.slice(start, start + pageSize).map(cardFor));
      filterButtons.forEach((button) => {
        const selected = button.dataset.publicationTag === activeTag;
        button.classList.toggle("is-active", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
      emptyState.hidden = matches.length !== 0;
      resultCount.textContent = matches.length ?
        `Showing ${start + 1}–${Math.min(start + pageSize, matches.length)} of ${matches.length} publications` :
        "0 publications";
      renderPagination(pageCount);
      clearButton.disabled = !searchInput.value && activeTag === "all" && research === "all";
      if (updateURL) history.replaceState(null, "", filterURL());
    };
    const restoreFilter = () => {
      clearTimeout(searchTimer);
      ++revision;
      const url = new URL(location.href);
      const params = url.searchParams;
      searchInput.value = params.get("q") || params.get("author") || "";
      const tag = params.get("tag");
      activeTag = filterButtons.some((button) => button.dataset.publicationTag === tag) ? tag : "all";
      const area = params.get("research");
      researchSelect.value = [...researchSelect.options].some((option) => option.value === area) ? area : "all";
      const page = params.get("page") || url.pathname.match(/\/page\/(\d+)\//)?.[1] || "1";
      currentPage = /^[1-9]\d*$/.test(page) && Number.isSafeInteger(Number(page)) ? Number(page) : 1;
      const filtered = searchInput.value || activeTag !== "all" || researchSelect.value !== "all";
      if (records || filtered || params.has("page")) applyFilter(false);
      clearButton.disabled = !filtered;
    };
    const changeFilter = () => {
      clearTimeout(searchTimer);
      currentPage = 1;
      applyFilter();
    };
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimer);
      ++revision;
      currentPage = 1;
      searchTimer = setTimeout(() => applyFilter(), 150);
    });
    researchSelect.addEventListener("change", changeFilter);
    filterButtons.forEach((button) => button.addEventListener("click", () => {
      activeTag = button.dataset.publicationTag || "all";
      changeFilter();
    }));
    clearButton.addEventListener("click", () => {
      searchInput.value = "";
      activeTag = "all";
      researchSelect.value = "all";
      changeFilter();
      searchInput.focus();
    });
    document.querySelector("[data-publication-retry]").addEventListener("click", () => applyFilter());
    window.addEventListener("popstate", restoreFilter);
    restoreFilter();
    controls.hidden = false;
  }

  const msrgGame = document.querySelector("[data-msrg-game]");

  if (msrgGame) {
    const target = "MSRG";
    const shell = msrgGame.querySelector("[data-msrg-shell]");
    const live = msrgGame.querySelector("[data-msrg-live]");
    const status = msrgGame.querySelector("[data-msrg-status]");
    const stats = msrgGame.querySelector("[data-msrg-stats]");
    const latest = msrgGame.querySelector("[data-msrg-latest]");
    const best = msrgGame.querySelector("[data-msrg-best]");
    const rounds = msrgGame.querySelector("[data-msrg-rounds]");
    const touchInput = msrgGame.querySelector("[data-msrg-input]");

    if (shell && live && status && stats && latest && best && rounds) {
      let typed = "";
      let roundStart = 0;
      let roundCount = 0;
      let bestWpm = 0;
      let titleState = "prompt";
      let hideTimer;
      let scoreLocked = false;

      const isEditableTarget = (element) => {
        if (!(element instanceof HTMLElement)) {
          return false;
        }

        return (
          element.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName)
        );
      };

      const syncShell = () => {
        shell.classList.toggle("is-active", titleState === "active");
        shell.classList.toggle("is-hidden", titleState === "hidden");
        live.textContent = typed;
        if (touchInput) touchInput.value = typed;
        status.hidden = titleState !== "active";
        stats.hidden = roundCount === 0;
      };

      const setStatus = (message) => {
        status.textContent = message;
      };

      const clearHideTimer = () => {
        window.clearTimeout(hideTimer);
      };

      const restorePrompt = () => {
        if (titleState === "prompt" || document.activeElement === touchInput) {
          return;
        }

        clearHideTimer();
        typed = "";
        roundStart = 0;
        scoreLocked = false;
        titleState = "prompt";
        syncShell();
      };

      const activateTyping = (nextTyped = "") => {
        clearHideTimer();
        titleState = "active";
        typed = nextTyped;
        syncShell();
      };

      const hideTitleSoon = () => {
        clearHideTimer();
        hideTimer = window.setTimeout(() => {
          typed = "";
          roundStart = 0;
          scoreLocked = false;
          titleState = "hidden";
          syncShell();
        }, 600);
      };

      const handleBackspace = () => {
        clearHideTimer();

        if (titleState === "hidden" || titleState === "prompt") {
          scoreLocked = true;
          activateTyping(target.slice(0, -1));
          roundStart = 0;
          setStatus(`${typed.length} / ${target.length} letters`);
          return;
        }

        if (!typed) {
          setStatus("Type M, then S, then R, then G.");
          return;
        }

        const wasComplete = typed === target;
        typed = typed.slice(0, -1);
        if (!typed) {
          roundStart = 0;
          scoreLocked = false;
          syncShell();
          setStatus("Type MSRG again.");
          return;
        }

        if (wasComplete || scoreLocked) {
          scoreLocked = true;
        }

        roundStart = wasComplete ? performance.now() : 0;
        syncShell();
        setStatus(`${typed.length} / ${target.length} letters`);
      };

      const finishRound = () => {
        if (scoreLocked) {
          setStatus("Backspace edits do not change the score.");
          roundStart = 0;
          hideTitleSoon();
          return;
        }

        const elapsedSeconds = Math.max(
          (performance.now() - roundStart) / 1000,
          0.001,
        );
        const wordsTyped = target.length / 5;
        const currentWpm = Math.round((wordsTyped * 60) / elapsedSeconds);

        roundCount += 1;
        bestWpm = Math.max(bestWpm, currentWpm);

        latest.textContent = `${currentWpm} WPM`;
        best.textContent = `${bestWpm} WPM`;
        rounds.textContent = String(roundCount);

        scoreLocked = true;
        syncShell();
        setStatus(`Round ${roundCount}: ${currentWpm} WPM`);
        roundStart = 0;
        hideTitleSoon();
      };

      touchInput?.addEventListener("input", () => {
        const nextTyped = touchInput.value.toUpperCase();
        if (!target.startsWith(nextTyped) || scoreLocked) {
          touchInput.value = typed;
          return;
        }
        if (!typed && nextTyped) roundStart = performance.now();
        if (!nextTyped) roundStart = 0;
        activateTyping(nextTyped);
        setStatus(`${typed.length} / ${target.length} letters`);
        if (typed === target) finishRound();
      });

      document.addEventListener("pointermove", restorePrompt, { passive: true });
      window.addEventListener("scroll", restorePrompt, { passive: true });

      document.addEventListener("keydown", (event) => {
        if (
          event.defaultPrevented ||
          event.metaKey ||
          event.ctrlKey ||
          event.altKey ||
          isEditableTarget(event.target)
        ) {
          return;
        }

        if (event.key === "Backspace") {
          event.preventDefault();
          handleBackspace();
          return;
        }

        if (!/^[a-zA-Z]$/.test(event.key)) {
          return;
        }

        const letter = event.key.toUpperCase();

        if (titleState === "hidden") {
          if (!target.startsWith(letter)) {
            setStatus("Sequence is M, then S, then R, then G.");
            status.hidden = false;
            return;
          }

          scoreLocked = false;
          activateTyping(letter);
          event.preventDefault();
          roundStart = performance.now();
          setStatus(`${typed.length} / ${target.length} letters`);
          return;
        }

        if (titleState === "active" && typed === target) {
          event.preventDefault();
          return;
        }

        if (titleState === "active") {
          clearHideTimer();
        }

        if (titleState === "prompt") {
          if (!target.startsWith(letter)) {
            setStatus("Sequence is M, then S, then R, then G.");
            status.hidden = false;
            return;
          }

          scoreLocked = false;
          activateTyping(letter);
        } else {
          const nextTyped = typed + letter;

          if (!target.startsWith(nextTyped)) {
            setStatus("Sequence is M, then S, then R, then G.");
            return;
          }

          typed = nextTyped;
          syncShell();
        }

        event.preventDefault();

        if (!roundStart) {
          roundStart = performance.now();
        }

        if (typed !== target) {
          setStatus(`${typed.length} / ${target.length} letters`);
          return;
        }

        finishRound();
      });

      syncShell();
    }
  }
});
