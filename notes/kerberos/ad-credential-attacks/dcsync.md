---
title: "DCSync Attack"
---

# DCSync Attack

## What is DCSync?

DCSync impersonates a Domain Controller to replicate password hashes from Active Directory.

---

## Attack Flow

1. Attacker gets replication privileges
2. Mimics Domain Controller
3. Dumps user hashes
4. Extracts krbtgt hash

---

## Why It Is Dangerous

- Dumps all domain hashes
- Enables Golden Ticket attack
- High privilege abuse

---

## Important Logs

| Event ID | Description |
| --- | --- |
| 4662 | Directory Replication Activity |

---

## Detection Clues

- Replication from non-DC systems
- Unusual replication permissions
- Unexpected directory access

---

## Example Splunk Query

```spl
index=sec EventCode=4662
| search Object_Type="domainDNS"
| stats count by user, src_ip
```

---

## One-Line Summary

> Pretend to be Domain Controller → dump all hashes.