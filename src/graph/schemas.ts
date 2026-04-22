/**
 * Zod schemas for runtime validation of graph types.
 *
 * The engine validates only at boundaries (graphs on register, events on dispatch).
 * Once validated, callers can trust the shape and rely on the type declarations in `types.ts`.
 */

import { z } from "zod";
import { InvalidGraphError } from "./errors.js";
import type { Graph } from "./types.js";

/**
 * Identifier strings (StateId, graph.id, graph.version, machine.id, event.type)
 * MUST NOT contain ASCII control characters (U+0000–U+001F, U+007F).
 *
 * Why: stores commonly use these strings as keys, sometimes via composite
 * "id\u0000version" join formats. A control char inside a user-supplied id
 * would silently collide with adjacent keys. Free-form fields (labels, meta
 * values) are intentionally NOT subject to this restriction.
 */
// eslint-disable-next-line no-control-regex -- whole point of the regex is to detect control chars
const NO_CONTROL_CHARS = /^[^\u0000-\u001F\u007F]+$/;

const identifierSchema = z
  .string()
  .min(1)
  .regex(NO_CONTROL_CHARS, "must not contain ASCII control characters");

const stateIdSchema = identifierSchema;

/**
 * Event envelope is open by design: callers MAY include extra fields
 * (timestamp, correlationId, source). The engine reads only `type` + `payload`.
 */
export const eventSchema = z.looseObject({
  type: identifierSchema,
  payload: z.unknown(),
});

export const stateSchema = z.object({
  id: stateIdSchema,
  label: z.string().min(1).optional(),
  terminal: z.boolean().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export const transitionSchema = z.object({
  from: stateIdSchema,
  event: identifierSchema,
  to: stateIdSchema,
  label: z.string().min(1).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export const graphSchema = z
  .object({
    id: identifierSchema,
    version: identifierSchema,
    initialState: stateIdSchema,
    states: z.array(stateSchema).min(1),
    transitions: z.array(transitionSchema),
  })
  .superRefine((def, ctx) => {
    const seen = new Set<string>();
    for (const state of def.states) {
      if (seen.has(state.id)) {
        ctx.addIssue({
          code: "custom",
          message: `Duplicate state id "${state.id}"`,
          path: ["states"],
        });
      }
      seen.add(state.id);
    }
    if (!seen.has(def.initialState)) {
      ctx.addIssue({
        code: "custom",
        message: `initialState "${def.initialState}" not found in states[]`,
        path: ["initialState"],
      });
    }
    const ruleKeys = new Set<string>();
    for (let i = 0; i < def.transitions.length; i++) {
      const t = def.transitions[i]!;
      if (!seen.has(t.from)) {
        ctx.addIssue({
          code: "custom",
          message: `transitions[${i}].from "${t.from}" not found in states[]`,
          path: ["transitions", i, "from"],
        });
      }
      if (!seen.has(t.to)) {
        ctx.addIssue({
          code: "custom",
          message: `transitions[${i}].to "${t.to}" not found in states[]`,
          path: ["transitions", i, "to"],
        });
      }
      const key = `${t.from}\u0000${t.event}`;
      if (ruleKeys.has(key)) {
        ctx.addIssue({
          code: "custom",
          message: `duplicate transition rule for (from "${t.from}", event "${t.event}")`,
          path: ["transitions", i],
        });
      }
      ruleKeys.add(key);
    }
  });

export const machineSchema = z.object({
  id: identifierSchema,
  graphId: identifierSchema,
  graphVersion: identifierSchema,
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
