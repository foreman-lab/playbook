// Graph module — public surface (the state-machine engine).
// See: https://github.com/foreman-lab/handbook/blob/main/architecture.md

export type { Event, Machine, MachineDefinition, State, StateId, Transition } from "./types.js";

export {
  GraphError,
  InvalidDefinitionError,
  NoMatchingTransitionError,
  TerminalStateError,
  UnknownStateError,
} from "./errors.js";

export {
  eventSchema,
  machineDefinitionSchema,
  machineSchema,
  stateSchema,
  transitionSchema,
  validateMachineDefinition,
} from "./schemas.js";

export { transition } from "./transition.js";
