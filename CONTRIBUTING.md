# Contributing

Thanks for your interest in contributing to Foreman.

## Scope

This repo holds the Foreman code (CLI + engine, and eventually daemon mode). Architecture, ADRs, and roadmap live in [`foreman-lab/handbook`](https://github.com/foreman-lab/handbook).

## Before opening a PR

1. Read the handbook's [`foundations.md`](https://github.com/foreman-lab/handbook/blob/main/foundations.md) and relevant ADRs.
2. Open an issue describing the change. For anything beyond a trivial fix, confirm direction with a maintainer before implementing.
3. Architectural changes go to the **handbook** as an ADR first, not here.

## Commit conventions

- One logical change per commit.
- Conventional-commit style prefix (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).
- Every commit signed off (DCO — see below).

## Developer Certificate of Origin (DCO)

Every commit must be signed off:

```
git commit -s -m "your message"
```

This appends `Signed-off-by: Your Name <your@email>` to the commit, certifying the [Developer Certificate of Origin v1.1](https://developercertificate.org/). By signing off, you agree that:

- You have the right to submit the change under the project's license.
- You understand the commit and sign-off are public.

## License

By contributing, you agree your contributions are licensed under Apache-2.0.

## Code of Conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
