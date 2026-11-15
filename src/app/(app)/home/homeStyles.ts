/**
 * Home page styles. Same token vocabulary as the spend optimizer (paper chips,
 * Hubot display, mono eyebrows) so moving between the two feels seamless.
 * Scoped under `.hm`.
 */
export const homeStyles = `
.hm {
  --hm-bg: var(--brown-background);
  --hm-surface: var(--brown-sidebar);
  --hm-surface-low: color-mix(in oklab, var(--brown-background) 86%, black);
  --hm-surface-high: color-mix(in oklab, var(--brown-sidebar) 90%, white 10%);
  --hm-line: color-mix(in oklab, var(--brown-border) 80%, transparent);
  --hm-ink: oklch(0.97 0.008 60);
  --hm-ink-2: oklch(0.86 0.014 55);
  --hm-mut: oklch(0.70 0.012 55);
  --hm-faint: oklch(0.55 0.012 55);
  --hm-accent: var(--primary-orange);
  --hm-win: var(--secondary-success);
  --hm-paper: oklch(0.96 0.012 60);
  --hm-paper-ink: oklch(0.26 0.018 52);
  --hm-sans: var(--font-satoshi), ui-sans-serif, system-ui, sans-serif;
  --hm-display: var(--font-hubot), var(--font-satoshi), sans-serif;
  --hm-mono: ui-monospace, "SF Mono", Menlo, monospace;

  width: 100%; max-width: 1080px; margin: 0 auto;
  padding: 88px 20px 96px;
  font-family: var(--hm-sans); color: var(--hm-ink);
  display: flex; flex-direction: column; gap: 56px;
}
@media (min-width: 768px) { .hm { padding: 96px 40px 80px; gap: 64px; } }
@media (max-width: 767px) { .hm { gap: 48px; } }

.hm-eyecaps {
  font-family: var(--hm-mono); font-size: 0.7rem; font-weight: 500;
  letter-spacing: 0.16em; text-transform: uppercase; color: var(--hm-mut);
}
.hm-display {
  font-family: var(--hm-display); font-weight: 700; color: var(--hm-ink);
  font-size: clamp(1.9rem, 4vw, 2.75rem); line-height: 1.05; letter-spacing: -0.025em;
}
.hm-h2 { font-family: var(--hm-display); font-weight: 700; font-size: 1.35rem; letter-spacing: -0.015em; line-height: 1.2; }
.hm-lede { font-size: 0.92rem; line-height: 1.5; color: var(--hm-mut); margin-top: 6px; }
.hm-section-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; margin-bottom: 20px; }

/* ── Hero ─────────────────────────────────────────────── */
.hm-hero .hm-display { margin-top: 10px; }
.hm-search {
  margin-top: 28px; display: flex; align-items: center;
  background: var(--hm-surface); border: 1px solid var(--hm-line);
  border-radius: 16px; padding: 6px 6px 6px 18px;
  box-shadow: 0 24px 60px -36px rgba(0,0,0,0.8);
  transition: border-color .2s;
}
.hm-search:focus-within { border-color: color-mix(in oklab, var(--hm-accent) 70%, transparent); }
.hm-search-icon { width: 18px; height: 18px; color: var(--hm-faint); flex: none; }
.hm-search input {
  background: transparent; border: 0; outline: none; color: var(--hm-ink);
  font-size: 1rem; min-width: 0;
}
.hm-search input::placeholder { color: var(--hm-faint); }
.hm-search-merchant { flex: 1; padding: 14px 12px; }
.hm-search-amount {
  display: flex; align-items: center; gap: 4px; padding: 0 16px;
  border-left: 1px solid var(--hm-line); color: var(--hm-mut);
}
.hm-search-amount input { width: 84px; font-feature-settings: "tnum" 1; }
.hm-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  height: 48px; padding: 0 22px; border-radius: 11px; border: 0;
  background: var(--hm-accent); color: white; font-weight: 600; font-size: 0.95rem;
  cursor: pointer; transition: filter .2s, transform .12s; white-space: nowrap;
}
.hm-btn:hover:not(:disabled) { filter: brightness(1.08); }
.hm-btn:active:not(:disabled) { transform: translateY(1px); }
.hm-btn:disabled { opacity: .45; cursor: not-allowed; }
.hm-btn:focus-visible, .hm-chip:focus-visible, .hm-use:focus-visible {
  outline: 2px solid var(--hm-accent); outline-offset: 2px;
}
@media (max-width: 640px) {
  .hm-search { flex-wrap: wrap; padding: 6px; }
  .hm-search-icon { margin-left: 12px; }
  .hm-search-merchant { flex: 1 1 calc(100% - 40px); }
  .hm-search-amount { flex: 1; border-left: 0; border-top: 1px solid var(--hm-line); padding: 12px; }
  .hm-search .hm-btn { margin-top: 6px; flex: 1 1 100%; }
}

.hm-chips { margin-top: 16px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.hm-chips-label { margin-right: 4px; }
.hm-chip {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 5px 14px 5px 5px; border-radius: 999px;
  background: var(--hm-surface-low); border: 1px solid var(--hm-line);
  color: var(--hm-ink-2); font-size: 0.875rem; cursor: pointer; text-transform: capitalize;
  transition: border-color .2s, color .2s, background .2s;
}
.hm-chip:hover { border-color: var(--hm-accent); color: var(--hm-ink); background: var(--hm-surface); }

/* ── Mark (logo chip) ─────────────────────────────────── */
.hm-mark {
  flex: none; position: relative; display: grid; place-items: center; overflow: hidden;
  background: var(--hm-paper); color: var(--hm-paper-ink);
}
.hm-mark--sm { width: 26px; height: 26px; border-radius: 999px; }
.hm-mark--md { width: 36px; height: 36px; border-radius: 10px; }
.hm-mark-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; padding: 4px; box-sizing: border-box; }
.hm-mark.is-inked { background: var(--hm-paper-ink); }
.hm-mark.is-bleed { background: transparent; }
.hm-mark.is-bleed .hm-mark-img { padding: 0; object-fit: cover; }
.hm-mark.is-portrait .hm-mark-img { padding: 3px; }
.hm-mark.is-wide .hm-mark-img { padding: 0; transform: scale(var(--hm-logo-scale, 1.5)); }
.hm-mark.is-initial { font-family: var(--hm-display); font-weight: 700; font-size: 0.85rem; }
.hm-mark.is-icon { background: var(--hm-surface-high); color: var(--hm-ink-2); }
.hm-mark-icon { width: 17px; height: 17px; }

/* ── Which card where ─────────────────────────────────── */
.hm-wallet { display: flex; flex-direction: column; gap: 14px; }
.hm-group {
  display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: 28px; align-items: start;
  padding: 20px; border-radius: 20px; background: var(--hm-surface); border: 1px solid var(--hm-line);
}
@media (max-width: 760px) { .hm-group { grid-template-columns: 1fr; gap: 16px; padding: 14px; } }

/* The signature: each wallet card drawn as a card. */
.hm-face {
  position: relative; aspect-ratio: 1.586; border-radius: 14px; padding: 14px 16px;
  display: flex; flex-direction: column; justify-content: space-between; overflow: hidden;
  background: var(--hm-face, linear-gradient(140deg, #2f231c 0%, #6f4d34 100%));
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 18px 40px -22px rgba(0,0,0,0.9);
  color: #fff;
}
.hm-face::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(120% 80% at 100% 0%, rgba(255,255,255,0.14), transparent 55%);
}
.hm-face-top { display: flex; justify-content: space-between; align-items: center; }
.hm-face-bank { width: 30px; height: 30px; border-radius: 8px; background: var(--hm-paper); display: grid; place-items: center; overflow: hidden; }
.hm-face-bank img { width: 22px; height: 22px; object-fit: contain; }
.hm-face-chip { width: 30px; height: 22px; border-radius: 5px; background: linear-gradient(135deg, #d9c49a, #a88d5c); opacity: .85; }
.hm-face-name { font-family: var(--hm-display); font-weight: 600; font-size: 0.95rem; line-height: 1.2; letter-spacing: -0.01em; position: relative; z-index: 1; }
@media (max-width: 760px) {
  .hm-face { aspect-ratio: auto; flex-direction: row; align-items: center; gap: 12px; justify-content: flex-start; padding: 12px; }
  .hm-face-chip { display: none; }
}

.hm-use-label { margin-bottom: 10px; }
.hm-use-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px; }
.hm-use {
  display: flex; align-items: center; gap: 12px; padding: 10px 14px 10px 10px;
  border-radius: 12px; background: var(--hm-surface-low); border: 1px solid transparent;
  transition: border-color .2s, background .2s, transform .12s;
}
.hm-use:hover { border-color: color-mix(in oklab, var(--hm-accent) 60%, transparent); background: var(--hm-bg); transform: translateY(-1px); }
.hm-use-text { flex: 1; min-width: 0; }
.hm-use-name { font-size: 0.92rem; color: var(--hm-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hm-use-how { font-size: 0.72rem; color: var(--hm-faint); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
/* Satoshi, not Hubot: Hubot's tabular zero is slashed and reads as "1Ø%". */
.hm-use-rate { font-weight: 700; font-size: 1.15rem; color: var(--hm-accent); font-feature-settings: "tnum" 1; letter-spacing: -0.01em; }

.hm-notes { display: flex; flex-direction: column; gap: 6px; margin-top: 6px; padding-left: 4px; font-size: 0.85rem; color: var(--hm-mut); }
.hm-notes b { color: var(--hm-ink-2); font-weight: 500; }

/* ── No cards: faded example + the ask ──────────────────── */
.hm-ghost { position: relative; border-radius: 20px; overflow: hidden; }
.hm-ghost-example {
  opacity: .5; filter: saturate(.7); pointer-events: none; user-select: none;
  /* Fades out toward the prompt so the two never compete. */
  -webkit-mask-image: linear-gradient(90deg, black 35%, transparent 88%);
          mask-image: linear-gradient(90deg, black 35%, transparent 88%);
}
.hm-ghost-face { position: relative; }
.hm-ghost-tag {
  position: absolute; top: 10px; right: 10px; z-index: 2; padding: 3px 8px; border-radius: 999px;
  font-family: var(--hm-mono); font-size: 0.6rem; letter-spacing: 0.14em; text-transform: uppercase;
  background: rgba(0,0,0,0.45); color: rgba(255,255,255,0.85); backdrop-filter: blur(6px);
}
.hm-ghost-cta {
  position: absolute; top: 50%; right: 24px; transform: translateY(-50%); width: min(360px, 42%);
  padding: 24px; border-radius: 18px;
  background: color-mix(in oklab, var(--hm-surface) 82%, transparent);
  border: 1px solid var(--hm-line); backdrop-filter: blur(14px);
  box-shadow: 0 30px 60px -30px rgba(0,0,0,0.9);
}
.hm-ghost-title { font-family: var(--hm-display); font-weight: 700; font-size: 1.2rem; letter-spacing: -0.015em; color: var(--hm-ink); }
.hm-ghost-sub { margin: 6px 0 18px; font-size: 0.9rem; line-height: 1.5; color: var(--hm-mut); }
/* Example failed to load: the prompt stands alone in a quiet panel. */
.hm-ghost.is-bare .hm-ghost-cta { position: static; transform: none; width: auto; max-width: 520px; }
@media (max-width: 760px) {
  .hm-ghost-example {
    -webkit-mask-image: linear-gradient(180deg, black 30%, transparent 92%);
            mask-image: linear-gradient(180deg, black 30%, transparent 92%);
  }
  .hm-ghost-example .hm-use:nth-child(n+4) { display: none; }
  .hm-ghost-cta { position: relative; top: auto; right: auto; transform: none; width: auto; margin: -56px 12px 0; padding: 20px; }
  .hm-ghost-cta .hm-btn { width: 100%; }
}

.hm-dots { display: none; }

/* Phones: wallet and deals become swipeable rows (see Slider.tsx). Slides
   bleed to the screen edge (the negative margin undoes the page gutter) and
   the next one peeks in. */
@media (max-width: 760px) {
  /* Scoped under .hm to outrank each container's own desktop layout (.hm-deals is a grid). */
  .hm .hm-slider {
    display: flex; flex-direction: row; gap: 12px; overflow-x: auto; overscroll-behavior-x: contain;
    scroll-snap-type: x mandatory; scroll-padding-left: 20px;
    margin: 0 -20px; padding: 0 20px 4px; scrollbar-width: none;
  }
  .hm .hm-slider::-webkit-scrollbar { display: none; }
  .hm .hm-slider > * { flex: 0 0 86%; scroll-snap-align: start; }
  .hm .hm-slider.is-single > * { flex-basis: 100%; }
  /* align-content: start — slides share the tallest one's height, and the
     spare space must not go into the card face. */
  .hm-wallet > .hm-group { align-content: start; gap: 12px; padding: 12px; border-radius: 18px; }

  /* Compact rows so a whole card fits on screen without scrolling down. */
  .hm-use-label { margin-bottom: 8px; }
  .hm-use-grid { grid-template-columns: 1fr; gap: 6px; }
  /* More than 3 places: show 3 and most of a 4th, scroll the rest inside the card. */
  /* 3 rows + 3 gaps + 70% of the 4th row; the 14px fade eats only the last
     sliver, so well over half of row 4 stays readable as a "scroll for more". */
  .hm-use-grid.is-long {
    max-height: calc(52px * 3.7 + 6px * 3); overflow-y: auto; overscroll-behavior-y: contain;
    scrollbar-width: none; padding-bottom: 8px;
    -webkit-mask-image: linear-gradient(to bottom, black calc(100% - 14px), transparent);
            mask-image: linear-gradient(to bottom, black calc(100% - 14px), transparent);
  }
  .hm-use-grid.is-long::-webkit-scrollbar { display: none; }
  /* Fixed row height so the list's visible window can be sized in whole rows. */
  .hm-use { --row: 52px; height: var(--row); box-sizing: border-box; gap: 10px; padding: 0 12px 0 8px; border-radius: 10px; }
  .hm-use .hm-mark--md { width: 30px; height: 30px; border-radius: 8px; }
  .hm-use-name { font-size: 0.86rem; }
  .hm-use-how { font-size: 0.68rem; }
  .hm-use-rate { font-size: 1rem; }
  .hm-face { padding: 10px 12px; border-radius: 12px; }
  .hm-face-name { font-size: 0.88rem; }

  .hm-dots { display: flex; justify-content: center; gap: 6px; margin-top: 12px; }
  .hm-dot {
    width: 6px; height: 6px; border-radius: 999px; border: 0; padding: 0; cursor: pointer;
    background: color-mix(in oklab, var(--hm-ink) 25%, transparent); transition: width .25s, background .25s;
  }
  .hm-dot.is-on { width: 18px; background: var(--hm-accent); }
}

.hm-link { display: inline-flex; align-items: center; gap: 6px; font-size: 0.85rem; color: var(--hm-mut); white-space: nowrap; transition: color .2s; }
.hm-link:hover { color: var(--hm-accent); }

/* ── Hero, no cards: faded example lookup + the ask ─── */
/* Tall enough for the prompt box, with the example centred beside it, so the
   box never rises into the headline. */
.hm-hero-ghost {
  margin-top: 28px; overflow: visible; min-height: 210px;
  display: flex; flex-direction: column; justify-content: center;
}
.hm-hero-example .hm-search { margin-top: 0; box-shadow: none; }
.hm-search-static { color: var(--hm-ink); }
.hm-hero-answer {
  position: relative; display: flex; align-items: center; gap: 14px; margin-top: 10px; max-width: 520px;
  padding: 14px 18px; border-radius: 14px; background: var(--hm-surface-low);
  border: 1px solid color-mix(in oklab, var(--hm-win) 30%, var(--hm-line));
}
.hm-hero-answer-text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.hm-hero-answer-label { font-size: 0.72rem; color: var(--hm-faint); }
.hm-hero-answer-card { font-weight: 600; color: var(--hm-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hm-hero-answer-gain { display: flex; flex-direction: column; align-items: flex-end; }
.hm-hero-tag { top: -9px; right: 14px; }
@media (max-width: 760px) {
  .hm-hero-example .hm-search .hm-btn { display: none; }
  .hm-hero-ghost { min-height: 0; }
  /* Short example: keep it whole (dimmed only) so the answer stays readable. */
  .hm-hero-ghost .hm-hero-example { -webkit-mask-image: none; mask-image: none; }
  .hm-hero-ghost .hm-ghost-cta { margin-top: 14px; }
}

/* ── Festive status strip / points prompt ─────────────── */
.hm-strip, .hm-points-empty {
  display: flex; align-items: center; gap: 16px; padding: 16px 20px;
  border-radius: 16px; background: var(--hm-surface); border: 1px solid var(--hm-line);
  transition: border-color .2s;
}
.hm-strip:hover { border-color: color-mix(in oklab, var(--hm-accent) 60%, transparent); }
.hm-strip.is-ready {
  border-color: color-mix(in oklab, var(--hm-win) 45%, transparent);
  background: linear-gradient(90deg, color-mix(in oklab, var(--hm-win) 10%, var(--hm-surface)), var(--hm-surface) 60%);
}
.hm-strip-icon {
  width: 40px; height: 40px; border-radius: 12px; flex: none; display: grid; place-items: center;
  background: var(--hm-surface-high); color: var(--hm-accent);
}
.hm-strip.is-ready .hm-strip-icon { color: var(--hm-win); }
.hm-strip-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.hm-strip-title { font-weight: 600; color: var(--hm-ink); }
.hm-strip-sub { font-size: 0.82rem; color: var(--hm-mut); }
.hm-strip-cta { display: inline-flex; align-items: center; gap: 6px; font-size: 0.88rem; font-weight: 600; color: var(--hm-accent); white-space: nowrap; }
.hm-track { list-style: none; margin: 0; padding: 0; display: flex; gap: 18px; font-size: 0.78rem; color: var(--hm-faint); }
.hm-track li { display: flex; align-items: center; gap: 6px; white-space: nowrap; }
.hm-track li.is-done { color: var(--hm-ink-2); }
.hm-track-dot { width: 8px; height: 8px; border-radius: 999px; border: 1.5px solid currentColor; }
.hm-track li.is-done .hm-track-dot { background: var(--hm-accent); border-color: var(--hm-accent); }
/* Phones: icon + text share the first row; the CTA or progress track drops
   to its own row underneath, aligned with the text. Without the flex-basis
   the text is squeezed to a word per line beside the CTA. */
@media (max-width: 760px) {
  .hm-strip, .hm-points-empty { flex-wrap: wrap; gap: 10px 14px; padding: 14px 16px; }
  .hm-strip-text { flex: 1 1 calc(100% - 54px); }
  .hm-strip-sub { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .hm-track { flex: 1 1 100%; padding-left: 54px; gap: 6px 14px; flex-wrap: wrap; }
  .hm-strip-cta { padding-left: 54px; }
}

/* ── Festive banner ───────────────────────────────────── */
.hm-banner {
  position: relative; overflow: hidden; isolation: isolate;
  display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 0.9fr); align-items: center;
  min-height: 236px; padding: 28px 36px; border-radius: 22px;
  border: 1px solid color-mix(in oklab, var(--hm-accent) 30%, var(--hm-line));
  background:
    radial-gradient(70% 90% at 82% 60%, color-mix(in oklab, var(--hm-accent) 30%, transparent), transparent 70%),
    radial-gradient(60% 80% at 0% 0%, color-mix(in oklab, var(--hm-accent) 10%, transparent), transparent 60%),
    linear-gradient(135deg, color-mix(in oklab, var(--hm-surface) 92%, black), var(--hm-surface));
  box-shadow: 0 30px 80px -50px color-mix(in oklab, var(--hm-accent) 80%, transparent);
}
/* faint grain of light across the top edge */
.hm-banner::before {
  content: ""; position: absolute; inset: 0 0 auto 0; height: 1px; z-index: 1;
  background: linear-gradient(90deg, transparent, color-mix(in oklab, var(--hm-accent) 60%, white 10%), transparent);
  opacity: .6;
}
.hm-banner-copy { position: relative; z-index: 2; max-width: 460px; }
.hm-banner-eyebrow {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: var(--hm-mono); font-size: 0.7rem; letter-spacing: 0.16em; text-transform: uppercase;
  color: color-mix(in oklab, var(--hm-accent) 70%, white 30%);
}
.hm-banner-dot { width: 6px; height: 6px; border-radius: 999px; background: var(--hm-accent); box-shadow: 0 0 0 4px color-mix(in oklab, var(--hm-accent) 25%, transparent); }
.hm-banner-title {
  margin-top: 10px; font-family: var(--hm-display); font-weight: 700; color: var(--hm-ink);
  font-size: clamp(1.5rem, 2.8vw, 2rem); line-height: 1.1; letter-spacing: -0.025em;
}
/* Same amber → orange → rose accent as the campaign page headline. */
.hm-banner-amount {
  background: linear-gradient(90deg, #fcd34d, var(--hm-accent), #fb7185);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.hm-banner-lede { margin-top: 10px; font-size: 0.9rem; line-height: 1.5; color: var(--hm-ink-2); max-width: 430px; }
.hm-banner-cta { margin-top: 18px; height: 44px; }
.hm-banner:hover .hm-banner-cta { filter: brightness(1.08); }
.hm-banner:focus-visible { outline: 2px solid var(--hm-accent); outline-offset: 3px; }

.hm-banner-fan { position: relative; align-self: stretch; min-height: 200px; z-index: 1; }
/* Centred in the fan both ways: top/left 50%, then -50% of the card's own size. */
.hm-banner-card {
  position: absolute; left: 50%; top: 50%; width: 104px; margin-left: -52px;
  transform-origin: 50% 120%;
  transform: translate(var(--x), calc(-50% + var(--y))) rotate(var(--r)) scale(var(--s));
  transition: transform .45s cubic-bezier(.2,.8,.2,1);
}
.hm-banner:hover .hm-banner-card {
  transform: translate(calc(var(--x) * 1.12), calc(-50% + var(--y) - 4%)) rotate(calc(var(--r) * 1.15)) scale(var(--s));
}
@media (min-width: 1024px) { .hm-banner-card { width: 116px; margin-left: -58px; } }
/* Phones: one compact row — copy left, a small fan right, no subtitle. */
@media (max-width: 760px) {
  .hm-banner {
    grid-template-columns: minmax(0, 1fr) 132px; gap: 4px;
    padding: 16px 12px 16px 18px; min-height: 0; border-radius: 18px;
  }
  .hm-banner-eyebrow { font-size: 0.6rem; letter-spacing: 0.06em; gap: 6px; white-space: nowrap; }
  .hm-banner-dot { width: 5px; height: 5px; box-shadow: 0 0 0 3px color-mix(in oklab, var(--hm-accent) 25%, transparent); }
  .hm-banner-title { margin-top: 8px; font-size: 1.12rem; line-height: 1.2; }
  .hm-banner-title br { display: none; }
  .hm-banner-lede { display: none; }
  .hm-banner-cta { margin-top: 12px; height: 34px; padding: 0 14px; font-size: 0.8rem; border-radius: 9px; }
  .hm-banner-fan { min-height: 120px; }
  .hm-banner-card { width: 52px; margin-left: -26px; }
  /* Tighter spread than desktop so the fan stays inside its column. */
  .hm-banner-card, .hm-banner:hover .hm-banner-card {
    transform: translate(calc(var(--x) * 0.8), calc(-50% + var(--y))) rotate(var(--r)) scale(var(--s));
  }
}

/* ── Deals for your cards ─────────────────────────────── */
.hm-deals { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 12px; }
.hm-deal {
  display: flex; flex-direction: column; gap: 14px; min-width: 0;
  padding: 18px; border-radius: 16px; background: var(--hm-surface); border: 1px solid var(--hm-line);
  transition: border-color .2s;
}
.hm-deal:hover { border-color: color-mix(in oklab, var(--hm-accent) 45%, transparent); }
.hm-deal-head { display: flex; align-items: center; gap: 10px; min-width: 0; }
.hm-deal-store { font-weight: 600; color: var(--hm-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hm-deal-count { margin-left: auto; font-size: 0.72rem; color: var(--hm-faint); white-space: nowrap; }
.hm-deal-body { flex: 1; min-width: 0; }
.hm-deal-off { font-weight: 700; font-size: 1.15rem; color: var(--hm-accent); letter-spacing: -0.01em; }
.hm-deal-title {
  margin-top: 4px; font-size: 0.85rem; line-height: 1.4; color: var(--hm-ink-2);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.hm-deal-card {
  display: flex; align-items: baseline; gap: 8px; padding: 10px 12px; border-radius: 10px;
  background: color-mix(in oklab, var(--hm-win) 9%, var(--hm-surface-low));
  font-size: 0.8rem; color: var(--hm-mut); min-width: 0;
}
.hm-deal-plus { font-weight: 700; color: var(--hm-win); white-space: nowrap; font-feature-settings: "tnum" 1; }
.hm-deal-card-text { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hm-deal-card-text b { color: var(--hm-ink-2); font-weight: 500; }
.hm-deal-actions { display: flex; align-items: center; gap: 8px; }
.hm-deal-code {
  display: inline-flex; align-items: center; gap: 6px; min-width: 0; padding: 7px 10px; border-radius: 8px;
  border: 1px dashed color-mix(in oklab, var(--hm-ink) 30%, transparent); background: transparent;
  font-family: var(--hm-mono); font-size: 0.75rem; color: var(--hm-ink); cursor: pointer;
}
.hm-deal-code:hover { border-color: var(--hm-ink-2); }
.hm-deal-shop {
  margin-left: auto; display: inline-flex; align-items: center; gap: 4px; padding: 7px 14px; border-radius: 999px;
  background: color-mix(in oklab, var(--hm-accent) 88%, transparent); color: white; font-size: 0.8rem; font-weight: 600;
}
.hm-deal-shop:hover { background: var(--hm-accent); }
.hm-deal-code:focus-visible, .hm-deal-shop:focus-visible, .hm-link:focus-visible { outline: 2px solid var(--hm-accent); outline-offset: 2px; }

/* ── Your points ──────────────────────────────────────── */
.hm-points { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
.hm-point {
  display: flex; flex-direction: column; gap: 14px; min-width: 0;
  padding: 18px 20px; border-radius: 16px; background: var(--hm-surface); border: 1px solid var(--hm-line);
  transition: border-color .2s, transform .12s;
}
.hm-point:hover { border-color: color-mix(in oklab, var(--hm-accent) 60%, transparent); transform: translateY(-1px); }
.hm-point-card, .hm-point-value { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.hm-point-name { font-weight: 600; color: var(--hm-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hm-point-meta { font-size: 0.78rem; color: var(--hm-faint); }
.hm-point-amount { font-weight: 700; font-size: 1.5rem; color: var(--hm-win); letter-spacing: -0.01em; font-feature-settings: "tnum" 1; }
.hm-point-how { font-size: 0.82rem; color: var(--hm-ink-2); }
.hm-point-worst { font-size: 0.75rem; color: var(--hm-faint); margin-top: 6px; padding-top: 8px; border-top: 1px solid var(--hm-line); }
.hm-point-how, .hm-point-worst { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* ── Your next card ───────────────────────────────────── */
.hm-next {
  position: relative; overflow: hidden;
  display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 32px; align-items: center;
  padding: 32px; border-radius: 20px; background: var(--hm-surface); border: 1px solid var(--hm-line);
}
.hm-next-title { margin-top: 8px; font-size: clamp(1.3rem, 2.2vw, 1.6rem); max-width: 520px; }
.hm-steps { list-style: none; padding: 0; margin: 22px 0 26px; display: flex; flex-direction: column; gap: 12px; }
.hm-steps li { display: flex; align-items: center; gap: 10px; font-size: 0.92rem; color: var(--hm-ink-2); }
.hm-step-n {
  width: 24px; height: 24px; border-radius: 999px; display: grid; place-items: center; flex: none;
  font-family: var(--hm-mono); font-size: 0.72rem; color: var(--hm-ink);
  border: 1px solid color-mix(in oklab, var(--hm-ink) 25%, transparent);
}

.hm-fan { position: relative; height: 210px; }
.hm-fan-card { position: absolute; width: 230px; right: 40px; top: 30px; transform-origin: 20% 100%; transition: transform .35s ease; }
.hm-fan-card:nth-child(1) { transform: rotate(-14deg) translateX(-24px); opacity: .75; }
.hm-fan-card:nth-child(2) { transform: rotate(-6deg) translateX(-10px); opacity: .9; }
.hm-fan-front {
  --hm-face: linear-gradient(140deg, color-mix(in oklab, var(--primary-orange) 70%, black) 0%, var(--primary-orange) 100%);
  transform: rotate(3deg);
}
.hm-next:hover .hm-fan-card:nth-child(1) { transform: rotate(-18deg) translateX(-34px); }
.hm-next:hover .hm-fan-card:nth-child(2) { transform: rotate(-8deg) translateX(-16px); }
.hm-next:hover .hm-fan-front { transform: rotate(5deg) translateY(-4px); }
@media (max-width: 760px) {
  .hm-next { grid-template-columns: 1fr; padding: 22px; }
  .hm-fan { display: none; }
  .hm-next .hm-btn { width: 100%; }
}

@media (prefers-reduced-motion: reduce) {
  .hm *, .hm *::after { transition: none !important; }
}
`;
