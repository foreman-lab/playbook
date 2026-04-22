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
    super("ERR_UNKNOWN_STATE", `Machine state "${state}" is not present in the supplied graph.`);
    this.name = "UnknownStateError";
  }
}

export class ConcurrencyConflictError extends GraphError {
  readonly machineId: string;
  readonly attemptedRevision: number;
  readonly storedRevision: number | null;

  constructor(machineId: string, attemptedRevision: number, storedRevision: number | null) {
    super(
      "ERR_CONCURRENCY_CONFLICT",
      `Concurrency conflict for machine "${machineId}": attempted revision ${attemptedRevision}, stored revision ${storedRevision ?? "(none)"}.`,
    );
    this.name = "ConcurrencyConflictError";
    this.machineId = machineId;
    this.attemptedRevision = attemptedRevision;
    this.storedRevision = storedRevision;
  }
}

export class GraphImmutableError extends GraphError {
  readonly graphId: string;
  readonly graphVersion: string;

  constructor(graphId: string, graphVersion: string) {
    super(
      "ERR_GRAPH_IMMUTABLE",
      `Graph "${graphId}@${graphVersion}" is already saved with different content. Bump the version to publish a change.`,
    );
    this.name = "GraphImmutableError";
    this.graphId = graphId;
    this.graphVersion = graphVersion;
  }
}

export class InvalidGraphError extends GraphError {
  readonly issues: ReadonlyArray<string>;

  constructor(issues: ReadonlyArray<string>) {
    super("ERR_INVALID_GRAPH", `Invalid graph: ${issues.join("; ")}`);
    this.name = "InvalidGraphError";
    this.issues = issues;
  }
}
