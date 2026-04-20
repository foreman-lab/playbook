# foreman

MCP harness for AI coding agents. Single-user product: runs a 4-node state machine (init → plan → work → evaluate) that orchestrates a coding agent against a playbook. Ships as one `foreman` CLI binary with two modes:

- **Solo mode** — engine runs in-process, single project, foreground.
- **Daemon mode** — engine runs as a local background service, one user with multiple concurrent projects/sessions. *(Coming in a later milestone.)*

Higher tiers (`team` for LAN multi-user, `cloud` for hosted SaaS) will be separate repos that speak Foreman's MCP/IPC protocol — they do not import Foreman's code. See the [Docker model](https://github.com/foreman-lab/handbook/blob/main/roadmap.md) for the rationale.

## Status

**Pre-alpha.** Repo is freshly seeded; code has not been written yet. The first milestone (bootstrap + core state machine) is being planned.

## Architecture

All architectural material lives in the [handbook](https://github.com/foreman-lab/handbook):

- [`foundations.md`](https://github.com/foreman-lab/handbook/blob/main/foundations.md) — principles (P-1..P-10) and decisions (D-1..D-20)
- [`architecture.md`](https://github.com/foreman-lab/handbook/blob/main/architecture.md) — state machine, layers, signal protocol
- [ADR 0007](https://github.com/foreman-lab/handbook/blob/main/adr/0007-domain-blind-core.md) — domain-blind core: foreman composes prompt sections; agents render
- [ADR 0003](https://github.com/foreman-lab/handbook/blob/main/adr/0003-state-machine-scope-and-mcp-surface.md) — 2-tool MCP surface (`foreman__status`, `foreman__step`)

## Install

Not yet published.

## License

Apache-2.0. See [LICENSE](LICENSE).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Contributions require a DCO sign-off (`git commit -s`).
