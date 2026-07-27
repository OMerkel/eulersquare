(() => {
  const harness = window.EulerSquareTestHarness;
  const constants = window.EulerSquareConstants;

  if (!harness || !constants) {
    return;
  }

  const { assert, assertEqual, assertNotNull, assertGreater, registerSuite } =
    harness;

  registerSuite("constants", {
    exposesExpectedApi() {
      assertNotNull(constants, "constants module exists");
      assertEqual(typeof constants.GRID_MIN, "number", "GRID_MIN is numeric");
      assertEqual(typeof constants.GRID_MAX, "number", "GRID_MAX is numeric");
      assertEqual(typeof constants.GRID_DEFAULT, "number", "GRID_DEFAULT is numeric");
      assert(constants.NO_SOLUTION_SIZES instanceof Set, "NO_SOLUTION_SIZES is a Set");
      assertEqual(typeof constants.EVEN_GUIDE_TEMPLATES, "object", "EVEN_GUIDE_TEMPLATES exists");
      assert(Array.isArray(constants.BASE_PALETTE), "BASE_PALETTE is an array");
    },

    providesBasePaletteContract() {
      assertGreater(constants.BASE_PALETTE.length, 13, "BASE_PALETTE supports max game size");

      constants.BASE_PALETTE.forEach((color, index) => {
        assertEqual(typeof color, "string", `palette color #${index + 1} is string`);
        assert(/^#[0-9a-fA-F]{6}$/.test(color), `palette color #${index + 1} is #RRGGBB`);
      });
    },
  });
})();
