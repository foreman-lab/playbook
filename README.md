# playbook

MCP harness for AI coding agents. Single-user product: runs a 4-node state machine (init → plan → work → evaluate) per NODE, orchestrating a coding agent through a user-authored workflow (a playbook). Ships as one `playbook` CLI binary with two modes:

- **Solo mode** — engine runs in-process, single project, foreground.
- **Daemon mode** — engine runs as a local background service, one user with multiple concurrent projects/sessions. _(Coming in a later milestone.)_

Higher tiers (`team` for LAN multi-user, `cloud` for hosted SaaS) will be separate repos that speak Playbook's MCP/IPC protocol — they do not import Playbook's code. See the [Docker model](https://github.com/foreman-lab/handbook/blob/main/foundations.md) (P7, D20) for the rationale.

## Vocabulary

Two meanings of "playbook":

- **Playbook** (the product) — this repo; the CLI binary and engine.
- **playbook** (a concept) — the outer workflow, a NODE tree the user authors for a task.

A **craft** is the inner practice (domain how-to) a single NODE invokes: TDD, refactor, review, and so on. A playbook references crafts; crafts do not reference playbooks. See handbook [foundations D7](https://github.com/foreman-lab/handbook/blob/main/foundations.md).

## Status

**Pre-alpha.** Repo is freshly seeded; code has not been written yet. The first milestone (`0.1.0 — Hello, agent`) is being planned.

## Architecture

All architectural material lives in the [handbook](https://github.com/foreman-lab/handbook):

- [`foundations.md`](https://github.com/foreman-lab/handbook/blob/main/foundations.md) — principles (B1–B3, P1–P10) and decisions (D1–D22)

## Install

Not yet published.

## License

Apache-2.0. See [LICENSE](LICENSE).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Contributions require a DCO sign-off (`git commit -s`).
