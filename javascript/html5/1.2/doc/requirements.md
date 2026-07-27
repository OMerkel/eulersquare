# Requirements Overview

## 1. Scope

This document defines functional requirements (FR) and non-functional
requirements (NFR) for the Euler Square web application in
`javascript/html5/1.2/src/`.

It also provides a test-to-requirement traceability map for the current unit
test suites, enabling requirement coverage measurement on demand.

## 2. Requirement ID Scheme

- `FR-APP-*`: End-user application behavior
- `FR-MENU-*`: In-app menu and overlay behavior
- `FR-MOD-<module>-*`: Module contract/behavior
- `NFR-GLOB-*`: Global quality constraints
- `NFR-MOD-<module>-*`: Module-level quality constraints

Requirement status labels used below:

- `Implemented`: present in current code
- `Partially Tested`: implemented but only partly covered by automated tests
- `Tested`: implemented and covered by mapped unit tests

## 3. Functional Requirements (FR)

### 3.1 Application-Level FR

| ID | Requirement | Status |
| --- | --- | --- |
| FR-APP-001 | The application shall render an interactive Euler Square board in-browser without a backend dependency. | Tested |
| FR-APP-002 | The application shall support puzzle sizes from `1x1` through `14x14`. | Tested |
| FR-APP-003 | The application shall allow users to drag tiles and place them on board cells. | Partially Tested |
| FR-APP-004 | The application shall snap a tile to a valid free cell when released within snap tolerance. | Tested |
| FR-APP-005 | The application shall reject occupied target cells during snap attempts. | Tested |
| FR-APP-006 | The application shall allow toggling a visual guide overlay. | Tested |
| FR-APP-007 | The application shall validate solved state using row/column uniqueness of outer and inner colors. | Tested |
| FR-APP-008 | The application shall provide a Solve action that animates tile placement for supported board sizes. | Tested |
| FR-APP-009 | The application shall persist and restore game progress via browser local storage. | Tested |
| FR-APP-010 | The application shall preserve tile state across viewport resize by snapshot/restore. | Tested |

### 3.2 In-App Menu And Overlay FR

| ID | Requirement | Status |
| --- | --- | --- |
| FR-MENU-001 | The application shall provide side navigation actions for New, Solve, Options, Rules, Info, and About. | Tested |
| FR-MENU-002 | The application shall support opening and closing side navigation via menu button, close button, and backdrop click. | Tested |
| FR-MENU-003 | The Options overlay shall allow selecting board size and applying changes through “Apply And Start New Game”. | Tested |
| FR-MENU-004 | Overlay dialogs shall close via close button and by clicking overlay root outside panel. | Tested |
| FR-MENU-005 | Status text shall reflect key transitions (preparing, progress, solved, invalid solved, no-solution guidance). | Partially Tested |

### 3.3 Module-Specific FR

#### 3.3.1 constants.js

| ID | Requirement | Status |
| --- | --- | --- |
| FR-MOD-CON-001 | The constants module shall provide `GRID_MIN`, `GRID_MAX`, `GRID_DEFAULT`. | Tested |
| FR-MOD-CON-002 | The constants module shall provide `NO_SOLUTION_SIZES` and guide templates for supported even sizes. | Tested |
| FR-MOD-CON-003 | The constants module shall provide the base color palette used for tile generation. | Tested |

#### 3.3.2 ui-constants.js

| ID | Requirement | Status |
| --- | --- | --- |
| FR-MOD-UIC-001 | The UI constants module shall publish DOM element ID mapping used by the orchestrator. | Tested |
| FR-MOD-UIC-002 | The UI constants module shall provide labels and status text tokens used by HMI flows. | Tested |
| FR-MOD-UIC-003 | The UI constants module shall define pointer snap distance behavior constant. | Tested |

#### 3.3.3 solver.js

| ID | Requirement | Status |
| --- | --- | --- |
| FR-MOD-SOL-001 | Solver shall expose API: `hasNoEulerSquareSolution`, `getGuideCombo`, `validateSolvedLayout`, `findSolveTargetForColors`. | Tested |
| FR-MOD-SOL-002 | Solver shall detect no-solution square sizes based on configured set. | Tested |
| FR-MOD-SOL-003 | Solver shall generate odd-order guide combinations using affine mapping. | Tested |
| FR-MOD-SOL-004 | Solver shall validate solved layouts for row/column uniqueness and fullness. | Tested |
| FR-MOD-SOL-005 | Solver shall identify matching free target coordinates for unplaced tile color pairs. | Tested |

#### 3.3.4 game-state.js

| ID | Requirement | Status |
| --- | --- | --- |
| FR-MOD-GST-001 | Game-state module shall expose API: `createPersistedState`, `parsePersistedState`, `createPieceSnapshot`, `restorePiecesFromSnapshot`. | Tested |
| FR-MOD-GST-002 | Persisted state shall include grid dimensions, tile combos, and piece placement state. | Tested |
| FR-MOD-GST-003 | For unplaced pieces, persisted/snapshot state shall store relative coordinates. | Tested |
| FR-MOD-GST-004 | Restore shall reconstruct piece coordinates and board occupancy map. | Tested |
| FR-MOD-GST-005 | Parse shall reject missing/invalid persisted payloads. | Tested |

#### 3.3.5 board-renderer.js

| ID | Requirement | Status |
| --- | --- | --- |
| FR-MOD-BRD-001 | Board renderer shall expose API: `createPieceCanvas`, `buildBoardLayout`. | Tested |
| FR-MOD-BRD-002 | Piece canvas rendering shall include outer/inner color regions and tile framing. | Tested |
| FR-MOD-BRD-003 | Board layout shall compute tile dimensions from playfield size and grid dimensions. | Tested |
| FR-MOD-BRD-004 | Board overlay shall render guide texture and apply configured opacity. | Tested |
| FR-MOD-BRD-005 | Returned layout shall include board geometry aliases (`w/h` and `width/height`). | Tested |

#### 3.3.6 input-controller.js

| ID | Requirement | Status |
| --- | --- | --- |
| FR-MOD-INP-001 | Input controller shall expose a `create` factory and pointer binding methods. | Tested |
| FR-MOD-INP-002 | Pointer-down shall capture active piece and drag offsets. | Tested |
| FR-MOD-INP-003 | Pointer-move shall clamp tile movement within playfield bounds. | Tested |
| FR-MOD-INP-004 | Pointer-up shall compute snap candidate based on geometry and tolerance. | Tested |
| FR-MOD-INP-005 | On valid snap, controller shall dispatch callback with resolved snap cell. | Tested |
| FR-MOD-INP-006 | On solved-piece pickup, controller shall trigger lift callback before drag. | Tested |

#### 3.3.7 hmi.js (orchestration)

| ID | Requirement | Status |
| --- | --- | --- |
| FR-MOD-HMI-001 | HMI shall verify all required modules are loaded before bootstrap. | Tested |
| FR-MOD-HMI-002 | HMI shall orchestrate startup by populating options and restoring or starting a new game. | Tested |
| FR-MOD-HMI-003 | HMI shall bind menu, overlay, and gameplay events. | Tested |
| FR-MOD-HMI-004 | HMI shall synchronize solved count, occupancy, and status text on snap/unsnap actions. | Partially Tested |
| FR-MOD-HMI-005 | HMI shall delegate rendering/state/input/solver responsibilities to specialized modules. | Tested |

#### 3.3.8 sw.js (PWA/offline)

| ID | Requirement | Status |
| --- | --- | --- |
| FR-MOD-SW-001 | Service worker shall precache core runtime assets at install. | Tested |
| FR-MOD-SW-002 | Service worker shall cache dev test assets only in local debug host contexts. | Tested |
| FR-MOD-SW-003 | Service worker shall use cache-first strategy for static assets. | Tested |
| FR-MOD-SW-004 | Service worker shall use network-first strategy for non-static app requests. | Tested |
| FR-MOD-SW-005 | Service worker shall provide `index.html` offline fallback for document requests. | Tested |

## 4. Non-Functional Requirements (NFR)

### 4.1 Global NFR

| ID | Requirement | Rationale | Status |
| --- | --- | --- | --- |
| NFR-GLOB-001 | Maintainability: architecture shall remain modular with clear responsibilities per JS file. | Easier change isolation and review | Tested |
| NFR-GLOB-002 | Testability: logic-heavy components shall be testable independently of full UI runtime. | Faster, targeted regression detection | Tested |
| NFR-GLOB-003 | Responsiveness: UI shall remain usable on resize and mobile pointer inputs. | Device compatibility | Partially Tested |
| NFR-GLOB-004 | Reliability: persisted game state shall recover safely or fail gracefully on malformed data. | Prevent corrupt startup flows | Tested |
| NFR-GLOB-005 | Offline readiness: core app shall run without network after SW install. | PWA behavior | Implemented |
| NFR-GLOB-006 | Compatibility: runtime shall use broadly available browser APIs (Canvas, Pointer Events, localStorage, SW). | Mainstream browser support | Tested |

### 4.2 Module-Level NFR

| ID | Requirement | Status |
| --- | --- | --- |
| NFR-MOD-SOL-001 | Solver functions should be deterministic for same inputs and side-effect free. | Tested |
| NFR-MOD-GST-001 | Game-state operations should be serialization-safe JSON payloads. | Tested |
| NFR-MOD-BRD-001 | Board renderer should perform bounded-size canvas drawing per board cell. | Partially Tested |
| NFR-MOD-INP-001 | Input controller should isolate pointer state to internal controller instance. | Tested |
| NFR-MOD-HMI-001 | HMI should avoid owning low-level logic now delegated to modules. | Tested |
| NFR-MOD-SW-001 | SW cache versions should be explicit and upgradeable via version bump. | Tested |

## 5. Requirement Traceability To Unit Tests

Coverage unit in this matrix is the current test case function (suite-level test
method). For assertion-level granularity, each test can be split further.

Legend:

- `Direct`: test directly verifies requirement behavior
- `Indirect`: test provides supporting evidence

### 5.1 Traceability Matrix (All Current Unit Tests)

| Test File | Suite.Test | Requirement IDs Covered | Coverage Type |
| --- | --- | --- | --- |
| constants.tests.js | constants.exposesExpectedApi | FR-MOD-CON-001, FR-MOD-CON-002 | Direct |
| constants.tests.js | constants.providesBasePaletteContract | FR-MOD-CON-003 | Direct |
| ui-constants.tests.js | ui-constants.exposesExpectedApi | FR-MOD-UIC-001 | Direct |
| ui-constants.tests.js | ui-constants.providesUiLabelsAndStatusTokens | FR-MOD-UIC-002, FR-MOD-UIC-003 | Direct |
| solver.tests.js | solver.exposesExpectedApi | FR-MOD-SOL-001 | Direct |
| solver.tests.js | solver.detectsNoSolutionSizes | FR-MOD-SOL-002, FR-APP-002 | Direct |
| solver.tests.js | solver.buildsGuideComboForOddOrders | FR-MOD-SOL-003, FR-APP-007 | Direct |
| solver.tests.js | solver.validatesSolvedLayoutRules | FR-MOD-SOL-004, FR-APP-007 | Direct |
| solver.tests.js | solver.findsSolveTargetForColors | FR-MOD-SOL-005 | Direct |
| game-state.tests.js | game-state.exposesExpectedApi | FR-MOD-GST-001 | Direct |
| game-state.tests.js | game-state.createsAndParsesPersistedState | FR-MOD-GST-002, FR-MOD-GST-003, FR-APP-009, NFR-GLOB-004 | Direct |
| game-state.tests.js | game-state.restoresSnapshotAndOccupancy | FR-MOD-GST-004, FR-APP-010 | Direct |
| game-state.tests.js | game-state.rejectsMalformedPersistedPayloads | FR-MOD-GST-005, NFR-GLOB-004 | Direct |
| board-renderer.tests.js | board-renderer.exposesExpectedApi | FR-MOD-BRD-001 | Direct |
| board-renderer.tests.js | board-renderer.createsTileCanvas | FR-MOD-BRD-002, NFR-GLOB-006 | Direct |
| board-renderer.tests.js | board-renderer.computesBoardLayoutAndAppliesStyles | FR-MOD-BRD-003, FR-MOD-BRD-004, FR-MOD-BRD-005, FR-APP-001 | Direct |
| input-controller.tests.js | input-controller.exposesExpectedApi | FR-MOD-INP-001 | Direct |
| input-controller.tests.js | input-controller.handlesLiftMoveAndSnapLifecycle | FR-MOD-INP-002, FR-MOD-INP-003, FR-MOD-INP-004, FR-MOD-INP-005, FR-MOD-INP-006, FR-APP-003, FR-APP-004 | Direct |
| input-controller.tests.js | input-controller.rejectsSnapToOccupiedCell | FR-APP-005, FR-MOD-INP-004, FR-MOD-INP-005 | Direct |
| hmi.tests.js | hmi-integration.requiredDomElementsExist | FR-MOD-HMI-001, FR-MOD-UIC-001, FR-APP-001 | Direct |
| hmi.tests.js | hmi-integration.sizeSelectorRangeAndDefault | FR-APP-002, FR-MENU-003, FR-MOD-CON-001 | Direct |
| hmi.tests.js | hmi-integration.paletteLegendRendered | FR-MOD-HMI-002, FR-MENU-005 | Indirect |
| hmi.tests.js | hmi-integration.cssAndBrowserSupportChecks | FR-APP-001, NFR-GLOB-003, NFR-GLOB-006 | Direct |
| hmi.tests.js | hmi-integration.togglesGuideOpacityAndButtonLabel | FR-APP-006, FR-MOD-HMI-004 | Direct |
| hmi.tests.js | hmi-integration.menuOpenAndClosePaths | FR-MENU-002, FR-MOD-HMI-003 | Direct |
| hmi.tests.js | hmi-integration.overlayOpenAndClosePaths | FR-MENU-004, FR-MOD-HMI-003 | Direct |
| hmi.tests.js | hmi-integration.solveUnsupportedAndSupportedSizes | FR-APP-008 | Direct |
| sw.tests.node.js | sw-node.registersLifecycleEventHandlers | FR-MOD-SW-001 | Direct |
| sw.tests.node.js | sw-node.precacheCoreAssetsInProductionHost | FR-MOD-SW-001, NFR-MOD-SW-001 | Direct |
| sw.tests.node.js | sw-node.precacheDevTestAssetsOnLocalhost | FR-MOD-SW-002 | Direct |
| sw.tests.node.js | sw-node.servesStaticFromCacheFirst | FR-MOD-SW-003 | Direct |
| sw.tests.node.js | sw-node.fallbackBehaviorForStaticAndDocuments | FR-MOD-SW-005 | Direct |
| sw.tests.node.js | sw-node.networkFirstForNonStaticAndRuntimeCaching | FR-MOD-SW-004 | Direct |

## 6. Coverage Measurement On Demand

### 6.1 Measurement Method

Compute requirement coverage at run time as:

- Requirement coverage ratio:
  - $Coverage = \frac{\#Requirements\ with\ at\ least\ one\ passing\ mapped\ test}{\#Total\ Requirements\ in\ scope}$
- Test pass ratio:
  - $PassRate = \frac{\#Passing\ tests}{\#Executed\ tests}$

For auditable coverage snapshots:

1. Enable tests (`localhost` or `?tests=1`).
2. Run all suites (`window.EulerSquareTestHarness.runAll()`).
3. Capture console output.
4. Resolve each test result against table in section 5.1.
5. Mark each linked requirement as:
   - `Pass`: all mapped tests passed
   - `Fail`: at least one mapped test failed
   - `Untested`: no mapped test exists

Automated option (recommended):

1. Single-command preparation (runs SW tests, merges with browser log, and writes
  `javascript/html5/1.2/src/test/coverage-input.txt`):

  ```powershell
  npm run coverage:req:prepare:auto
  ```

  Notes:

- If `javascript/html5/1.2/src/test/harness-output.txt` exists, it is used.
- If it does not exist, the script falls back to
  `javascript/html5/1.2/src/test/fixtures/harness-output.sample.txt`.

1. Optional strict mode (requires a real browser harness log file):

  ```powershell
  npm run coverage:req:prepare
  ```

1. Manual browser log capture (for strict mode), for example:

- Enable tests (`localhost` or `?tests=1`), run
  `window.EulerSquareTestHarness.runAll()`, and save console output into
  `javascript/html5/1.2/src/test/harness-output.txt`.

1. Equivalent manual SW log command:

  ```powershell
  npm run test:sw > javascript/html5/1.2/src/test/sw-harness-output.txt
  ```

1. Equivalent manual merge command:

  ```powershell
  Get-Content javascript/html5/1.2/src/test/harness-output.txt, javascript/html5/1.2/src/test/sw-harness-output.txt | Set-Content javascript/html5/1.2/src/test/coverage-input.txt
  ```

1. Run the coverage reporter:

  ```powershell
  node javascript/html5/1.2/src/test/requirements-coverage.js --input javascript/html5/1.2/src/test/coverage-input.txt
  ```

  Shortcut via npm script from repository root:

  ```powershell
  npm run coverage:req -- --input javascript/html5/1.2/src/test/coverage-input.txt
  ```

  One-command prepare + report flow:

  ```powershell
  npm run coverage:req:run
  ```

  Quick sample run (no arguments required):

  ```powershell
  npm run coverage:req:sample
  ```

  Quick NFR sample run (no arguments required):

  ```powershell
  npm run coverage:req:sample:nfr
  ```

  Combined FR+NFR sample run:

  ```powershell
  npm run coverage:req:sample:all
  ```

  Combined FR+NFR sample JSON run (CI-friendly):

  ```powershell
  npm run coverage:req:sample:json
  ```

  Optional file output example:

  ```powershell
  npm run coverage:req:sample:json > coverage-sample.json
  ```

1. Optional filters and formats:

  ```powershell
  node javascript/html5/1.2/src/test/requirements-coverage.js --input javascript/html5/1.2/src/test/harness-output.txt --scope FR
  node javascript/html5/1.2/src/test/requirements-coverage.js --input javascript/html5/1.2/src/test/harness-output.txt --scope NFR
  node javascript/html5/1.2/src/test/requirements-coverage.js --input javascript/html5/1.2/src/test/harness-output.txt --format json
  ```

The reporter outputs:

- totals (`Pass`, `Fail`, `Untested`) per requirement scope
- coverage ratio and requirement pass rate
- per-requirement status with contributing test cases

Utility regression self-test:

1. Run the deterministic fixture check:

  ```powershell
  node javascript/html5/1.2/src/test/requirements-coverage.selftest.js
  ```

  Shortcut via npm script from repository root:

  ```powershell
  npm run coverage:req:selftest
  ```

1. Fixture source used by the self-test:
  `javascript/html5/1.2/src/test/fixtures/harness-output.sample.txt`

### 6.2 Current Gaps (No Direct Unit Test Yet)

The previously listed FR coverage gaps were closed in this iteration.

Current residual gaps are primarily around non-functional and higher-level integration concerns:

- NFR-GLOB-003 (broader responsiveness coverage across resize and pointer-device matrix)
- NFR-GLOB-005 (end-to-end offline behavior with browser-level SW activation flow)
- NFR-MOD-BRD-001 (renderer performance/bounds characteristics beyond functional assertions)

### 6.3 Suggested Coverage Enhancements

1. Add browser automation coverage for full offline lifecycle (install, activate, reload, offline navigation).
2. Add resize and pointer-device matrix tests to improve NFR-GLOB-003 confidence.
3. Add lightweight performance-budget checks for board rendering at high grid sizes.
4. Extend reporter ingestion for structured browser exports (JSON snapshots) to avoid log parsing ambiguity.
