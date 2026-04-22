/**
 * Typed error taxonomy for the graph module.
 * Every domain-thrown error extends GraphError and carries a stable `code`.
 */

export class GraphError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "GraphError";
    this.code = code;
  }
}

export class NoMatchingTransitionError extends GraphError {
  constructor(state: string, eventType: string) {
    super(
      "ERR_NO_MATCHING_TRANSITION",
      `No transition rule for state "${state}" with event "${eventType}".`,
    );
    this.name = "NoMatchingTransitionError";
  }
}

export class TerminalStateError extends GraphError {
  constructor(state: string) {
    super("ERR_TERMINAL_STATE", `Cannot dispatch event: machine is in terminal state "${state}".`);
    this.name = "TerminalStateError";
  }
}

export class UnknownStateError extends GraphError {
  constructor(state: string) {
    super(
      "ERR_UNKNOWN_STATE",
      `Machine state "${state}" is not present in the supplied definition.`,
    );
    this.name = "UnknownStateError";
  }
}

export class InvalidDefinitionError extends GraphError {
  readonly issues: ReadonlyArray<string>;

  constructor(issues: ReadonlyArray<string>) {
    super("ERR_INVALID_DEFINITION", `Invalid machine definition: ${issues.join("; ")}`);
    this.name = "InvalidDefinitionError";
    this.issues = issues;
  }
}
