---
title: "AS-REP Roasting"
---

# AS-REP Roasting

## What is AS-REP Roasting?

AS-REP Roasting targets users with Kerberos pre-authentication disabled.

---

## Attack Flow

1. Attacker requests AS-REP
2. Receives encrypted response
3. Cracks password offline

---

## Why It Is Dangerous

- No valid login needed
- Easy password cracking opportunity
- Often overlooked

---

## Important Logs

| Event ID | Description |
| --- | --- |
| 4768 | AS-REP Activity |

---

## Detection Clues

- Pre-authentication disabled
- Unusual AS-REP requests

---

## Example Splunk Query

```spl
index=sec EventCode=4768 Pre_Authentication_Type=0
| stats count by user
```

---

## One-Line Summary

> Request AS-REP → crack offline → recover password.