# Applying Your Aesthetic: Brutalism

**Aesthetic:** Brutalism — [Aesthetics Wiki](https://aesthetics.fandom.com/wiki/Brutalism)

**Page restyled:** Home (`src/index.njk`), scoped via a `pageClass: aesthetic-brutalist` front-matter flag that adds a class to `<html>`. Every other page is untouched.

## CSS choices

Brutalism reads as raw, structural, and a little confrontational: square corners, thick black borders, hard offset shadows instead of soft blur, monospace type in labels and controls, and a near-black/white palette with a single hazard-red accent. `brutalist.css` layers on top of the site's existing `base.css` rather than replacing it — the base file already routes every component through `--color-*` custom properties, so redefining those tokens under `:root.aesthetic-brutalist` re-skins the header, buttons, and cards almost for free. What's added on top is brutalism-specific: `--radius: 0`, a `--border-w`/`--shadow-offset` pair used for the hard "sticker" shadows on project cards, and a monospace/uppercase treatment reserved for structural UI text (headings, nav, buttons) while body paragraphs stay in the base sans-serif, since long blocks of monospace prose are genuinely harder to read.

## JS enhancement

A "View Raw HTML" toggle (`brutalist.js`) reveals the page's own current `outerHTML` in a terminal-styled panel. It ships with `hidden` on both the button and panel in the markup, and the script only removes `hidden` after it successfully wires up the click handler — so with JavaScript off, nothing broken is left on the page. The markup is inserted via `textContent`, not `innerHTML`, so the literal `<script>` tags in the dump print as visible text instead of re-executing.

## One accessibility/responsive decision

The focus-ring color (`--color-focus`) couldn't just reuse the accent-red, because red-on-black text elements would make a red ring nearly invisible in dark mode. Instead it's black in light mode and hazard yellow in dark mode — both checked against WCAG 1.4.11 (3:1 minimum for non-text contrast) and comfortably clear it. The card "press" effect on hover is also applied to `:focus-within`, not just `:hover`, so keyboard users get the same feedback mouse users do, and the whole transition is gated behind `prefers-reduced-motion: no-preference`.

## Medium is the message

McLuhan's point is that a medium's form shapes how its content is received, independent of what that content says. Most sites go out of their way to hide their own medium — the markup disappears behind the styled page, and you're only ever meant to see the "message." The raw-HTML toggle inverts that on purpose: press it, and the page's own skeleton becomes the content on screen. Pairing that with brutalism makes the point twice. Brutalist design already refuses to disguise its structure — exposed borders, visible grid lines, no soft edges pretending the layout isn't a layout. The toggle just makes that literal: the medium doesn't just show through the message here, for a moment it *is* the message.
