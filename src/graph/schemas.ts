/**
 * Zod schemas for runtime validation of graph types.
 *
 * The engine validates only at boundaries (graphs on register, events on dispatch).
 * Once validated, callers can trust the shape and rely on the type declarations in `types.ts`.
 */

import { z } from "zod";
import { InvalidGraphError } from "./errors.js";
import type { Graph } from "./types.js";

const stateIdSchema = z.string().min(1);

/**
 * Event envelope is open by design: callers MAY include extra fields
 * (timestamp, correlationId, source). The engine reads only `type` + `payload`.
 */
export const eventSchema = z
  .object({
    type: z.string().min(1),
    payload: z.unknown(),
  })
  .passthrough();

export const stateSchema = z.object({
  id: stateIdSchema,
  label: z.string().min(1).optional(),
  terminal: z.boolean().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export const transitionSchema = z.object({
  from: stateIdSchema,
  event: z.string().min(1),
  to: stateIdSchema,
  label: z.string().min(1).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export const graphSchema = z
  .object({
    id: z.string().min(1),
    version: z.string().min(1),
    initialState: stateIdSchema,
    states: z.array(stateSchema).min(1),
    transitions: z.array(transitionSchema),
  })
  .superRefine((def, ctx) => {
    const seen = new Set<string>();
    for (const state of def.states) {
      if (seen.has(state.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate state id "${state.id}"`,
          path: ["states"],
        });
      }
      seen.add(state.id);
    }
    if (!seen.has(def.initialState)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `initialState "${def.initialState}" not found in states[]`,
        path: ["initialState"],
      });
    }
    for (let i = 0; i < def.transitions.length; i++) {
      const t = def.transitions[i]!;
      if (!seen.has(t.from)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `transitions[${i}].from "${t.from}" not found in states[]`,
          path: ["transitions", i, "from"],
        });
      }
      if (!seen.has(t.to)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `transitions[${i}].to "${t.to}" not found in states[]`,
          path: ["transitions", i, "to"],
        });
      }
    }
  });

export const machineSchema = z.object({
  id: z.string().min(1),
  graphId: z.string().min(1),
  graphVersion: z.string().min(1),
  revision: z.number().int().nonnegative(),
  state: stateIdSchema,
  context: z.record(z.string(), z.unknown()),
  meta: z.record(z.string(), z.unknown()),
});

/**
 * Validates a graph.
 * Throws `InvalidGraphError` if invalid; returns the parsed value otherwise.
 */
export function validateGraph(value: unknown): Graph {
  const result = graphSchema.safeParse(value);
  if (!result.success) {
    const issues = result.error.issues.map(
      (i) => `${i.path.length > 0 ? i.path.join(".") + ": " : ""}${i.message}`,
    );
    throw new InvalidGraphError(issues);
  }
  return result.data as Graph;
}
