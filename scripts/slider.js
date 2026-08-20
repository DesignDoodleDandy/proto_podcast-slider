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

export class PodcastSlider {
  constructor(root, { mode = "paged", data = PODCASTS } = {}) {
    this.root = root;
    this.mode = mode;
    this.data = data;
    this.activeIndex = 0;
    this.render();
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
    this.track.addEventListener("scroll", () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        this.syncActiveFromScroll();
        this.updateControls();
      });
    });

    window.addEventListener("resize", () => this.updateControls());
  }

  syncActiveFromScroll() {
    // Which tile is currently aligned to the header's left edge?
    const trackPl = parseFloat(getComputedStyle(this.track).paddingInlineStart) || 0;
    const alignX = this.track.getBoundingClientRect().left + trackPl;
    let best = 0;
    let bestDist = Infinity;
    this.tiles.forEach((tile, i) => {
      const d = Math.abs(tile.getBoundingClientRect().left - alignX);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    if (best !== this.activeIndex) {
      this.activeIndex = best;
      this.renderDots();
    }
  }

  step(direction) {
    // Buttons always advance the slider by exactly one podcast.
    const target = Math.max(
      0,
      Math.min(this.activeIndex + direction, this.data.length - 1)
    );
    this.scrollToIndex(target);
  }

  scrollToIndex(i) {
    const tile = this.tiles[i];
    if (!tile) return;
    this.activeIndex = i;
    // Align the target tile to the track's inner content edge — i.e. the
    // same x-position where the "Podcasts" header text starts, not to the
    // outer track edge. This keeps the currently-leftmost tile aligned to
    // the header at every scroll position.
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
    this.track.scrollTo({ left: target, behavior: "smooth" });
  }

  updateControls() {
    const atStart = this.track.scrollLeft <= 1;
    const atEnd =
      this.track.scrollLeft + this.track.clientWidth >=
      this.track.scrollWidth - 1;
    // HMG WebComponents expose `disabled` as an attribute, not a property.
    this.prevBtn?.toggleAttribute("disabled", atStart);
    this.nextBtn?.toggleAttribute("disabled", atEnd);
    this.renderDots();
  }

  renderDots() {
    if (!this.dotsEl) return;
    // Render one dot per podcast so the indicator matches the total count.
    this.dotsEl.innerHTML = this.data
      .map(
        (_, i) => `<li>
          <button
            class="slider__dot${i === this.activeIndex ? " slider__dot--active" : ""}"
            type="button"
            data-target="${i}"
            role="tab"
            aria-selected="${i === this.activeIndex}"
            aria-label="Zeige Podcast ${i + 1} von ${this.data.length}"
          ></button>
        </li>`
      )
      .join("");
    this.dotsEl.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.target);
        this.activeIndex = idx;
        this.scrollToIndex(idx);
      });
    });
  }
}
