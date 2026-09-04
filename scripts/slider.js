import { PODCASTS } from "./podcasts.js";

function svg(text) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(text)}`;
}

// Deterministic gradient-SVG cover used when no real cover asset is provided.
function generateCoverSvg({ palette = ["#333", "#999"], show = "" }) {
  const [a, b] = palette;
  const initials = show
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const raw = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${a}"/>
      <stop offset="1" stop-color="${b}"/>
    </linearGradient>
  </defs>
  <rect width="150" height="150" fill="url(#g)"/>
  <text x="16" y="140" font-family="Georgia, 'Times New Roman', serif"
        font-size="42" font-weight="700" fill="rgba(255,255,255,0.92)"
        letter-spacing="-1">${initials}</text>
  <text x="134" y="140" font-family="Georgia, 'Times New Roman', serif"
        font-size="42" font-weight="700" fill="rgba(255,255,255,0.6)"
        text-anchor="end">H</text>
</svg>`;
  return svg(raw);
}

function tileMarkup(podcast, index) {
  const coverSrc = podcast.cover || generateCoverSvg(podcast);
  const plus = podcast.isPlus
    ? `<podcast-test-paid-label paid-label="h-plus" class="podcast-tile__plus"></podcast-test-paid-label>`
    : "";
  return `
    <article class="podcast-tile${podcast.isPlus ? " podcast-tile--plus" : ""}" data-index="${index}">
      <div class="podcast-tile__cover">
        <img src="${coverSrc}" alt="${podcast.show}" loading="lazy">
      </div>
      <div class="podcast-tile__body">
        ${plus}
        <podcast-test-headline size="small" mode="brand-strong" class="podcast-tile__headline">
          <h3 class="podcast-tile__title">${podcast.title}</h3>
        </podcast-test-headline>
        <div class="podcast-tile__cta">
          <podcast-test-play-button
            appearance="primary"
            size="small"
            accessibility-label="Podcast abspielen"
          ></podcast-test-play-button>
          <span class="podcast-tile__cta-label">Podcast abspielen</span>
        </div>
      </div>
    </article>`;
}

// Layout constants — kept in sync with .podcast-tile / .slider__track CSS.
const TILE_W = 180;
const GAP = 10;
const DIVIDER_W = 1;
// Distance from one tile's left edge to the next tile's left edge.
const STRIDE = TILE_W + GAP + DIVIDER_W + GAP;

// Windowed-dots layout: a large dot is 6 × 6 with 5 px between dots, an
// overflow indicator (small dot) is 3 × 3 with 5 px gap on the inside.
const WIN_DOT_STRIDE = 11; // 6 (dot) + 5 (gap)
const WIN_OVERFLOW_LEAD = 3 + 5; // overflow dot width + trailing gap

export class PodcastSlider {
  constructor(root, { mode = "paged", data = PODCASTS } = {}) {
    this.root = root;
    this.mode = mode;
    this.data = data;
    // Authoritative "left-most tile currently intended to be visible".
    // Set on button clicks / dot clicks. During a smooth-scroll animation
    // this stays at the TARGET so consecutive clicks advance correctly,
    // instead of re-reading a mid-animation scrollLeft.
    this.firstVisibleIndex = 0;
    this.render();
    this.updateSpacer();
    this.bind();
    this.updateControls();
  }

  render() {
    const tiles = this.data
      .map((p, i) => tileMarkup(p, i))
      .join(
        `<hr class="slider__divider" role="presentation" aria-hidden="true">`
      );

    const sectionTitle = `
      <a class="podcast-section__title" href="#" aria-label="Alle Podcasts">
        <podcast-test-headline size="small" mode="accent">
          <h2 class="podcast-section__title-text">Podcasts</h2>
        </podcast-test-headline>
        <podcast-test-icon
          name="right"
          type="plain"
          size="small"
          class="podcast-section__title-icon"
        ></podcast-test-icon>
      </a>`;

    const headerRight =
      this.mode === "paged"
        ? `<div class="header-nav">
             <podcast-test-button
               appearance="secondary"
               size="medium"
               icon="left"
               hide-label
               accessibility-label="Vorheriger Podcast"
               class="js-prev"
             ></podcast-test-button>
             <podcast-test-button
               appearance="secondary"
               size="medium"
               icon="right"
               hide-label
               accessibility-label="Nächster Podcast"
               class="js-next"
             ></podcast-test-button>
           </div>`
        : "";

    const indicatorMarkup = () => {
      if (this.mode === "dots" || this.mode === "windowed-dots") {
        return `<ul class="slider__dots" role="tablist" aria-label="Podcast-Position"></ul>`;
      }
      if (this.mode === "scrollbar") {
        return `<div
          class="slider__scrollbar"
          role="scrollbar"
          aria-controls="${this.root.id}-track"
          aria-orientation="horizontal"
        >
          <div class="slider__scrollbar-handle" aria-hidden="true"></div>
        </div>`;
      }
      return "";
    };

    const control =
      this.mode === "dots" || this.mode === "windowed-dots" || this.mode === "scrollbar"
        ? `<div class="slider__control">
             <podcast-test-ghost-button
               size="medium"
               icon="left"
               hide-label
               accessibility-label="Vorheriger Podcast"
               class="js-prev"
             ></podcast-test-ghost-button>
             ${indicatorMarkup()}
             <podcast-test-ghost-button
               size="medium"
               icon="right"
               hide-label
               accessibility-label="Nächster Podcast"
               class="js-next"
             ></podcast-test-ghost-button>
           </div>`
        : "";

    this.root.classList.add("podcast-section");
    // Header and control sit inside the max-width container; the track lives
    // OUTSIDE it so the slider itself extends edge-to-edge across the section.
    this.root.innerHTML = `
      <div class="podcast-section__container">
        <div class="podcast-section__header">
          ${sectionTitle}
          ${headerRight}
        </div>
      </div>
      <div class="slider__track">
        ${tiles}
      </div>
      ${control ? `<div class="podcast-section__container podcast-section__container--center">${control}</div>` : ""}`;

    this.track = this.root.querySelector(".slider__track");
    if (!this.track.id) this.track.id = `${this.root.id}-track`;
    this.prevBtn = this.root.querySelector(".js-prev");
    this.nextBtn = this.root.querySelector(".js-next");
    this.dotsEl = this.root.querySelector(".slider__dots");
    this.scrollbarEl = this.root.querySelector(".slider__scrollbar");
    this.scrollbarHandle = this.root.querySelector(".slider__scrollbar-handle");
    this.tiles = Array.from(this.root.querySelectorAll(".podcast-tile"));
    // Only the scrollbar variant already has its handle in the DOM at
    // construction time; the pill is created lazily inside _buildDotsSkeleton.
    if (this.scrollbarEl && this.scrollbarHandle) {
      this._enableHandleDrag(this.scrollbarHandle, this.scrollbarEl);
      this._enableTrackClickJump(this.scrollbarEl, this.scrollbarHandle);
    }
  }

  bind() {
    this.prevBtn?.addEventListener("click", () => this.step(-1));
    this.nextBtn?.addEventListener("click", () => this.step(1));

    let rafId = 0;
    let settleTimer = 0;
    this.track.addEventListener("scroll", () => {
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          rafId = 0;
          // While a JS-driven smooth scroll from a button/dot click is
          // in flight, DON'T update the pill from the mid-animation scroll
          // value — the pill has already jumped to the authoritative
          // target and re-reading scroll would just make it jitter.
          if (this._jsScrolling) {
            this.updateDisabledFromIndex();
          } else {
            this.updateControls();
          }
        });
      }
      // Manual scroll (wheel / trackpad / touch drag) settles here:
      // 150 ms after the last scroll event, snap to the nearest tile so
      // the leftmost visible tile always lands on the header column.
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        if (this._jsScrolling) return;
        const { visibleCount: K } = this.computeVisibility();
        const maxIdx = Math.max(0, this.data.length - K);
        const idx = Math.max(0, Math.min(maxIdx, Math.round(this.track.scrollLeft / STRIDE)));
        this.firstVisibleIndex = idx;
        const target = this.tiles[idx].offsetLeft
          - (parseFloat(getComputedStyle(this.track).paddingInlineStart) || 0);
        if (Math.abs(this.track.scrollLeft - target) > 0.5) {
          this.track.scrollTo({ left: target, behavior: "smooth" });
        }
        this.updateControlsFromIndex();
      }, 150);
    });

    window.addEventListener("resize", () => {
      this.updateSpacer();
      this.updateControls();
    });
  }

  /** Toggle prev/next disabled state based on the authoritative index —
      without touching the dots row. */
  updateDisabledFromIndex() {
    const { visibleCount: K } = this.computeVisibility();
    const fv = Math.max(0, Math.min(this.firstVisibleIndex, this.data.length - K));
    this.prevBtn?.toggleAttribute("disabled", fv <= 0);
    this.nextBtn?.toggleAttribute("disabled", fv >= this.data.length - K);
  }

  /** How many tiles fit fully in the current viewport, and which is the
      leftmost fully visible one at the current scroll position. */
  computeVisibility() {
    const clientW = this.track.clientWidth;
    const trackPl = parseFloat(getComputedStyle(this.track).paddingInlineStart) || 0;
    // K tiles + (K−1) dividers + (2K−2) gaps ≤ clientW − trackPl
    //   →  K*STRIDE − (DIVIDER_W + 2*GAP)  ≤  clientW − trackPl
    const trailing = DIVIDER_W + 2 * GAP; // 21
    const K = Math.max(
      1,
      Math.min(
        this.data.length,
        Math.floor((clientW - trackPl + trailing) / STRIDE)
      )
    );
    const scroll = this.track.scrollLeft;
    let firstVisible = this.data.length - K;
    for (let i = 0; i < this.tiles.length; i++) {
      if (this.tiles[i].offsetLeft >= scroll - 0.5) {
        firstVisible = i;
        break;
      }
    }
    firstVisible = Math.max(0, Math.min(firstVisible, this.data.length - K));
    return { firstVisible, visibleCount: K };
  }

  /** Dynamic trailing spacer — sized so max-scroll positions the leftmost
      visible tile at the header padding column, while the last tile is
      still fully in view. Prevents the "empty right space" that a static
      spacer would produce and enforces the "stop when last tile fits"
      requirement. */
  updateSpacer() {
    const clientW = this.track.clientWidth;
    const trackPl = parseFloat(getComputedStyle(this.track).paddingInlineStart) || 0;
    const { visibleCount: K } = this.computeVisibility();
    const N = this.data.length;
    const needed = (N - K) * STRIDE + clientW;
    const existing = trackPl + N * STRIDE - (DIVIDER_W + 2 * GAP);
    const spacer = Math.max(0, needed - existing);
    this.track.style.setProperty("--spacer-w", `${spacer}px`);
  }

  step(direction) {
    // Advance the slider by exactly ONE podcast per click. Uses the
    // AUTHORITATIVE firstVisibleIndex so consecutive clicks — even while
    // the smooth-scroll animation of the previous click is still running —
    // correctly compound (0 → 1 → 2 …) instead of no-op'ing on the same
    // mid-animation scroll value.
    const { visibleCount: K } = this.computeVisibility();
    const target = Math.max(
      0,
      Math.min(this.firstVisibleIndex + direction, this.data.length - K)
    );
    this.scrollToIndex(target);
  }

  scrollToIndex(i) {
    const tile = this.tiles[i];
    if (!tile) return;
    // Align the target tile to the header padding column.
    const trackPl = parseFloat(getComputedStyle(this.track).paddingInlineStart) || 0;
    const trackRect = this.track.getBoundingClientRect();
    const tileRect = tile.getBoundingClientRect();
    const delta = tileRect.left - trackRect.left - trackPl;
    const target = Math.max(
      0,
      Math.min(
        this.track.scrollLeft + delta,
        this.track.scrollWidth - this.track.clientWidth
      )
    );
    this.firstVisibleIndex = i;
    this._jsScrolling = true;
    clearTimeout(this._jsScrollClear);
    this._jsScrollClear = setTimeout(() => { this._jsScrolling = false; }, 700);
    this.track.scrollTo({ left: target, behavior: "smooth" });
    // Reflect the new authoritative state instantly — the pill jumps to
    // its new slot right away (with CSS transitions animating the width
    // change) instead of lagging behind the scroll animation.
    this.updateControlsFromIndex();
  }

  updateControls() {
    const { firstVisible, visibleCount: K } = this.computeVisibility();
    const atStart = firstVisible <= 0;
    const atEnd = firstVisible >= this.data.length - K;
    this.prevBtn?.toggleAttribute("disabled", atStart);
    this.nextBtn?.toggleAttribute("disabled", atEnd);
    this.renderDots(firstVisible, K);
  }

  /** Same as updateControls but sourced from the AUTHORITATIVE index
      instead of the (possibly mid-animation) scroll position — used
      right after a button/dot click to reflect intent immediately. */
  updateControlsFromIndex() {
    const { visibleCount: K } = this.computeVisibility();
    const firstVisible = Math.max(
      0,
      Math.min(this.firstVisibleIndex, this.data.length - K)
    );
    const atStart = firstVisible <= 0;
    const atEnd = firstVisible >= this.data.length - K;
    this.prevBtn?.toggleAttribute("disabled", atStart);
    this.nextBtn?.toggleAttribute("disabled", atEnd);
    this.renderDots(firstVisible, K);
  }

  renderDots(firstVisible, K) {
    if (firstVisible == null || K == null) {
      const v = this.computeVisibility();
      firstVisible = v.firstVisible;
      K = v.visibleCount;
    }
    if (this.dotsEl) {
      if (this.mode === "windowed-dots") {
        // Rebuild only when the window shifts; positions inside the window
        // change every scroll frame via _updateWindowedPill().
        const win = this._computeWindow(firstVisible, K);
        this._buildWindowedDotsSkeleton(win, K);
        this._updateWindowedPill(firstVisible, K, win);
      } else {
        // Standard dots mode — build once per K, then toggle.
        if (this._skeletonK !== K) this._buildDotsSkeleton(K);
        this._updatePillPosition(firstVisible, K);
      }
    }
    if (this.scrollbarEl) {
      this._updateScrollbarPosition(firstVisible, K);
    }
  }

  /** Compute the current window of large dots for the windowed-dots mode.
      Strategy: the pill "rests" at the middle slot of the window and
      the WINDOW slides underneath it as firstVisible changes. The pill
      only walks toward the left / right edge when the window itself has
      run out of room to shift — i.e. when firstVisible is a few steps
      away from the very start or very end. Symmetric on both ends. */
  _computeWindow(firstVisible, K, MAX = 10) {
    const N = this.data.length;
    if (N <= MAX) {
      return {
        start: 0,
        end: N - 1,
        leftOverflow: false,
        rightOverflow: false,
      };
    }
    // Preferred pill slot inside the window — visual centre so the row
    // has room on both sides. For MAX=10, K=6 → centerSlot = 2.
    const centerSlot = Math.floor((MAX - K) / 2);
    const start = Math.max(0, Math.min(N - MAX, firstVisible - centerSlot));
    const end = start + MAX - 1;
    return {
      start,
      end,
      leftOverflow: start > 0,
      rightOverflow: end < N - 1,
    };
  }

  _buildWindowedDotsSkeleton(win, K) {
    // Build only ONCE per data-set. All N dots live in a fixed inner
    // track; the "window" is realized by translating the inner track
    // horizontally, so animating windowStart smoothly slides the entire
    // dot row — the user sees the dots physically move even when the
    // pill's slot within the window stays constant.
    const N = this.data.length;
    if (this._skeletonN === N) return;
    this._skeletonN = N;

    const dotsHtml = Array.from({ length: N }, (_, t) =>
      `<button class="slider__dot" type="button" data-tile="${t}"></button>`
    ).join("");

    this.dotsEl.innerHTML = `
      <div class="slider__dots-viewport slider__dots-viewport--windowed">
        <div class="slider__dots-inner">
          ${dotsHtml}
          <span class="slider__pill" aria-hidden="true"></span>
        </div>
      </div>`;

    this.pillEl = this.dotsEl.querySelector(".slider__pill");
    this.dotsInnerEl = this.dotsEl.querySelector(".slider__dots-inner");
    const viewportEl = this.dotsEl.querySelector(".slider__dots-viewport");

    if (this.pillEl && viewportEl) {
      this._enableHandleDrag(this.pillEl, viewportEl);
      this._enableTrackClickJump(viewportEl, this.pillEl);
    }

    this.dotsEl.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tile = Number(btn.dataset.tile);
        const K2 = this.computeVisibility().visibleCount;
        const maxIdx = Math.max(0, N - K2);
        let target;
        if (tile < this.firstVisibleIndex) target = tile;
        else if (tile >= this.firstVisibleIndex + K2)
          target = Math.min(maxIdx, tile - K2 + 1);
        else target = this.firstVisibleIndex;
        this.scrollToIndex(target);
      });
    });
  }

  _updateWindowedPill(firstVisible, K, win) {
    if (!this.pillEl || !this.dotsInnerEl) return;
    const N = this.data.length;
    const pillWidth = K * 6 + Math.max(0, K - 1) * 5;
    const windowStart = win.start;
    const windowEnd = win.end;

    // Slide the inner track so the LEFT peek slot ALWAYS lines up with
    // viewport x=0 — even at windowStart=0 where no left peek exists yet.
    // Keeping the alignment fixed means the RIGHT peek stays at viewport
    // x=121 for every window position, so a peek dot never "jumps" from
    // one viewport slot to another as the window shifts. Instead new
    // peek dots slide in cleanly from off-screen right (or left).
    const shiftSlots = windowStart - 1;
    this.dotsInnerEl.style.transform = `translateX(${-shiftSlots * WIN_DOT_STRIDE}px)`;

    // Pill sits inside the inner track — its translateX stays the tile
    // index times stride, so it inherits the inner track's slide.
    this.pillEl.style.width = `${pillWidth}px`;
    this.pillEl.style.transform = `translateX(${firstVisible * WIN_DOT_STRIDE}px)`;

    // Dots outside the window fade out (opacity 0); the ONE immediate
    // neighbour on each side is shown fully at 50 % opacity as a "peek"
    // — replaces the earlier half-clipped edge look with a fully visible
    // but transparent hint that more tiles exist beyond.
    this.dotsEl.querySelectorAll("button").forEach((btn) => {
      const tile = Number(btn.dataset.tile);
      const inWindow = tile >= windowStart && tile <= windowEnd;
      const isPeek =
        (!inWindow) &&
        (tile === windowStart - 1 || tile === windowEnd + 1);
      btn.classList.toggle("slider__dot--peek", isPeek);
      btn.classList.toggle("slider__dot--outside", !inWindow && !isPeek);
      const covered = tile >= firstVisible && tile < firstVisible + K;
      btn.classList.toggle("slider__dot--covered", covered);
      if (covered) {
        btn.setAttribute("aria-current", "true");
        btn.setAttribute(
          "aria-label",
          `Aktuell sichtbar: Podcast ${tile + 1} von ${N}`
        );
      } else {
        btn.removeAttribute("aria-current");
        btn.setAttribute(
          "aria-label",
          `Zu Podcast ${tile + 1} von ${N} springen`
        );
      }
    });
  }

  /** Pointer-drag on the pill / scrollbar-handle. Maps handle-space
      motion to track-scroll motion so dragging the handle scrolls the
      tiles proportionally. During drag we disable the handle's CSS
      transition so it follows the pointer without lag; the settle timer
      then snaps to the nearest tile on release. */
  _enableHandleDrag(handleEl, containerEl) {
    handleEl.style.touchAction = "none";
    handleEl.style.cursor = "grab";
    if (handleEl.classList.contains("slider__pill")) {
      handleEl.style.pointerEvents = "auto";
    }

    handleEl.addEventListener("pointerdown", (e) => {
      // Only left mouse button (or touch / pen).
      if (e.button != null && e.button !== 0) return;
      e.preventDefault();
      // setPointerCapture throws for synthesized events without an active
      // pointer; guard so the rest of the handler still runs.
      try { handleEl.setPointerCapture(e.pointerId); } catch (_) {}
      handleEl.style.cursor = "grabbing";
      handleEl.style.transition = "none";

      const containerRect = containerEl.getBoundingClientRect();
      const handleRect = handleEl.getBoundingClientRect();
      const dragRange = Math.max(1, containerRect.width - handleRect.width);
      const trackScrollMax = this.track.scrollWidth - this.track.clientWidth;
      const startPointerX = e.clientX;
      const startScroll = this.track.scrollLeft;

      const onMove = (ev) => {
        const dx = ev.clientX - startPointerX;
        const scrollDelta = (dx / dragRange) * trackScrollMax;
        const newScroll = Math.max(
          0,
          Math.min(trackScrollMax, startScroll + scrollDelta)
        );
        this.track.scrollLeft = newScroll;
      };
      const onUp = () => {
        handleEl.removeEventListener("pointermove", onMove);
        handleEl.removeEventListener("pointerup", onUp);
        handleEl.removeEventListener("pointercancel", onUp);
        handleEl.style.cursor = "grab";
        handleEl.style.transition = "";
        // The scroll listener's settle timer will snap to the nearest
        // tile 150 ms after the last scroll event.
      };
      handleEl.addEventListener("pointermove", onMove);
      handleEl.addEventListener("pointerup", onUp);
      handleEl.addEventListener("pointercancel", onUp);
    });
  }

  /** Click on the empty track area (left / right of the handle) →
      step −1 / +1, matching the prev / next button behavior. */
  _enableTrackClickJump(containerEl, handleEl) {
    containerEl.addEventListener("click", (e) => {
      // Ignore clicks on the handle itself or on any inner interactive
      // element (dot buttons keep their existing per-tile navigation).
      if (e.target === handleEl || handleEl.contains(e.target)) return;
      if (e.target !== containerEl && e.target.tagName === "BUTTON") return;
      const handleRect = handleEl.getBoundingClientRect();
      if (e.clientX < handleRect.left) this.step(-1);
      else if (e.clientX > handleRect.right) this.step(1);
    });
    containerEl.style.cursor = "pointer";
  }

  /** Scrollbar variant — a single fixed-width track (matching the dots
      variant's total width, 11N − 5 px) with a handle whose width is
      proportional to K/N and whose position slides with firstVisible.
      Beats N-per-tile dots for very large N. */
  _updateScrollbarPosition(firstVisible, K) {
    if (!this.scrollbarHandle || !this.scrollbarEl) return;
    const N = this.data.length;
    const trackW = this.scrollbarEl.getBoundingClientRect().width;
    if (!trackW) return;
    // Handle spans a proportional fraction of the track (visible / total).
    const handleW = Math.max(6, Math.round(trackW * (K / N)));
    // Handle slides across (trackW − handleW) as firstVisible goes 0..N-K.
    const maxIdx = Math.max(1, N - K);
    const maxPos = Math.max(0, trackW - handleW);
    const pos = Math.round(maxPos * (firstVisible / maxIdx));
    this.scrollbarHandle.style.width = `${handleW}px`;
    this.scrollbarHandle.style.transform = `translateX(${pos}px)`;
    this.scrollbarEl.setAttribute("aria-valuenow", String(firstVisible));
    this.scrollbarEl.setAttribute("aria-valuemin", "0");
    this.scrollbarEl.setAttribute("aria-valuemax", String(maxIdx));
  }

  _buildDotsSkeleton(K) {
    const N = this.data.length;
    this._skeletonK = K;
    // Fixed set of N slot positions (one per podcast). The pill overlay
    // slides over them via translateX. Slot stride = 6 px (dot width) +
    // 5 px (gap) = 11 px, matching the JS layout constants below.
    this.dotsEl.innerHTML = `
      <div class="slider__dots-track">
        ${Array.from({ length: N }, (_, t) =>
          `<button class="slider__dot" type="button" data-tile="${t}"></button>`
        ).join("")}
        <span class="slider__pill" aria-hidden="true"></span>
      </div>`;
    this.pillEl = this.dotsEl.querySelector(".slider__pill");
    const dotsTrackEl = this.dotsEl.querySelector(".slider__dots-track");
    // Drag on pill + click on empty track area → same behavior as
    // clicking prev/next, so the dots row feels like a real scrollbar.
    if (this.pillEl && dotsTrackEl) {
      this._enableHandleDrag(this.pillEl, dotsTrackEl);
      this._enableTrackClickJump(dotsTrackEl, this.pillEl);
    }
    this.dotsEl.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tile = Number(btn.dataset.tile);
        const K2 = this.computeVisibility().visibleCount;
        const maxIdx = Math.max(0, N - K2);
        // If clicked tile is BEFORE the pill's window → make it first-visible.
        // If it's AFTER  the window → make it last-visible (tile - K + 1).
        // If it's WITHIN the window → no-op (target = current firstVisibleIndex).
        let target;
        if (tile < this.firstVisibleIndex) target = tile;
        else if (tile >= this.firstVisibleIndex + K2) target = Math.min(maxIdx, tile - K2 + 1);
        else target = this.firstVisibleIndex;
        this.scrollToIndex(target);
      });
    });
  }

  _updatePillPosition(firstVisible, K) {
    const N = this.data.length;
    const pillWidth = K * 6 + Math.max(0, K - 1) * 5;
    if (this.pillEl) {
      // 11 = dot-width (6) + gap (5). Pill's left edge sits exactly on
      // slot `firstVisible`; transitioning translateX gives the sliding
      // effect the user asked for.
      this.pillEl.style.width = `${pillWidth}px`;
      this.pillEl.style.transform = `translateX(${firstVisible * 11}px)`;
    }
    const btns = this.dotsEl.querySelectorAll("button");
    btns.forEach((btn, tile) => {
      const covered = tile >= firstVisible && tile < firstVisible + K;
      btn.classList.toggle("slider__dot--covered", covered);
      if (covered) {
        btn.setAttribute(
          "aria-label",
          `Aktuell sichtbar: Podcast ${tile + 1} von ${N}`
        );
        btn.setAttribute("aria-current", "true");
      } else {
        btn.setAttribute(
          "aria-label",
          `Zu Podcast ${tile + 1} von ${N} springen`
        );
        btn.removeAttribute("aria-current");
      }
    });
  }
}
