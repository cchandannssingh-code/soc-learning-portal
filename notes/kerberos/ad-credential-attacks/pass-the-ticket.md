---
title: "Pass-the-Ticket"
---

# Pass-the-Ticket

## What is Pass-the-Ticket?

Pass-the-Ticket reuses stolen Kerberos tickets to authenticate as another user.

---

## Attack Flow

1. Attacker steals Kerberos ticket
2. Injects ticket into session
3. Authenticates successfully

---

## Important Logs

| Event ID | Description |
| --- | --- |
| 4624 | Login |
| 4769 | Service Ticket Activity |

---

## Detection Clues

- Same ticket from multiple systems
- Unusual login behavior
- Authentication anomalies

---

## One-Line Summary

> Reuse stolen Kerberos ticket for authentication.