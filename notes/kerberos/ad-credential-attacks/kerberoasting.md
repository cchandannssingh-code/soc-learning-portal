---
title: "Kerberoasting Attack"
---

# Kerberoasting Attack

## What is Kerberoasting?

Kerberoasting abuses Kerberos service tickets to extract and crack service account passwords offline.

---

## Attack Flow

1. User requests TGS ticket
2. Ticket encrypted with service account hash
3. Ticket exported
4. Offline cracking performed

---

## Why It Is Dangerous

- Low privilege required
- Service accounts often privileged
- Common real-world attack
- Can lead to lateral movement

---

## Important Logs

| Event ID | Description |
| --- | --- |
| 4769 | TGS Request |

---

## Detection Clues

- Multiple SPN requests
- Burst ticket activity
- RC4 encryption
- Unusual service enumeration

---

## Example Splunk Query

```spl
index=sec EventCode=4769
| stats dc(service_name) as spn_count by user
| where spn_count > 10
```

---

## One-Line Summary

> Request service tickets → crack offline → recover service account password.