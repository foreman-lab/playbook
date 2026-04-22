import { describe, expect, it } from "vitest";
import { STATE_MACHINE_MODULE_VERSION } from "../../src/state-machine/index.js";

describe("state-machine module placeholder", () => {
  it("exposes a module-version string", () => {
    expect(typeof STATE_MACHINE_MODULE_VERSION).toBe("string");
  });

  it("module-version follows semver", () => {
    expect(STATE_MACHINE_MODULE_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
