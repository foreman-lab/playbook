# Foreman Roadmap

A rough product roadmap for [`foreman-lab/foreman`](https://github.com/foreman-lab/foreman) — what a user of the solo tier can do, release by release.

The product-tier progression (solo → team → cloud) is in [`handbook/roadmap.md`](https://github.com/foreman-lab/handbook/blob/main/roadmap.md). Development rules live in [`handbook/foundations.md`](https://github.com/foreman-lab/handbook/blob/main/foundations.md).

Versions follow [semver](https://semver.org/). While we are at `0.y.z`, anything may change.

## 0.1.0 — Hello, agent

Drive a coding agent through a scripted task end-to-end.

## 0.2.0 — Bring your own playbook

Users author and run their own YAML playbooks.

## 0.3.0 — Run all day

Daemon mode. One user, many concurrent projects.

## Later

Unordered. Each is specified when it becomes next.

- Security hardening
- Operator controls (approve, reject, interrupt, resume)
- Observability
- 1.0 for the solo tier

Tiers beyond solo (team, cloud) live in separate repos; see [`handbook/roadmap.md`](https://github.com/foreman-lab/handbook/blob/main/roadmap.md).

## Changes

Open a PR. Architectural changes need a handbook ADR first.
