# Playbook Roadmap

Rough product roadmap for [`foreman-lab/playbook`](https://github.com/foreman-lab/playbook) — what a user of the solo tier can do, release by release.

Tier progression (solo → team → cloud) and the product thesis live in [`handbook/foundations.md`](https://github.com/foreman-lab/handbook/blob/main/foundations.md). Development rules live in the same place (`B*` principles).

Versions follow [semver](https://semver.org/). While we are at `0.y.z`, anything may change.

## 0.1.0 — Hello, agent

Drive a coding agent through a scripted task end-to-end. Built-in playbook, built-in craft — prove the harness wires work.

## 0.2.0 — Bring your own workflow

Users author their own playbooks (NODE trees) and crafts (domain how-to). Playbook loads, validates, and runs them.

## 0.3.0 — Run all day

Daemon mode. One user, many concurrent projects, each its own session.

## Later

Provisional. Each is specified when it becomes next.

- Parallel NODE execution (composite fan-out, join semantics)
- Security hardening (scope allowlists, sandboxed tool calls)
- Operator controls (approve, reject, interrupt, resume)
- Observability (event stream, status dashboard)
- 1.0 for the solo tier

Tiers beyond solo (team, cloud) live in separate repos; see [`handbook/foundations.md`](https://github.com/foreman-lab/handbook/blob/main/foundations.md) (P7, D20).

## Changes

Open a PR. Architectural changes need a handbook ADR first.
