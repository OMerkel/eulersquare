# Software Architecture

## 1. Purpose And Scope

This document describes the software architecture of the Euler Square HTML5
application in `javascript/html5/1.2/src/`.

It covers:

- Functional scope and feature set
- Runtime structure and module responsibilities
- Interaction and state behavior
- Deployment and offline/PWA behavior
- Test strategy and architectural test split
- Suggested next improvements

Target audience:

- Maintainers and contributors
- QA and test authors
- Reviewers performing architecture-level changes

## 2. System Overview

Euler Square is a client-side web application.

- UI and game logic run fully in the browser
- No backend service is required
- Persistent state is stored in browser `localStorage`
- Offline support is provided by `sw.js` (Service Worker + Cache API)

## 3. Feature List

Core features:

- Drag-and-drop tile placement using Pointer Events
- Snap-to-cell placement with occupancy checks
- Guide overlay toggle (show/hide)
- New game generation by selected board size (`1..14`)
- Auto-solver animation for supported sizes
- Rule validation (row and column uniqueness for outer and inner colors)
- State restore on reload and state-preserving resize behavior
- Side navigation and informational overlays (Options, Rules, Info, About)

Behavior nuances:

- No-solution guide indication for `2x2` and `6x6`
- Solve action currently disabled for sizes `2`, `6`, and `14`
- Tests load only in local debug hosts or when `?tests=1` is used

## 4. How To Navigate Through The Application

Main interaction path:

1. Open the app and wait for initial layout
2. Open menu (`hamburger` button)
3. Start a new puzzle with `New...`
4. Change size from `Options...` then `Apply And Start New Game`
5. Drag pieces onto board cells
6. Use `Show Guide` / `Hide Guide` as needed
7. Use `Solve` for supported sizes
8. Open `Rules`, `Info`, and `About` overlays for guidance/context

## 5. Architectural Module Split

Current runtime modules in `src/js/`:

- `constants.js`: static constants and even-order guide templates
- `ui-constants.js`: DOM ids, labels, overlay page descriptors, UI behavior
- `solver.js`: guide generation, layout validation, target search
- `game-state.js`: persistence serialization and restore snapshot logic
- `board-renderer.js`: board layout sizing and canvas rendering
- `input-controller.js`: pointer lifecycle and snap decision logic
- `hmi.js`: orchestration/bootstrap and integration glue

### 5.1 Module Dependency Diagram

```mermaid
flowchart LR
  IDX[index.html] --> C[constants.js]
  IDX --> UIC[ui-constants.js]
  IDX --> SOL[solver.js]
  IDX --> GS[game-state.js]
  IDX --> BR[board-renderer.js]
  IDX --> IC[input-controller.js]
  IDX --> HMI[hmi.js]

  HMI --> C
  HMI --> UIC
  HMI --> SOL
  HMI --> GS
  HMI --> BR
  HMI --> IC

  IDX --> SW[sw.js]
```

## 6. Runtime Flow Charts

### 6.1 Application Startup Flow

```mermaid
flowchart TD
  A[Page Load] --> B[Load JS modules in order]
  B --> C[hmi.js bootstrap]
  C --> D[Resolve DOM nodes]
  D --> E[Populate grid options]
  E --> F{Saved state exists and valid?}
  F -- Yes --> G[Restore tile combos and piece positions]
  F -- No --> H[Generate tile combos and start new game]
  G --> I[Bind pointer and menu events]
  H --> I
  I --> J[Interactive gameplay]
```

### 6.2 New Game Generation Flow

```mermaid
flowchart TD
  A[Start New Game] --> B[Set preparing status]
  B --> C[Generate outer/inner tile combinations]
  C --> D[Build board layout via board-renderer]
  D --> E[Build piece canvases]
  E --> F[Scatter tiles off-grid]
  F --> G[Set status text based on size]
  G --> H[Persist state to localStorage]
```

## 7. State Charts

### 7.1 Puzzle Lifecycle State Chart

```mermaid
stateDiagram-v2
  [*] --> Bootstrapping
  Bootstrapping --> Restored: valid saved state
  Bootstrapping --> FreshGame: no/invalid saved state

  Restored --> Playing
  FreshGame --> Playing

  Playing --> Dragging: pointerdown on tile
  Dragging --> Playing: pointerup without valid snap
  Dragging --> PlacedProgress: pointerup with valid snap

  PlacedProgress --> Playing: tiles remaining
  PlacedProgress --> Completed: all tiles placed and valid
  PlacedProgress --> InvalidComplete: all tiles placed but invalid

  Completed --> Playing: tile lifted or new game
  InvalidComplete --> Playing: tile lifted or new game

  Playing --> Solving: Solve action
  Solving --> Completed: solver finishes valid
  Solving --> InvalidComplete: solver ends invalid
  Solving --> Playing: user starts new game
```

### 7.2 Overlay UI State Chart

```mermaid
stateDiagram-v2
  [*] --> MenuClosed
  MenuClosed --> MenuOpen: menu button
  MenuOpen --> MenuClosed: close/backdrop

  MenuOpen --> OverlayOptions: Options
  MenuOpen --> OverlayRules: Rules
  MenuOpen --> OverlayInfo: Info
  MenuOpen --> OverlayAbout: About

  OverlayOptions --> MenuClosed: Apply and Start New Game
  OverlayRules --> MenuClosed: Close
  OverlayInfo --> MenuClosed: Close
  OverlayAbout --> MenuClosed: Close
```

## 8. Object Message Exchange (Sequence Diagrams)

### 8.1 Drag, Snap, Validate Sequence

```mermaid
sequenceDiagram
  participant U as User
  participant IC as input-controller
  participant H as hmi
  participant S as solver
  participant GS as game-state

  U->>IC: pointerdown(tile)
  IC->>H: onPieceLiftedFromSolvedCell(piece) (optional)

  U->>IC: pointermove(...)
  IC->>IC: update tile x/y

  U->>IC: pointerup()
  IC->>IC: tryFindSnapCell()
  alt Snap candidate found
    IC->>H: onPieceSnapped(piece, snapCell)
    H->>S: validateSolvedLayout(...)
    H->>GS: createPersistedState(...)
    H->>H: localStorage.setItem(...)
  else No snap
    IC->>H: return to playing
  end
```

### 8.2 Solve Action Sequence

```mermaid
sequenceDiagram
  participant U as User
  participant H as hmi
  participant S as solver
  participant GS as game-state

  U->>H: Click Solve
  H->>H: Phase 1 move incorrect tiles away
  loop each moved tile
    H->>GS: createPersistedState(...)
    H->>H: save to localStorage
  end

  H->>H: Rebuild occupancy from correct placements
  loop each unplaced piece
    H->>S: findSolveTargetForColors(...)
    S-->>H: target row/col
    H->>H: animate to target and place piece
    H->>GS: createPersistedState(...)
    H->>H: save to localStorage
  end

  H->>S: validateSolvedLayout(...)
  S-->>H: solved/invalid
  H->>U: Update status message
```

## 9. Class Diagram (Conceptual)

This is a conceptual class-style model of module contracts and key data
structures.

```mermaid
classDiagram
  class HmiOrchestrator {
    -gridRows
    -gridCols
    -pieces[]
    -boardRect
    -boardOccupancy Map
    +startNewGame()
    +restoreGameState()
    +solvePuzzle()
    +onPieceSnapped(piece, snapCell)
  }

  class Solver {
    +hasNoEulerSquareSolution(rows, cols, noSolutionSizes)
    +getGuideCombo(config)
    +validateSolvedLayout(config)
    +findSolveTargetForColors(config)
  }

  class GameState {
    +createPersistedState(config)
    +parsePersistedState(raw)
    +createPieceSnapshot(config)
    +restorePiecesFromSnapshot(config)
  }

  class BoardRenderer {
    +createPieceCanvas(config)
    +buildBoardLayout(config)
  }

  class InputController {
    +create(config)
    +bindPiece(canvas)
    +bindDocument(document)
  }

  class Piece {
    +row
    +col
    +outerColor
    +innerColor
    +x
    +y
    +solved
    +placedRow
    +placedCol
    +canvas
  }

  class BoardRect {
    +x
    +y
    +w
    +h
    +width
    +height
    +fieldW
    +fieldH
  }

  HmiOrchestrator --> Solver
  HmiOrchestrator --> GameState
  HmiOrchestrator --> BoardRenderer
  HmiOrchestrator --> InputController
  HmiOrchestrator "1" o-- "many" Piece
  HmiOrchestrator --> BoardRect
```

## 10. Deployment Architecture

### 10.1 Deployment Diagram

```mermaid
flowchart LR
  subgraph Client[Browser Client]
    UI[index.html + CSS]
    JS[Runtime JS Modules]
    SW[Service Worker]
    LS[localStorage]
    CA[Cache Storage]
  end

  subgraph Host[Static Hosting]
    ORG[GitHub Pages or any static web server]
    ASSETS[HTML/CSS/JS/Images/Manifest]
  end

  ORG --> ASSETS
  ASSETS --> UI
  UI --> JS
  UI --> SW
  SW --> CA
  JS --> LS
  SW --> ASSETS
```

### 10.2 PWA Cache Strategy

- Precache core runtime assets during service worker install
- Conditionally precache test assets only on local debug hosts
- Static assets: cache-first with network fallback
- Non-static/document requests: network-first with cache fallback
- Offline document fallback: `index.html`

## 11. Test Architecture

Test modules in `src/test/`:

- `test-harness.js`: registration and summary reporting
- `solver.tests.js`: domain rule/solver checks
- `game-state.tests.js`: serialization/restore checks
- `board-renderer.tests.js`: rendering/layout checks
- `input-controller.tests.js`: pointer/snap behavior checks
- `hmi.tests.js`: integration checks
- `tests.js`: runner entry point

### 11.1 Test Module Diagram

```mermaid
flowchart TD
  TH[test-harness.js] --> ST[solver.tests.js]
  TH --> GT[game-state.tests.js]
  TH --> BT[board-renderer.tests.js]
  TH --> IT[input-controller.tests.js]
  TH --> HT[hmi.tests.js]
  ST --> TR[tests.js runner]
  GT --> TR
  BT --> TR
  IT --> TR
  HT --> TR
```

## 12. Data Model Summary

Persisted game-state payload (simplified):

- `gridRows`, `gridCols`
- `boardWidth`, `boardHeight`
- `tileCombos[row][col] = { outerColor, innerColor }`
- `pieces[]` with:
  - identity (`row`, `col`)
  - placement (`placedRow`, `placedCol`, `solved`)
  - color attributes (`outerColor`, `innerColor`)
  - relative fallback position (`relX`, `relY`) when unplaced

## 13. Quality Attributes

Primary quality goals and how architecture supports them:

- Maintainability:
  - Explicit module boundaries (solver, state, renderer, input)
- Testability:
  - Module-level tests and isolated contracts
- Performance:
  - Canvas-based rendering and incremental movement updates
- Offline resilience:
  - Service worker precache and runtime caching
- Responsiveness:
  - Board rebuild with state snapshot/restore on resize

## 14. Risks And Constraints

- Global module registration via `window.*` requires strict load ordering
- Large grid sizes increase DOM/canvas count and animation work
- Solver animation is currently sequential and may be slow on low-end devices
- LocalStorage schema is implicit (no explicit versioned migration yet)

## 15. Suggested Improvements

Recommended next steps:

1. Add schema versioning for persisted state and migration guards
2. Add optional telemetry hooks for performance timings (render/solve/restore)
3. Add accessibility pass for keyboard-only puzzle interactions
4. Add CI browser-based test runner (Playwright) for deterministic regression checks
5. Introduce ADR files in `doc/adr/` for major architectural decisions
6. Consider ES module migration to remove global `window.*` coupling

## 16. Change Impact Guidance

When modifying specific areas, expected blast radius:

- Puzzle rules or validation:
  - `solver.js`, `solver.tests.js`, status text in `ui-constants.js`
- Save/restore behavior:
  - `game-state.js`, `hmi.js`, `game-state.tests.js`
- Visual layout and tile drawing:
  - `board-renderer.js`, CSS, `board-renderer.tests.js`
- Drag/snap behavior:
  - `input-controller.js`, `hmi.js`, `input-controller.tests.js`
- Offline and caching:
  - `sw.js`, optionally test/load gating in `index.html`
