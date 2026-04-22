/**
 * Pure transition function.
 *
 * Given a machine, an event, and the machine's definition, returns the new machine
 * state with:
 *   1. payload stored in context[event.type]   (update step)
 *   2. state advanced per the definition's transition table  (transition step)
 *   3. revision incremented by 1
 *
 * Throws when the machine is in a terminal state, when no transition rule matches,
 * or when the machine's current state is not present in the definition.
 */

import { NoMatchingTransitionError, TerminalStateError, UnknownStateError } from "./errors.js";
import type { Event, Machine, MachineDefinition, State } from "./types.js";

export function transition(machine: Machine, event: Event, definition: MachineDefinition): Machine {
  const currentState = findState(definition, machine.state);
  if (currentState === null) {
    throw new UnknownStateError(machine.state);
  }
  if (currentState.terminal === true) {
    throw new TerminalStateError(machine.state);
  }

  const rule = definition.transitions.find(
    (t) => t.from === machine.state && t.event === event.type,
  );
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

function findState(definition: MachineDefinition, stateId: string): State | null {
  return definition.states.find((s) => s.id === stateId) ?? null;
}
