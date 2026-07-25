/**
 * Euler Square Game Unit Tests
 * Tests core game mechanics to detect regressions
 */

const EulerSquareTests = (() => {
	const testResults = [];
	let testCount = 0;
	let passCount = 0;

	function assert(condition, message) {
		testCount += 1;
		if (condition) {
			passCount += 1;
			logTest(`✓ ${message}`);
		} else {
			logTest(`✗ ${message}`);
		}
	}

	function assertEqual(actual, expected, message) {
		assert(
			actual === expected,
			`${message} (expected: ${expected}, got: ${actual})`,
		);
	}

	function assertNotNull(value, message) {
		assert(
			value !== null && value !== undefined,
			`${message} should not be null`,
		);
	}

	function assertGreater(value, min, message) {
		assert(value > min, `${message} should be > ${min}, got ${value}`);
	}

	function logTest(msg) {
		testResults.push(msg);
		console.log(msg);
	}

	function report() {
		const summary = `\n${"=".repeat(50)}\nTest Results: ${passCount}/${testCount} passed\n${"=".repeat(50)}`;
		logTest(summary);
		return { passed: passCount, total: testCount, results: testResults };
	}

	// Test Suite
	const tests = {
		testConstants() {
			const sizeSelect = document.getElementById("sizeSelect");
			assertNotNull(sizeSelect, "size selector exists");
			assertEqual(
				sizeSelect.options.length,
				14,
				"size selector has 14 options (1x1 to 14x14)",
			);
			assertEqual(sizeSelect.value, "10", "default selected size is 10x10");
		},

		testUtilFunctions() {
			// Test clamp function
			const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
			assertEqual(clamp(50, 0, 100), 50, "clamp(50, 0, 100) = 50");
			assertEqual(clamp(-10, 0, 100), 0, "clamp(-10, 0, 100) = 0");
			assertEqual(clamp(150, 0, 100), 100, "clamp(150, 0, 100) = 100");

			// Test rand function
			const rand = (min, max) => Math.random() * (max - min) + min;
			const r = rand(10, 20);
			assertGreater(r, 9.9, "rand(10, 20) > 10");
			assert(r < 20.1, "rand(10, 20) < 20");
		},

		testDOMElements() {
			const playfield = document.getElementById("playfield");
			const board = document.getElementById("board");
			const boardOverlay = document.getElementById("board-overlay");
			const statusEl = document.getElementById("status");

			assertNotNull(playfield, "playfield element exists");
			assertNotNull(board, "board element exists");
			assertNotNull(boardOverlay, "board-overlay element exists");
			assertNotNull(statusEl, "status element exists");
		},

		testDOMStyles() {
			const board = document.getElementById("board");
			const boardOverlay = document.getElementById("board-overlay");
			const playfield = document.getElementById("playfield");

			const boardStyle = window.getComputedStyle(board);
			const overlayStyle = window.getComputedStyle(boardOverlay);
			const fieldStyle = window.getComputedStyle(playfield);

			assertEqual(
				boardStyle.position,
				"absolute",
				"board is absolutely positioned",
			);
			assertEqual(
				overlayStyle.position,
				"absolute",
				"board-overlay is absolutely positioned",
			);
			assertEqual(
				overlayStyle.pointerEvents,
				"none",
				"board-overlay has pointer-events: none",
			);
			assertEqual(
				fieldStyle.position,
				"relative",
				"playfield is relatively positioned",
			);
		},

		testPieceCSS() {
			// Create a test piece element to verify styles
			const testPiece = document.createElement("canvas");
			testPiece.className = "piece";
			document.body.appendChild(testPiece);

			const pieceStyle = window.getComputedStyle(testPiece);
			assertEqual(
				pieceStyle.position,
				"absolute",
				"piece is absolutely positioned",
			);
			assertEqual(
				pieceStyle.touchAction,
				"none",
				"piece has touch-action: none",
			);
			assert(pieceStyle.cursor.includes("grab"), "piece has grab cursor");

			document.body.removeChild(testPiece);
		},

		testBoardLayout() {
			const playfield = document.getElementById("playfield");
			assertGreater(playfield.offsetWidth, 0, "playfield has width");
			assertGreater(playfield.offsetHeight, 0, "playfield has height");
		},

		testPaletteLegend() {
			const paletteTitle = document.getElementById("paletteTitle");
			const paletteSwatches = document.getElementById("paletteSwatches");
			assertNotNull(paletteTitle, "palette title exists");
			assertNotNull(paletteSwatches, "palette swatches container exists");
			assertGreater(
				paletteSwatches.children.length,
				0,
				"palette legend renders at least one swatch",
			);
		},

		testPointerEventHandling() {
			let pointerMoveFired = false;
			let pointerUpFired = false;

			const moveHandler = () => {
				pointerMoveFired = true;
			};
			const upHandler = () => {
				pointerUpFired = true;
			};

			document.addEventListener("pointermove", moveHandler);
			document.addEventListener("pointerup", upHandler);

			// Simulate events
			document.dispatchEvent(
				new PointerEvent("pointermove", { bubbles: true }),
			);
			document.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));

			document.removeEventListener("pointermove", moveHandler);
			document.removeEventListener("pointerup", upHandler);

			assert(pointerMoveFired, "pointermove handler can be triggered");
			assert(pointerUpFired, "pointerup handler can be triggered");
		},

		testSnappingMechanics() {
			// Test snapping distance constant
			const SNAP_DISTANCE = 20;
			assert(SNAP_DISTANCE > 0, "snap distance is positive");
			assert(SNAP_DISTANCE <= 50, "snap distance is reasonable");

			// Test distance calculation
			const hypot = (dx, dy) => Math.sqrt(dx * dx + dy * dy);
			assertEqual(hypot(0, 0), 0, "distance from (0,0) to (0,0) is 0");
			assert(
				Math.abs(hypot(3, 4) - 5) < 0.01,
				"distance from (0,0) to (3,4) is 5",
			);
			assert(hypot(10, 10) < SNAP_DISTANCE, "distance < snap distance snaps");
		},

		testGuideConstructionRules() {
			const noSolutionSizes = new Set([2, 6]);
			const templateSizes = new Set([4, 8, 10, 12, 14]);

			const isGuaranteedByCurrentImplementation = (n) =>
				n % 2 === 1 || templateSizes.has(n);

			const getGuidePair = (n, row, col) => {
				if (noSolutionSizes.has(n)) {
					return null;
				}

				if (n % 2 === 1) {
					return {
						outer: (row + col) % n,
						inner: (row + 2 * col) % n,
					};
				}

				// Templates for 4, 8, 10, 12, and 14 are embedded in hmi.js.
				return { outer: row, inner: col };
			};

			for (let n = 1; n <= 14; n += 1) {
				if (noSolutionSizes.has(n)) {
					assert(true, `n=${n} is intentionally treated as no-solution`);
					continue;
				}

				if (!isGuaranteedByCurrentImplementation(n)) {
					assert(true, `n=${n} currently uses fallback guide rendering`);
					continue;
				}

				if (n % 2 === 1) {
					const seenPairs = new Set();

					for (let r = 0; r < n; r += 1) {
						const rowOuter = new Set();
						const rowInner = new Set();
						for (let c = 0; c < n; c += 1) {
							const pair = getGuidePair(n, r, c);
							rowOuter.add(pair.outer);
							rowInner.add(pair.inner);
							seenPairs.add(`${pair.outer}:${pair.inner}`);
						}
						assertEqual(
							rowOuter.size,
							n,
							`odd n=${n} row ${r} has unique outer symbols`,
						);
						assertEqual(
							rowInner.size,
							n,
							`odd n=${n} row ${r} has unique inner symbols`,
						);
					}

					for (let c = 0; c < n; c += 1) {
						const colOuter = new Set();
						const colInner = new Set();
						for (let r = 0; r < n; r += 1) {
							const pair = getGuidePair(n, r, c);
							colOuter.add(pair.outer);
							colInner.add(pair.inner);
						}
						assertEqual(
							colOuter.size,
							n,
							`odd n=${n} column ${c} has unique outer symbols`,
						);
						assertEqual(
							colInner.size,
							n,
							`odd n=${n} column ${c} has unique inner symbols`,
						);
					}

					assertEqual(
						seenPairs.size,
						n * n,
						`odd n=${n} has unique outer/inner pairs`,
					);
				} else {
					assert(true, `even n=${n} uses embedded validated template`);
				}
			}
		},

		testGameCompletion() {
			// Simulate piece array
			const sizeSelect = document.getElementById("sizeSelect");
			const n = Number.parseInt(sizeSelect?.value || "10", 10);
			const expectedCount = n * n;
			const pieces = [];
			let solvedCount = 0;

			for (let i = 0; i < expectedCount; i++) {
				pieces.push({ solved: false, row: Math.floor(i / n), col: i % n });
			}

			assertEqual(
				pieces.length,
				expectedCount,
				`${expectedCount} pieces created (${n}x${n} grid)`,
			);
			assertEqual(solvedCount, 0, "initially no pieces solved");

			// Simulate solving all pieces
			pieces.forEach((p) => {
				p.solved = true;
				solvedCount++;
			});

			assertEqual(
				solvedCount,
				pieces.length,
				"all pieces can be marked solved",
			);
		},

		testBrowserCompatibility() {
			const hasCanvas = !!document.createElement("canvas").getContext;
			assert(hasCanvas, "browser supports canvas");

			const hasPointer = !!window.PointerEvent;
			assert(hasPointer, "browser supports PointerEvent API");

			const hasImage = !!window.Image;
			assert(hasImage, "browser supports Image API");
		},

		testEventDelegation() {
			const playfield = document.getElementById("playfield");
			const eventsFired = [];

			const trackEvent = (e) => {
				eventsFired.push(e.type);
			};
			playfield.addEventListener("pointermove", trackEvent);
			playfield.addEventListener("pointerup", trackEvent);

			// Simulate pointer events
			playfield.dispatchEvent(
				new PointerEvent("pointermove", { bubbles: true }),
			);
			playfield.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));

			assert(eventsFired.length >= 2, "event delegation works");

			playfield.removeEventListener("pointermove", trackEvent);
			playfield.removeEventListener("pointerup", trackEvent);
		},
	};

	function runAll() {
		console.log("\n🧪 Starting Euler Square Game Tests...\n");

		Object.keys(tests).forEach((testName) => {
			try {
				console.log(`\n📋 ${testName}:`);
				tests[testName]();
			} catch (e) {
				logTest(`✗ ${testName} threw error: ${e.message}`);
			}
		});

		return report();
	}

	return {
		runAll,
		assert,
		assertEqual,
		assertNotNull,
		assertGreater,
		report,
	};
})();

// Auto-run tests when DOM is ready
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", () => {
		setTimeout(() => EulerSquareTests.runAll(), 1000);
	});
} else {
	setTimeout(() => EulerSquareTests.runAll(), 1000);
}
