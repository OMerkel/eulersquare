# Euler Square Puzzle Game

A browser-based single-player Euler Square puzzle game built with vanilla HTML5,
Canvas, and JavaScript.

## Features

- Classic Euler Square gameplay with drag-and-drop tiles
- Magnetic snapping to free board cells
- Guide overlay (20% opacity) with deterministic layouts
- Responsive playfield and board scaling
- Pointer-event input support (mouse, touch, pen)
- Modular JavaScript architecture with module-focused browser tests

## Usage

### Start the game

1. Open `javascript/html5/1.2/src/index.html` in a modern browser.
2. Drag tiles from the playfield onto the board.
3. Tiles snap when dropped close to a free target cell.
4. Use **Show Guide** to toggle the solution overlay.
5. Use **New...** to reshuffle tiles.
6. Use **Solve** to auto-place tiles for supported sizes.

### Puzzle-size behavior

- Supported size range: `1x1` to `14x14`
- No-solution guide sizes: `2x2` and `6x6`
- Template/constructive guide logic:
  - odd orders: affine construction
  - even templates: `4, 8, 10, 12, 14`

## How to Play

1. **Open the game** — Load `javascript/html5/1.2/src/index.html` in a
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
2. Open `javascript/html5/1.2/src/index.html` in your browser

## Project Structure

```text
euler-square/
├── LICENSE                           # MIT License
├── README.md                         # This file
└── javascript/html5/1.2/src/
  ├── index.html                   # Main game UI and script loading
  ├── sw.js                        # Service worker cache/offline logic
  ├── js/
  │   ├── constants.js             # Domain constants and templates
  │   ├── ui-constants.js          # UI labels and DOM id mapping
  │   ├── solver.js                # Solver and validation domain logic
  │   ├── game-state.js            # Save/restore and snapshot state logic
  │   ├── board-renderer.js        # Board/piece rendering and layout
  │   ├── input-controller.js      # Pointer drag/drop and snapping
  │   └── hmi.js                   # App orchestration/bootstrap
  └── test/
    ├── test-harness.js          # Shared test harness and suite runner
    ├── solver.tests.js
    ├── game-state.tests.js
    ├── board-renderer.tests.js
    ├── input-controller.tests.js
    ├── hmi.tests.js
    └── tests.js                 # Runner entrypoint
```

## Testing

### When tests run

Tests are not loaded in production by default.

Tests load automatically when either condition is true:

- Host is local development (`localhost`, `127.0.0.1`, `[::1]`)
- Query parameter `?tests=1` is present

Examples:

- `.../javascript/html5/1.2/src/` (localhost): tests load automatically
- `.../javascript/html5/1.2/src/?tests=1`: tests are forced on any host

### How to run and observe

1. Open the page with tests enabled.
2. Open browser dev tools (`F12`) and select **Console**.
3. Look for suite-by-suite output and final summary from the harness.

Sample output:

```text
Starting Euler Square module tests...

Suite: solver
OK hasNoEulerSquareSolution exposed
OK odd order guide combo exists

Suite: input-controller
OK create exposed
OK snap callback invoked after move
...

Test Results: X/Y passed
```

### Test behavior and scope

Test suites are separated by software architecture module:

- `solver.tests.js`
  - API exposure
  - no-solution size detection
  - guide-combo construction
  - solved-layout validation rules
- `game-state.tests.js`
  - persisted state create/parse
  - snapshot restore and occupancy restoration
- `board-renderer.tests.js`
  - tile canvas creation
  - board layout and style application
- `input-controller.tests.js`
  - pointer lifecycle behavior
  - solved-piece lift callback
  - snap callback and occupancy updates
- `hmi.tests.js`
  - DOM presence and integration-level behavior checks

To run tests manually, call:

```javascript
window.EulerSquareTestHarness.runAll()
```

## Technical Details

### Architecture

- **Orchestration** — `js/hmi.js`
- **Puzzle domain logic** — `js/solver.js`
- **State persistence/restoration** — `js/game-state.js`
- **Rendering/layout** — `js/board-renderer.js`
- **Pointer interactions** — `js/input-controller.js`
- **Canvas-based rendering** — Pieces rendered to individual canvases
- **Generated color pairs** — Outer/inner combinations from an n-color palette

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
