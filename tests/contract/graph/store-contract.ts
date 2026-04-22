/**
 * Shared `Store` contract suite.
 *
 * Every adapter that implements `Store` must pass these tests. The runner
 * is a function (not a top-level describe) so each adapter's
 * `*.contract.test.ts` file calls it with a fresh factory.
 *
 * NOT a `*.test.ts` file by name → vitest will not auto-discover it.
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  ConcurrencyConflictError,
  type Graph,
  GraphImmutableError,
  type Machine,
  type Store,
} from "../../../src/graph/index.js";

const sampleGraph: Graph = {
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
    graphId: sampleGraph.id,
    graphVersion: sampleGraph.version,
    revision: 0,
    state: "A",
    context: {},
    meta: {},
    ...overrides,
  };
}

export function runStoreContract(name: string, makeStore: () => Store): void {
  describe(`${name} (Store contract)`, () => {
    let store: Store;
    beforeEach(() => {
      store = makeStore();
    });

    describe("graphs", () => {
      it("round-trips a graph by (id, version)", async () => {
        await store.saveGraph(sampleGraph);
        const loaded = await store.loadGraph(sampleGraph.id, sampleGraph.version);
        expect(loaded).toEqual(sampleGraph);
      });

      it("returns null for unknown (id, version)", async () => {
        expect(await store.loadGraph("missing", "1.0.0")).toBeNull();
      });

      it("treats version as part of the key — same id, different version is a different graph", async () => {
        const v1 = { ...sampleGraph, version: "1.0.0" };
        const v2 = { ...sampleGraph, version: "2.0.0" };
        await store.saveGraph(v1);
        await store.saveGraph(v2);
        expect(await store.loadGraph(sampleGraph.id, "1.0.0")).toEqual(v1);
        expect(await store.loadGraph(sampleGraph.id, "2.0.0")).toEqual(v2);
      });

      it("second saveGraph with the same key and SAME content is a no-op", async () => {
        await store.saveGraph(sampleGraph);
        await expect(store.saveGraph(sampleGraph)).resolves.not.toThrow();
        const loaded = await store.loadGraph(sampleGraph.id, sampleGraph.version);
        expect(loaded).toEqual(sampleGraph);
      });

      it("second saveGraph with the same key and DIFFERENT content throws GraphImmutableError", async () => {
        await store.saveGraph(sampleGraph);
        const drifted: Graph = {
          ...sampleGraph,
          states: [...sampleGraph.states, { id: "Extra" }],
        };
        await expect(store.saveGraph(drifted)).rejects.toBeInstanceOf(GraphImmutableError);
        // Original content remains intact:
        const loaded = await store.loadGraph(sampleGraph.id, sampleGraph.version);
        expect(loaded).toEqual(sampleGraph);
      });
    });

    describe("machines — insert", () => {
      it("inserts when no record exists and revision is 0", async () => {
        const m = makeMachine();
        await store.saveMachine(m);
        expect(await store.loadMachine(m.id)).toEqual(m);
      });

      it("rejects insert when revision is not 0", async () => {
        await expect(store.saveMachine(makeMachine({ revision: 1 }))).rejects.toBeInstanceOf(
          ConcurrencyConflictError,
        );
      });

      it("rejects a second insert at revision 0 when the id already exists", async () => {
        await store.saveMachine(makeMachine());
        await expect(store.saveMachine(makeMachine())).rejects.toBeInstanceOf(
          ConcurrencyConflictError,
        );
      });
    });

    describe("machines — update", () => {
      it("updates when stored.revision === incoming.revision - 1", async () => {
        await store.saveMachine(makeMachine({ revision: 0 }));
        const next = makeMachine({ revision: 1, state: "B" });
        await store.saveMachine(next);
        expect(await store.loadMachine(next.id)).toEqual(next);
      });

      it("rejects a write equal to stored.revision (replay)", async () => {
        await store.saveMachine(makeMachine({ revision: 0 }));
        await store.saveMachine(makeMachine({ revision: 1, state: "B" }));
        await expect(
          store.saveMachine(makeMachine({ revision: 1, state: "B" })),
        ).rejects.toBeInstanceOf(ConcurrencyConflictError);
      });

      it("rejects a write older than stored.revision (regression)", async () => {
        await store.saveMachine(makeMachine({ revision: 0 }));
        await store.saveMachine(makeMachine({ revision: 1, state: "B" }));
        await store.saveMachine(makeMachine({ revision: 2, state: "B" }));
        await expect(
          store.saveMachine(makeMachine({ revision: 1, state: "B" })),
        ).rejects.toBeInstanceOf(ConcurrencyConflictError);
      });

      it("rejects a skip-ahead write (incoming.revision > stored.revision + 1)", async () => {
        await store.saveMachine(makeMachine({ revision: 0 }));
        await expect(
          store.saveMachine(makeMachine({ revision: 5, state: "B" })),
        ).rejects.toBeInstanceOf(ConcurrencyConflictError);
      });
    });

    describe("loadMachine", () => {
      it("returns null for unknown id", async () => {
        expect(await store.loadMachine("missing")).toBeNull();
      });

      it("isolates machines by id — loading m-2 returns m-2, not m-1", async () => {
        await store.saveMachine(makeMachine({ id: "m-1", state: "A" }));
        await store.saveMachine(makeMachine({ id: "m-2", state: "A" }));
        const a = await store.loadMachine("m-1");
        const b = await store.loadMachine("m-2");
        expect(a?.id).toBe("m-1");
        expect(b?.id).toBe("m-2");
      });
    });

    describe("opacity / isolation", () => {
      it("mutating a machine after save does not corrupt the store", async () => {
        const m = makeMachine({ context: { brief: "X" } });
        await store.saveMachine(m);
        m.state = "MUTATED";
        (m.context as Record<string, unknown>).brief = "Y";
        const loaded = await store.loadMachine(m.id);
        expect(loaded?.state).toBe("A");
        expect((loaded?.context as Record<string, unknown>).brief).toBe("X");
      });

      it("mutating a graph after save does not corrupt the store", async () => {
        const g: Graph = structuredClone(sampleGraph);
        await store.saveGraph(g);
        g.states.push({ id: "MUTATED" });
        const loaded = await store.loadGraph(g.id, g.version);
        expect(loaded?.states.map((s) => s.id)).toEqual(["A", "B", "Done"]);
      });

      it("mutating a loaded machine does not affect subsequent loads", async () => {
        await store.saveMachine(makeMachine({ context: { brief: "X" } }));
        const first = await store.loadMachine("m-1");
        if (first === null) throw new Error("expected machine");
        first.state = "MUTATED";
        (first.context as Record<string, unknown>).brief = "Y";
        const second = await store.loadMachine("m-1");
        expect(second?.state).toBe("A");
        expect((second?.context as Record<string, unknown>).brief).toBe("X");
      });

      it("mutating a loaded graph does not affect subsequent loads", async () => {
        await store.saveGraph(sampleGraph);
        const first = await store.loadGraph(sampleGraph.id, sampleGraph.version);
        if (first === null) throw new Error("expected graph");
        first.states.push({ id: "MUTATED" });
        const second = await store.loadGraph(sampleGraph.id, sampleGraph.version);
        expect(second?.states.map((s) => s.id)).toEqual(["A", "B", "Done"]);
      });

      it("preserves arbitrary payload shapes in machine.context", async () => {
        const exotic = {
          nested: { deeply: { ok: true } },
          list: [1, "two", null, false],
        };
        const m = makeMachine({ context: { go: exotic } });
        await store.saveMachine(m);
        const loaded = await store.loadMachine(m.id);
        expect(loaded?.context).toEqual({ go: exotic });
      });
    });

    describe("error shape", () => {
      it("ConcurrencyConflictError carries code, machineId, and revisions", async () => {
        await store.saveMachine(makeMachine({ revision: 0 }));
        try {
          await store.saveMachine(makeMachine({ revision: 5 }));
          throw new Error("expected to throw");
        } catch (err) {
          expect(err).toBeInstanceOf(ConcurrencyConflictError);
          const e = err as ConcurrencyConflictError;
          expect(e.code).toBe("ERR_CONCURRENCY_CONFLICT");
          expect(e.machineId).toBe("m-1");
          expect(e.attemptedRevision).toBe(5);
          expect(e.storedRevision).toBe(0);
        }
      });
    });
  });
}
