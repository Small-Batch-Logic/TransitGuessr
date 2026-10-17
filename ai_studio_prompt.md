# AI Studio Design Prompt: TransitGuessr V1

**Role**: You are a world-class Product Designer and Senior Creative Frontend Engineer. Your specialty is "Modern Technical Interfaces" (think Linear, Vercel, or Citymapper).

**Context**: I have an existing single-file web app (TransitGuessr). It's a "Geoguessr" for transit. Users see a Street View of a metro entrance and drop a pin on a Leaflet map. 

**Task**: Refactor the `<style>` and `<div id="start-screen">` sections of the provided `index.html` to achieve a "Premium V1 Launch" aesthetic.

### 🚫 Design Constraints (DO NOT USE):
- **NO Generic Glassmorphism**: No heavy blurs or "Apple-style" transparency.
- **NO Plain Colors**: Avoid #000, #FFF, or generic Blue/Red.
- **NO Simple MVPs**: The design must feel "State of the Art."

### ✅ Design Requirements (MUST USE):
1.  **Transit Intelligence Aesthetic**: High-density information, functional but beautiful. Use a "Dark Mode" base (Slate/Zinc/Evergreen).
2.  **The "Selection Island"**: The mode grid should feel like a dashboard of transit tokens. Each city (NYC, London, Toronto, etc.) should have its own distinctive system-color accent (e.g., TTC Red, NYC Yellow, Sydney Orange).
3.  **Icon-First Design**: Each card in the `mode-grid` MUST have a placeholder for an SVG icon (e.g., a stylized "M" for Metro or "U" for U-Bahn).
4.  **Typography**: Use 'Inter' or a high-quality San-Serif. Use variable font weights (900 for titles, 500 for cards).
5.  **Micro-Animations**: Add subtle CSS transitions (`transform: scale(0.98)`, `filter: brightness(1.2)`) on cards.
6.  **Interactive Controller**: The Difficulty selector (Hard/Easy) should look like a segmented "Control Center" toggle, not just two buttons.
7.  **Responsive Dashboard**: The layout should center beautifully on Desktop, maximizing vertical space for the grid.

### 🛠️ Technical Implementation:
- Output ONLY the `<style>` block and the `#start-screen` HTML block.
- Keep the existing `onclick="setMode('...')"` and `onclick="setDifficulty('...')"` function calls intact.
- Ensure all CSS variables (TTC, NYC, etc.) are used for system-specific border-colors or glows.

---
**Input Code**: [Paste content of index.html here]
