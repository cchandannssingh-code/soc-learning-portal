---
title: "Golden Ticket Attack"
---

# Golden Ticket Attack

## What is Golden Ticket?

Golden Ticket is a Kerberos attack where an attacker forges a fake TGT (Ticket Granting Ticket) using the krbtgt account hash.

---

## Attack Flow

1. Attacker compromises Domain Admin
2. Extracts krbtgt hash
3. Creates fake TGT
4. Requests service tickets
5. Gains full domain access

---

## Why It Is Dangerous

- Full domain compromise
- Domain Admin impersonation
- Long-term persistence
- Difficult to detect

---

## Important Logs

| Event ID | Description |
| --- | --- |
| 4768 | TGT Request |
| 4769 | Service Ticket Request |

---

## Detection Clues

- 4769 without 4768
- Long ticket lifetimes
- Suspicious usernames
- Unusual domain activity

---

## Example Splunk Query

```spl
index=sec EventCode=4769
| stats count by user
```

---

## One-Line Summary

> Forge fake TGT using krbtgt hash → full domain compromise.