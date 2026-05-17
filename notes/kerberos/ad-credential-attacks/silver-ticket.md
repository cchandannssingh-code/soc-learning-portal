---
title: "Silver Ticket Attack"
---

# Silver Ticket Attack

## What is Silver Ticket?

Silver Ticket attack forges fake service tickets using a service account hash.

---

## Attack Flow

1. Attacker obtains service account hash
2. Creates forged TGS
3. Accesses service directly

---

## Why It Is Dangerous

- No Domain Controller interaction
- Very stealthy
- Difficult to detect
- Targets specific services

---

## Important Logs

| Event ID | Description |
| --- | --- |
| Often no DC logs | Service-side activity only |

---

## Detection Clues

- Missing Kerberos logs
- Service anomalies
- Suspicious service access

---

## One-Line Summary

> Forge service ticket using service account hash → access one service stealthily.