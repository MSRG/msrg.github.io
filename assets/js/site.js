document.addEventListener("DOMContentLoaded", () => {
  const navButton = document.querySelector("[data-nav-toggle]");
  const navPanel = document.querySelector("[data-nav-panel]");

  if (navButton && navPanel) {
    const mobileNav = window.matchMedia("(max-width: 980px)");
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
  const cards = Array.from(document.querySelectorAll("[data-publication-card]"));
  const emptyState = document.querySelector("[data-publication-empty]");
  const filterButtons = Array.from(
    document.querySelectorAll("[data-publication-tag]"),
  );

  if (searchInput) {
    const controls = document.querySelector("[data-publication-controls]");
    const researchSelect = document.querySelector("[data-publication-research]");
    const resultCount = document.querySelector("[data-publication-count]");
    const clearButton = document.querySelector("[data-publication-clear]");
    const normalize = (text) => text.normalize("NFD").replace(/\p{M}/gu, "").replace(/[‘’]/g, "'").toLowerCase();
    const searchIndex = cards.map((card) => normalize(card.dataset.search || ""));
    let activeTag = "all";

    const applyFilter = (updateURL = true) => {
      const terms = normalize(searchInput.value.trim()).split(/\s+/).filter(Boolean);
      const research = researchSelect?.value || "all";
      let visible = 0;
      cards.forEach((card, index) => {
        const tags = (card.dataset.tags || "").split("|");
        const areas = (card.dataset.research || "").split("|");
        const match = terms.every((term) => searchIndex[index].includes(term)) &&
          (activeTag === "all" || tags.includes(activeTag)) &&
          (research === "all" || areas.includes(research));
        card.hidden = !match;
        if (match) visible += 1;
      });
      filterButtons.forEach((button) => {
        const selected = button.dataset.publicationTag === activeTag;
        button.classList.toggle("is-active", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
      if (emptyState) emptyState.hidden = visible !== 0;
      if (resultCount) resultCount.textContent = `${visible} of ${cards.length} publications`;
      if (clearButton) clearButton.disabled = !searchInput.value && activeTag === "all" && research === "all";
      if (updateURL) {
        const url = new URL(location.href);
        url.searchParams.delete("author");
        for (const [key, value] of [["q", searchInput.value.trim()], ["tag", activeTag], ["research", research]]) {
          if (value && value !== "all") url.searchParams.set(key, value);
          else url.searchParams.delete(key);
        }
        history.replaceState(null, "", url);
      }
    };
    const restoreFilter = () => {
      const params = new URL(location.href).searchParams;
      searchInput.value = params.get("q") || params.get("author") || "";
      const tag = params.get("tag");
      activeTag = filterButtons.some((button) => button.dataset.publicationTag === tag) ? tag : "all";
      if (researchSelect) {
        const area = params.get("research");
        researchSelect.value = [...researchSelect.options].some((option) => option.value === area) ? area : "all";
      }
      applyFilter(false);
    };
    searchInput.addEventListener("input", () => applyFilter());
    researchSelect?.addEventListener("change", () => applyFilter());
    filterButtons.forEach((button) => button.addEventListener("click", () => {
      activeTag = button.dataset.publicationTag || "all";
      applyFilter();
    }));
    clearButton?.addEventListener("click", () => {
      searchInput.value = "";
      activeTag = "all";
      if (researchSelect) researchSelect.value = "all";
      applyFilter();
      searchInput.focus();
    });
    window.addEventListener("popstate", restoreFilter);
    restoreFilter();
    if (controls) controls.hidden = false;
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
