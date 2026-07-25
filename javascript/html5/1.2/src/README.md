# Euler Square Puzzle Game

A browser-based single-player Euler Square puzzle game built with vanilla HTML5,
Canvas, and JavaScript.

## Features

- 🧩 **Classic Euler Square Gameplay** — Assemble puzzle pieces using
  drag-and-drop mechanics
- 🧲 **Magnetic Snapping** — Pieces automatically snap into place when
  moved close to any free board location
- 🖼️ **Guide Overlay** — Semi-transparent board guide (20% opacity)
  shows a deterministic valid solution layout for odd sizes and for
  4x4, 8x8, 10x10, 12x12, and 14x14; for 2x2 and 6x6 it displays question
  marks because no Euler-square solution exists
- 📱 **Responsive Design** — Adapts to different screen sizes and
  orientations
- 🎮 **Touch-Friendly** — Full pointer event support for mouse, touch,
  and pen input
- 🧪 **Unit Tests** — Comprehensive test suite to detect regressions
  and ensure game stability

## How to Play

1. **Open the game** — Load `javascript/html5/src/index.html` in a
   modern web browser
2. **Examine the board** — Use "Show Guide" to view the faint overlay
  guidance board
3. **Drag pieces** — Click and drag puzzle pieces from the scattered
   area onto the board
4. **Snap to position** — Move pieces close to any free board cell;
  they'll snap into place automatically
5. **Complete the puzzle** — Assemble all n times n pieces (n×n grid) to
  finish while satisfying row/column uniqueness for outer and inner
  colors
6. **Start again** — Click "↻ New..." to randomize piece positions and
  restart

## Installation

### Requirements

- Modern web browser with HTML5 Canvas support
- No external dependencies or server required

### Setup

1. Clone or download this repository
2. Open `javascript/html5/src/index.html` in your browser

## Project Structure

```text
euler-square/
├── LICENSE                           # MIT License
├── README.md                         # This file
└── javascript/html5/src/
    ├── index.html                   # Main game UI and styles
    ├── js/
    │   └── hmi.js                   # Game logic and mechanics
    └── test/
        └── tests.js                 # Unit tests
```

## Testing

Unit tests run automatically when the page loads. Open your browser
console (`F12 → Console`) to view results:

```text
🧪 Starting Euler Square Game Tests...

✓ size selector exists
✓ palette legend renders at least one swatch
✓ pointermove handler can be triggered
✓ distance < snap distance snaps
...

Test Results: 38/38 passed
```

Tests verify:

- DOM structure and element presence
- CSS styling and positioning
- Pointer event handling
- Snapping distance calculations
- Game completion logic
- Browser compatibility
- Event delegation

To run tests manually, call:

```javascript
EulerSquareTests.runAll()
```

## Technical Details

### Architecture

- **Single-file game logic** — All game mechanics in `js/hmi.js`
- **Canvas-based rendering** — Pieces are rendered to individual
  canvases for performance
- **Procedural color-pair generation** — Unique outer/inner color
  combinations are generated from an n-color palette

### Key Features

- **Drag-and-drop** using PointerEvent API
- **Magnetic snapping** to nearby free board cells with occupancy checks
- **Rule-based completion** requiring unique outer and inner colors per
  row and column
- **Responsive board scaling** that fits the playfield
- **Z-index management** for proper piece layering during drag operations

### Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Any browser supporting:
  - HTML5 Canvas
  - PointerEvent API
  - ES6 JavaScript

## Future Enhancements

- Timer and score tracking
- Sound effects
- Multiplayer support

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE)
for details.

## Contributing

Contributions welcome! To report issues or suggest features, please open
an issue or pull request.

---

Made with ❤️ using vanilla JavaScript and HTML5 Canvas
