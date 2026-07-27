(() => {
  const harness = window.EulerSquareTestHarness;
  const uiConstants = window.EulerSquareUiConstants;

  if (!harness || !uiConstants) {
    return;
  }

  const { assert, assertEqual, assertNotNull, registerSuite } = harness;

  registerSuite("ui-constants", {
    exposesExpectedApi() {
      assertNotNull(uiConstants.DOM_IDS, "DOM_IDS exists");
      assertNotNull(uiConstants.OVERLAY_PAGES, "OVERLAY_PAGES exists");
      assertNotNull(uiConstants.UI_LABELS, "UI_LABELS exists");
      assertNotNull(uiConstants.UI_BEHAVIOR, "UI_BEHAVIOR exists");
      assertNotNull(uiConstants.STATUS_TEXT, "STATUS_TEXT exists");
    },

    providesUiLabelsAndStatusTokens() {
      assertEqual(uiConstants.UI_LABELS.showGuide, "Show Guide", "show guide label token");
      assertEqual(uiConstants.UI_LABELS.hideGuide, "Hide Guide", "hide guide label token");

      const requiredStatusKeys = [
        "preparing",
        "solved",
        "invalidSolved",
        "tilesPlacedSuffix",
        "dragPrefix",
        "genericTilesSuffix",
        "uniqueTilesSuffix",
        "noSolutionSuffix",
      ];

      requiredStatusKeys.forEach((key) => {
        const token = uiConstants.STATUS_TEXT[key];
        assertEqual(typeof token, "string", `STATUS_TEXT.${key} is string`);
        assert(token.length > 0, `STATUS_TEXT.${key} is non-empty`);
      });

      assertEqual(uiConstants.UI_BEHAVIOR.SNAP_DISTANCE, 20, "SNAP_DISTANCE constant is stable");
    },
  });
})();
