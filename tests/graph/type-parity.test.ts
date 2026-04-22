/**
 * Compile-time guard that the hand-written domain types in `types.ts`
 * stay structurally equal to what the Zod schemas in `schemas.ts` infer.
 *
 * If they diverge, the `_…Parity` lines below fail to compile — vitest never
 * even runs. The runtime test is a placeholder so vitest reports the file.
 */

import { describe, expect, it } from "vitest";
import type { z } from "zod";
import {
  type Event,
  type Graph,
  type Machine,
  type State,
  type Transition,
  eventSchema,
  graphSchema,
  machineSchema,
  stateSchema,
  transitionSchema,
} from "../../src/graph/index.js";

type Equals<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;
type Assert<T extends true> = T;

// If any of these fail, the schema and the hand-written type have drifted.
type _EventParity = Assert<Equals<z.infer<typeof eventSchema>, Event>>;
type _StateParity = Assert<Equals<z.infer<typeof stateSchema>, State>>;
type _TransitionParity = Assert<Equals<z.infer<typeof transitionSchema>, Transition>>;
type _GraphParity = Assert<Equals<z.infer<typeof graphSchema>, Graph>>;
type _MachineParity = Assert<Equals<z.infer<typeof machineSchema>, Machine>>;

describe("type/schema parity", () => {
  it("schemas and hand-written types stay structurally equal (enforced at compile time)", () => {
    expect(true).toBe(true);
  });
});
