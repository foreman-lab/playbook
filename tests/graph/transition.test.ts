import { describe, expect, it } from "vitest";
import {
  type Event,
  type Machine,
  type MachineDefinition,
  NoMatchingTransitionError,
  TerminalStateError,
  transition,
  UnknownStateError,
} from "../../src/graph/index.js";

const lifecycle: MachineDefinition = {
  id: "lifecycle",
  version: "1.0.0",
  initialState: "A",
  states: [{ id: "A" }, { id: "B" }, { id: "Done", terminal: true }],
  transitions: [
    { from: "A", event: "go", to: "B" },
    { from: "B", event: "finish", to: "Done" },
  ],
};

function makeMachine(overrides: Partial<Machine> = {}): Machine {
  return {
    id: "m-1",
    definitionId: lifecycle.id,
    definitionVersion: lifecycle.version,
    revision: 0,
    state: "A",
    context: {},
    meta: {},
    ...overrides,
  };
}

function event(type: string, payload: unknown = {}): Event {
  return { type, payload };
}

describe("transition — happy paths", () => {
  it("advances state per the rule table", () => {
    const m = makeMachine();
    const next = transition(m, event("go"), lifecycle);
    expect(next.state).toBe("B");
  });

  it("increments revision by exactly 1", () => {
    const m = makeMachine({ revision: 7 });
    const next = transition(m, event("go"), lifecycle);
    expect(next.revision).toBe(8);
  });

  it("stores payload in context keyed by event.type", () => {
    const m = makeMachine();
    const next = transition(m, event("go", { steps: ["a", "b"] }), lifecycle);
    expect(next.context.go).toEqual({ steps: ["a", "b"] });
  });

  it("preserves prior context entries", () => {
    const m = makeMachine({ context: { initialize: { brief: "X" } } });
    const next = transition(m, event("go", { plan: "Y" }), lifecycle);
    expect(next.context.initialize).toEqual({ brief: "X" });
    expect(next.context.go).toEqual({ plan: "Y" });
  });

  it("overwrites context entry when same event type fires twice", () => {
    const m = makeMachine({ context: { go: "first" } });
    const next = transition(m, event("go", "second"), lifecycle);
    expect(next.context.go).toBe("second");
  });

  it("preserves machine id, definitionId, definitionVersion, meta", () => {
    const m = makeMachine({ meta: { iter: 1 } });
    const next = transition(m, event("go"), lifecycle);
    expect(next.id).toBe(m.id);
    expect(next.definitionId).toBe(m.definitionId);
    expect(next.definitionVersion).toBe(m.definitionVersion);
    expect(next.meta).toEqual({ iter: 1 });
  });

  it("does not mutate the input machine", () => {
    const m = makeMachine({ context: { initialize: { x: 1 } } });
    const snapshot = JSON.stringify(m);
    transition(m, event("go", { y: 2 }), lifecycle);
    expect(JSON.stringify(m)).toBe(snapshot);
  });

  it("does not mutate the input event", () => {
    const e = event("go", { x: 1 });
    const snapshot = JSON.stringify(e);
    transition(makeMachine(), e, lifecycle);
    expect(JSON.stringify(e)).toBe(snapshot);
  });

  it("does not mutate the input definition", () => {
    const snapshot = JSON.stringify(lifecycle);
    transition(makeMachine(), event("go"), lifecycle);
    expect(JSON.stringify(lifecycle)).toBe(snapshot);
  });

  it("traverses A → B → Done", () => {
    const m0 = makeMachine();
    const m1 = transition(m0, event("go"), lifecycle);
    const m2 = transition(m1, event("finish"), lifecycle);
    expect(m2.state).toBe("Done");
    expect(m2.revision).toBe(2);
  });
});

describe("transition — invalid events", () => {
  it("rejects an event with no matching rule from current state", () => {
    const m = makeMachine();
    expect(() => transition(m, event("finish"), lifecycle)).toThrow(NoMatchingTransitionError);
  });

  it("rejects an unknown event type", () => {
    const m = makeMachine();
    expect(() => transition(m, event("nonsense"), lifecycle)).toThrow(NoMatchingTransitionError);
  });

  it("does not advance state on rejection", () => {
    const m = makeMachine();
    try {
      transition(m, event("finish"), lifecycle);
    } catch {
      // expected
    }
    expect(m.state).toBe("A");
    expect(m.revision).toBe(0);
  });

  it("error carries the right code and references state + event", () => {
    const m = makeMachine();
    try {
      transition(m, event("nonsense"), lifecycle);
      throw new Error("expected to throw");
    } catch (err) {
      const e = err as NoMatchingTransitionError;
      expect(e.code).toBe("ERR_NO_MATCHING_TRANSITION");
      expect(e.message).toContain("A");
      expect(e.message).toContain("nonsense");
    }
  });
});

describe("transition — terminal rejection", () => {
  it("rejects any event when machine is in a terminal state", () => {
    const m = makeMachine({ state: "Done" });
    expect(() => transition(m, event("anything"), lifecycle)).toThrow(TerminalStateError);
  });

  it("error carries the right code and identifies the terminal state", () => {
    const m = makeMachine({ state: "Done" });
    try {
      transition(m, event("go"), lifecycle);
      throw new Error("expected to throw");
    } catch (err) {
      const e = err as TerminalStateError;
      expect(e.code).toBe("ERR_TERMINAL_STATE");
      expect(e.message).toContain("Done");
    }
  });
});

describe("transition — unknown state", () => {
  it("rejects when machine.state is not in definition.states", () => {
    const m = makeMachine({ state: "Ghost" });
    expect(() => transition(m, event("go"), lifecycle)).toThrow(UnknownStateError);
  });

  it("error carries the right code and identifies the missing state", () => {
    const m = makeMachine({ state: "Ghost" });
    try {
      transition(m, event("go"), lifecycle);
      throw new Error("expected to throw");
    } catch (err) {
      const e = err as UnknownStateError;
      expect(e.code).toBe("ERR_UNKNOWN_STATE");
      expect(e.message).toContain("Ghost");
    }
  });
});

describe("transition — payload opacity", () => {
  it("round-trips arbitrary payload shapes through context", () => {
    const cases = [null, "string", 42, [1, 2, 3], { nested: { deeply: { ok: true } } }, true];
    for (const payload of cases) {
      const m = makeMachine();
      const next = transition(m, event("go", payload), lifecycle);
      expect(next.context.go).toEqual(payload);
    }
  });

  it("ignores extra fields on the event envelope but stores the payload", () => {
    const m = makeMachine();
    const e: Event = {
      type: "go",
      payload: { plan: "X" },
      timestamp: "2026-04-22T00:00:00Z",
      correlationId: "abc",
    };
    const next = transition(m, e, lifecycle);
    expect(next.context.go).toEqual({ plan: "X" });
  });
});

describe("transition — purity", () => {
  it("same inputs produce the same output (run twice)", () => {
    const m = makeMachine({ revision: 3, context: { initialize: 1 } });
    const e = event("go", { x: 99 });
    const a = transition(m, e, lifecycle);
    const b = transition(m, e, lifecycle);
    expect(a).toEqual(b);
  });
});
