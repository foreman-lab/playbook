/**
 * Pure transition function.
 *
 * Given a machine, an event, and the machine's graph, returns the new machine
 * state with:
 *   1. payload stored in context[event.type]   (update step)
 *   2. state advanced per the graph's transition table  (transition step)
 *   3. revision incremented by 1
 *
 * Throws when the machine is in a terminal state, when no transition rule matches,
 * or when the machine's current state is not present in the graph.
 */

import { NoMatchingTransitionError, TerminalStateError, UnknownStateError } from "./errors.js";
import type { Event, Graph, Machine, State } from "./types.js";

export function transition(machine: Machine, event: Event, graph: Graph): Machine {
  const currentState = findState(graph, machine.state);
  if (currentState === null) {
    throw new UnknownStateError(machine.state);
  }
  if (currentState.terminal === true) {
    throw new TerminalStateError(machine.state);
  }

  const rule = graph.transitions.find((t) => t.from === machine.state && t.event === event.type);
  if (rule === undefined) {
    throw new NoMatchingTransitionError(machine.state, event.type);
  }

  return {
    ...machine,
    state: rule.to,
    context: { ...machine.context, [event.type]: event.payload },
    revision: machine.revision + 1,
  };
}

function findState(graph: Graph, stateId: string): State | null {
  return graph.states.find((s) => s.id === stateId) ?? null;
}
