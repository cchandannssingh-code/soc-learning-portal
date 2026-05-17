---
title: "Pass-the-Hash"
---

# Pass-the-Hash

## What is Pass-the-Hash?

Pass-the-Hash uses stolen NTLM hashes directly for authentication without knowing the plaintext password.

---

## Attack Flow

1. Attacker dumps NTLM hash
2. Reuses hash
3. Authenticates successfully

---

## Important Logs

| Event ID | Description |
| --- | --- |
| 4624 | NTLM Login |

---

## Detection Clues

- NTLM authentication
- Lateral movement
- Multiple host access

---

## One-Line Summary

> Use stolen NTLM hash as password.