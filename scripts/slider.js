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

    const control =
      this.mode === "dots"
        ? `<div class="slider__control">
             <podcast-test-ghost-button
               size="medium"
               icon="left"
               hide-label
               accessibility-label="Vorheriger Podcast"
               class="js-prev"
             ></podcast-test-ghost-button>
             <ul class="slider__dots" role="tablist" aria-label="Podcast-Position"></ul>
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
    this.prevBtn = this.root.querySelector(".js-prev");
    this.nextBtn = this.root.querySelector(".js-next");
    this.dotsEl = this.root.querySelector(".slider__dots");
    this.tiles = Array.from(this.root.querySelectorAll(".podcast-tile"));
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
    if (!this.dotsEl) return;
    if (firstVisible == null || K == null) {
      const v = this.computeVisibility();
      firstVisible = v.firstVisible;
      K = v.visibleCount;
    }
    // Build the dot skeleton ONCE per K — a stable DOM lets CSS width /
    // background transitions run cleanly instead of being torn down on
    // every scroll frame. On firstVisible change we only toggle classes
    // and inline widths on the existing nodes.
    if (this._skeletonK !== K) this._buildDotsSkeleton(K);
    this._updatePillPosition(firstVisible, K);
  }

  _buildDotsSkeleton(K) {
    const N = this.data.length;
    const slotCount = N - K + 1;
    this._skeletonK = K;
    this.dotsEl.innerHTML = Array.from({ length: slotCount }, (_, s) =>
      `<li>
        <button class="slider__dot" type="button" data-slot="${s}"></button>
      </li>`
    ).join("");
    this.dotsEl.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        // Slot i navigates to firstVisible = i. Every slot is a valid
        // navigation target — including the current one (no-op).
        const slot = Number(btn.dataset.slot);
        this.scrollToIndex(slot);
      });
    });
  }

  _updatePillPosition(firstVisible, K) {
    const N = this.data.length;
    const pillWidth = K * 6 + Math.max(0, K - 1) * 5;
    const btns = this.dotsEl.querySelectorAll("button");
    btns.forEach((btn, s) => {
      const isPill = s === firstVisible;
      btn.classList.toggle("slider__dot--active", isPill);
      // Always set an explicit numeric width so the CSS width transition
      // can animate cleanly between values (empty → number never fires).
      btn.style.width = isPill ? `${pillWidth}px` : `6px`;
      if (isPill) {
        btn.setAttribute(
          "aria-label",
          `Aktuell sichtbar: Podcast ${firstVisible + 1} bis ${firstVisible + K} von ${N}`
        );
        btn.setAttribute("aria-current", "true");
      } else {
        btn.setAttribute(
          "aria-label",
          `Zu Podcast ${s + 1} von ${N} springen`
        );
        btn.removeAttribute("aria-current");
      }
    });
  }
}
