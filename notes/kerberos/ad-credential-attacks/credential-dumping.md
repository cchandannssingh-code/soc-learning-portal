---
title: "Credential Dumping"
---

# Credential Dumping

## What is Credential Dumping?

Credential Dumping extracts passwords, hashes, and Kerberos tickets from LSASS memory.

---

## Common Tools

- Mimikatz
- ProcDump

---

## Attack Flow

1. Access LSASS process
2. Dump memory
3. Extract credentials
4. Reuse credentials

---

## Why It Is Dangerous

- Gives hashes and tickets
- Enables lateral movement
- Supports multiple AD attacks

---

## Important Logs

| Event ID | Description |
| --- | --- |
| 4688 | Process Creation |

---

## Detection Clues

- LSASS access
- Suspicious process execution
- Mimikatz indicators

---

## Example Splunk Query

```spl
index=sec EventCode=4688
| search process_name="*mimikatz*" OR command_line="*lsass*"
```

---

## One-Line Summary

> Dump credentials directly from LSASS memory.