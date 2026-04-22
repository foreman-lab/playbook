import { describe, expect, it } from "vitest";
import {
  eventSchema,
  InvalidDefinitionError,
  machineDefinitionSchema,
  machineSchema,
  stateSchema,
  transitionSchema,
  validateMachineDefinition,
} from "../../src/graph/index.js";

describe("eventSchema", () => {
  it("accepts a minimal event", () => {
    const r = eventSchema.safeParse({ type: "plan", payload: {} });
    expect(r.success).toBe(true);
  });

  it("rejects empty event type", () => {
    const r = eventSchema.safeParse({ type: "", payload: {} });
    expect(r.success).toBe(false);
  });

  it("preserves extra fields in the open envelope", () => {
    const r = eventSchema.safeParse({
      type: "plan",
      payload: {},
      timestamp: "2026-04-22T00:00:00Z",
      correlationId: "abc-123",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.timestamp).toBe("2026-04-22T00:00:00Z");
      expect(r.data.correlationId).toBe("abc-123");
    }
  });

  it("accepts arbitrary payload shapes", () => {
    for (const payload of [null, "x", 42, [1, 2], { nested: { ok: true } }]) {
      const r = eventSchema.safeParse({ type: "x", payload });
      expect(r.success).toBe(true);
    }
  });
});

describe("stateSchema", () => {
  it("accepts a minimal state", () => {
    expect(stateSchema.safeParse({ id: "Initializing" }).success).toBe(true);
  });

  it("accepts a full state", () => {
    const r = stateSchema.safeParse({
      id: "Done",
      label: "Completed",
      terminal: true,
      meta: { color: "green" },
    });
    expect(r.success).toBe(true);
  });

  it("rejects empty id", () => {
    expect(stateSchema.safeParse({ id: "" }).success).toBe(false);
  });
});

describe("transitionSchema", () => {
  it("accepts a minimal transition", () => {
    expect(transitionSchema.safeParse({ from: "A", event: "go", to: "B" }).success).toBe(true);
  });

  it("rejects empty event name", () => {
    expect(transitionSchema.safeParse({ from: "A", event: "", to: "B" }).success).toBe(false);
  });
});

describe("machineDefinitionSchema (basic)", () => {
  const valid = {
    id: "lifecycle",
    version: "1.0.0",
    initialState: "A",
    states: [{ id: "A" }, { id: "B" }, { id: "Done", terminal: true }],
    transitions: [
      { from: "A", event: "go", to: "B" },
      { from: "B", event: "finish", to: "Done" },
    ],
  };

  it("accepts a valid definition", () => {
    expect(machineDefinitionSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects empty states[]", () => {
    expect(machineDefinitionSchema.safeParse({ ...valid, states: [] }).success).toBe(false);
  });

  it("rejects empty version", () => {
    expect(machineDefinitionSchema.safeParse({ ...valid, version: "" }).success).toBe(false);
  });
});

describe("validateMachineDefinition (cross-field validation)", () => {
  const base = {
    id: "lifecycle",
    version: "1.0.0",
    initialState: "A",
    states: [{ id: "A" }, { id: "B" }],
    transitions: [{ from: "A", event: "go", to: "B" }],
  };

  it("returns the parsed definition on success", () => {
    const result = validateMachineDefinition(base);
    expect(result.id).toBe("lifecycle");
    expect(result.states).toHaveLength(2);
  });

  it("rejects duplicate state ids", () => {
    expect(() =>
      validateMachineDefinition({
        ...base,
        states: [{ id: "A" }, { id: "A" }],
      }),
    ).toThrow(InvalidDefinitionError);
  });

  it("rejects initialState not in states[]", () => {
    expect(() => validateMachineDefinition({ ...base, initialState: "Missing" })).toThrow(
      InvalidDefinitionError,
    );
  });

  it("rejects transition.from referencing unknown state", () => {
    expect(() =>
      validateMachineDefinition({
        ...base,
        transitions: [{ from: "Ghost", event: "go", to: "B" }],
      }),
    ).toThrow(InvalidDefinitionError);
  });

  it("rejects transition.to referencing unknown state", () => {
    expect(() =>
      validateMachineDefinition({
        ...base,
        transitions: [{ from: "A", event: "go", to: "Ghost" }],
      }),
    ).toThrow(InvalidDefinitionError);
  });

  it("collects multiple issues into one error", () => {
    try {
      validateMachineDefinition({
        ...base,
        initialState: "Missing",
        transitions: [
          { from: "Ghost", event: "go", to: "B" },
          { from: "A", event: "go", to: "Phantom" },
        ],
      });
      throw new Error("expected to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidDefinitionError);
      const error = err as InvalidDefinitionError;
      expect(error.issues.length).toBeGreaterThanOrEqual(3);
      expect(error.code).toBe("ERR_INVALID_DEFINITION");
    }
  });
});

describe("machineSchema", () => {
  it("accepts a valid machine", () => {
    const r = machineSchema.safeParse({
      id: "m-1",
      definitionId: "lifecycle",
      definitionVersion: "1.0.0",
      revision: 0,
      state: "A",
      context: {},
      meta: {},
    });
    expect(r.success).toBe(true);
  });

  it("rejects negative revision", () => {
    const r = machineSchema.safeParse({
      id: "m-1",
      definitionId: "lifecycle",
      definitionVersion: "1.0.0",
      revision: -1,
      state: "A",
      context: {},
      meta: {},
    });
    expect(r.success).toBe(false);
  });

  it("rejects non-integer revision", () => {
    const r = machineSchema.safeParse({
      id: "m-1",
      definitionId: "lifecycle",
      definitionVersion: "1.0.0",
      revision: 1.5,
      state: "A",
      context: {},
      meta: {},
    });
    expect(r.success).toBe(false);
  });
});
