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

      it("second saveGraph with the same key does not throw and is observable on load", async () => {
        await store.saveGraph(sampleGraph);
        await expect(store.saveGraph(sampleGraph)).resolves.not.toThrow();
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

      it("rejects a stale write (incoming.revision <= stored.revision)", async () => {
        await store.saveMachine(makeMachine({ revision: 0 }));
        await store.saveMachine(makeMachine({ revision: 1, state: "B" }));
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
