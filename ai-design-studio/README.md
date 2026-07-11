# AI Design Studio

**The easiest way to turn any idea into something you can actually build.**

AI Design Studio is a standalone, zero-dependency web app. Its flagship experience is **Home Studio**:

> Upload a room photo or floor plan. Instantly receive an editable 2D and interactive 3D version. Redesign your space with AI.

## The journey

Photo → Editable Model → Intelligent Design Guidance → Improved Design → Budget → Materials → Contractor-ready Brief.

## What's inside

- **Home Studio (live)** — upload a photo/plan or start from a smart template; get a synced 2D floor plan (drag-and-drop editing) and interactive 3D room (orbit, walkthrough, day/night, dollhouse section view).
- **Design Intelligence** — a built-in spatial-analysis engine that checks circulation, door swings, walkway clearances, furniture scale, natural light, lighting coverage and ergonomics — and explains *why* behind every recommendation, with one-tap fixes.
- **8 design themes** — Modern, Minimal, Scandinavian, Industrial, Luxury, Japandi, Traditional, Contemporary — with hold-to-compare against your original.
- **Live budget** — realistic furniture/paint/flooring/electrical/labour estimation, renovation stages, bill of materials, and a printable contractor brief.
- **Smart shopping** — generated only when you ask; budget/standard/premium/eco options with reasons, never pushy, no affiliate links.
- **Future studios** — Product, Build and Project Studios are designed into the platform architecture and unlock later.

## How the AI works (honestly)

- All design analysis and advice runs **offline in your browser** — a deterministic spatial-reasoning engine over the room model. No account, no server, no data leaves your device.
- Photo/plan "reconstruction" is an assisted estimate (image brightness/aspect heuristics + smart room templates) that **you confirm and refine** — it does not claim server-side computer vision.
- The **AI Mentor chat** works out of the box with the built-in engine. Optionally paste your own Anthropic API key in *Settings* to make it fully conversational (the key is stored only in your browser's localStorage and sent only to Anthropic).

## Run it

No build step, no dependencies. Serve the repo statically and open `/ai-design-studio/`:

```bash
python3 -m http.server 5173
# → http://localhost:5173/ai-design-studio/
```

The interactive 3D viewer loads Three.js from a CDN via an import map, so 3D needs a network connection.

## Architecture

One parametric `Project` model (walls, openings, furniture, lighting — all in mm) is the single source of truth; the 2D SVG editor and the Three.js viewer are two renderers over it.

```
src/
├── main.js      app shell, screens, state
├── model.js     parametric room model, templates, undo/redo, persistence
├── catalog.js   furniture catalog with real-world dimensions and price tiers
├── themes.js    8 design themes (palettes, materials, cost multipliers)
├── editor2d.js  SVG floor-plan editor
├── viewer3d.js  Three.js room viewer (orbit / walkthrough)
├── ai.js        Design Intelligence engine + AI Mentor
├── budget.js    estimation, stages, BOM, shopping, contractor brief
└── styles.css   design language
```

This app is fully independent of the Griha app at the repository root — no shared code, styles or state.
