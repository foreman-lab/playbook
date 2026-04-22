import { describe, expect, it } from "vitest";
import { GRAPH_MODULE_VERSION } from "../../src/graph/index.js";

describe("graph module placeholder", () => {
  it("exposes a module-version string", () => {
    expect(typeof GRAPH_MODULE_VERSION).toBe("string");
  });

  it("module-version follows semver", () => {
    expect(GRAPH_MODULE_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
