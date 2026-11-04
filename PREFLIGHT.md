# PREFLIGHT - the pre-push governance gate

> A push is a Tattoo. Nothing leaves the machine until this gate passes and Steph approves.
> Two halves: a deterministic scan (a script, pass/fail) and a judgment review (this checklist).
> The orchestrator runs both, pastes the result into STATUS, then asks Steph to approve.

## Half 1: deterministic scan (run the script)

From `Dev/`, run the scanner against the project:

```
./preflight.sh <project-slug>
```

It checks, mechanically: hardcoded secrets (and git history if `gitleaks` is installed),
secret-like files tracked in git, `.gitignore` coverage, the confidentiality denylist
(`preflight-denylist.txt`), remote visibility (the catastrophic case is work code on a PUBLIC
remote), and a dependency audit. Exit 0 = clean, 2 = warnings, 1 = hard fail.

A hard FAIL blocks the push. Resolve the FAIL lines, do not wave them through.

## Half 2: judgment review (the security/confidentiality lens)

The script catches the deterministic stuff. This catches what needs a brain. The Breaker (or a
Gatekeeper, if one exists) reviews and answers each, with evidence, in STATUS:

- [ ] **Input handling:** untrusted input validated? Any injection surface (SQL, shell, path,
      template)? Any `eval`/dynamic exec on user data?
- [ ] **Auth/exposure:** any endpoint, port, or file served without the access control it needs?
      Anything that should be local-only but listens publicly?
- [ ] **Secrets in flight:** does the app log, print, or transmit credentials or PII anywhere?
- [ ] **Dependencies:** any new dependency that is unmaintained, unpopular, or does more than it
      should? (Supply-chain risk the audit won't always flag.)
- [ ] **Confidentiality (the wall):** is ANY work-derived logic, data, client specific, or
      internal term in this code? If this is a work project, is the destination private and
      sanctioned? Work code never crosses toward `Personal/` and never lands on a public remote.
- [ ] **Blast radius:** if this code is wrong or abused, what is the worst that happens? Is that
      acceptable for where it is going?

## Verdict

Record in STATUS under Gate: `SCAN: pass|warn|fail` + `REVIEW: pass|fail` + one line of why.
Only on both-pass does the orchestrator surface the push to Steph for approval.
