---
title: "AD Credential Attacks"
---

# Active Directory Credential Attacks

This note covers major Active Directory credential attacks commonly seen in SOC investigations, incident response, and cybersecurity interviews.

---

# Table of Contents

- [Pass-the-Hash](#1-pass-the-hash-pth)
- [Pass-the-Ticket](#2-pass-the-ticket-ptt)
- [Golden Ticket](#3-golden-ticket)
- [Silver Ticket](#4-silver-ticket)
- [Kerberoasting](#5-kerberoasting)
- [AS-REP Roasting](#6-as-rep-roasting)
- [Credential Dumping](#7-credential-dumping)
- [DCSync Attack](#8-dcsync-attack)
- [Credential Attack Categories](#credential-attack-categories)
- [Important Event IDs](#important-event-ids)
- [Final Comparison Table](#final-comparison-table)

---

# 1. Pass-the-Hash (PtH)

## What is it?

Pass-the-Hash uses stolen NTLM hashes directly for authentication without cracking the password.

---

## Attack Flow

1. Attacker dumps NTLM hash
2. Reuses hash for authentication
3. Gains access without plaintext password

---

## One-Line Summary

> Use stolen NTLM hash as password.

---

## Important Logs

| Event ID | Purpose |
| --- | --- |
| 4624 | NTLM logon activity |

---

## Detection Clues

- NTLM authentication in Kerberos-heavy environment
- Lateral movement patterns
- Multiple host logins

---

# 2. Pass-the-Ticket (PtT)

## What is it?

Pass-the-Ticket reuses stolen Kerberos tickets instead of hashes.

---

## Attack Flow

1. Attacker steals valid Kerberos ticket
2. Injects ticket into another session
3. Authenticates as victim user

---

## One-Line Summary

> Reuse valid Kerberos ticket.

---

## Important Logs

| Event ID | Purpose |
| --- | --- |
| 4624 | Login |
| 4769 | Service ticket activity |

---

## Detection Clues

- Ticket reuse across hosts
- Unusual authentication sources
- Same ticket seen from multiple systems

---

# 3. Golden Ticket

## What is it?

Golden Ticket attack forges Kerberos TGTs using the krbtgt account hash.

---

## Attack Flow

1. Attacker compromises Domain Admin
2. Dumps krbtgt hash
3. Creates fake TGT
4. Gains full domain access

---

## One-Line Summary

> Forge TGT using krbtgt hash → full domain compromise.

---

## Important Logs

| Event ID | Purpose |
| --- | --- |
| 4768 | TGT request |
| 4769 | Service ticket request |

---

## Detection Clues

- 4769 without 4768
- Long ticket lifetimes
- Suspicious usernames
- Unusual domain activity

---

# 4. Silver Ticket

## What is it?

Silver Ticket forges service tickets using a service account hash.

---

## Attack Flow

1. Attacker gets service account hash
2. Forges TGS ticket
3. Accesses target service directly

---

## One-Line Summary

> Forge service ticket using service hash.

---

## Important Logs

| Event ID | Purpose |
| --- | --- |
| Often no DC logs | Service-side activity only |

---

## Detection Clues

- Access without normal Kerberos flow
- Missing DC authentication logs
- Service-side anomalies

---

# 5. Kerberoasting

## What is it?

Kerberoasting abuses Kerberos service tickets to crack service account passwords offline.

---

## Attack Flow

1. Attacker requests TGS ticket
2. Extracts encrypted blob
3. Cracks ticket offline
4. Recovers service account password

---

## One-Line Summary

> Request TGS → crack offline → get service account password.

---

## Important Logs

| Event ID | Purpose |
| --- | --- |
| 4769 | TGS requests |

---

## Detection Clues

- High number of unique SPN requests
- RC4 encryption usage
- Burst ticket requests
- Unusual service enumeration

---

## Example Splunk Query

```spl
index=sec EventCode=4769
| stats dc(service_name) as spn_count by user, src_ip
| where spn_count > 10
```

---

# 6. AS-REP Roasting

## What is it?

AS-REP Roasting targets users with Kerberos pre-authentication disabled.

---

## Attack Flow

1. Attacker requests AS-REP
2. Receives encrypted response
3. Cracks password offline

---

## One-Line Summary

> Request AS-REP → crack offline → recover password.

---

## Important Logs

| Event ID | Purpose |
| --- | --- |
| 4768 | AS-REP activity |

---

## Detection Clues

- Pre-authentication disabled accounts
- Unusual AS-REP requests

---

## Example Splunk Query

```spl
index=sec EventCode=4768 Pre_Authentication_Type=0
| stats count by user, src_ip
```

---

# 7. Credential Dumping

## What is it?

Credential Dumping extracts passwords, hashes, and Kerberos tickets from LSASS memory.

---

## Common Tool

- Mimikatz

---

## One-Line Summary

> Dump credentials directly from memory.

---

## Important Logs

| Event ID | Purpose |
| --- | --- |
| 4688 | Process creation |

---

## Detection Clues

- LSASS access attempts
- Suspicious process execution
- Mimikatz indicators

---

## Example Splunk Query

```spl
index=sec EventCode=4688
| search process_name="*mimikatz*" OR command_line="*lsass*"
```

---

# 8. DCSync Attack

## What is it?

DCSync impersonates a Domain Controller to replicate password hashes from Active Directory.

---

## Attack Flow

1. Attacker gets replication privileges
2. Mimics Domain Controller
3. Extracts domain hashes

---

## One-Line Summary

> Pretend to be DC → dump all hashes.

---

## Important Logs

| Event ID | Purpose |
| --- | --- |
| 4662 | Directory replication activity |

---

## Detection Clues

- Replication activity from non-DC systems
- Unusual replication permissions

---

## Example Splunk Query

```spl
index=sec EventCode=4662
| search Object_Type="domainDNS"
| stats count by user, src_ip
```

---

# Credential Attack Categories

## Credential Theft

- Kerberoasting
- AS-REP Roasting
- Credential Dumping
- DCSync

---

## Credential Reuse

- Pass-the-Hash
- Pass-the-Ticket

---

## Ticket Forgery

- Golden Ticket
- Silver Ticket

---

# Important Event IDs

| Event ID | Meaning |
| --- | --- |
| 4624 | Successful login |
| 4662 | AD replication |
| 4688 | Process creation |
| 4768 | TGT request |
| 4769 | TGS request |

---

# Final Comparison Table

| Attack | Uses | Scope |
| --- | --- | --- |
| Pass-the-Hash | NTLM Hash | Depends on user |
| Pass-the-Ticket | Kerberos Ticket | Depends on ticket |
| Kerberoasting | TGS Ticket | Service accounts |
| Silver Ticket | Service Hash | One service |
| Golden Ticket | krbtgt Hash | Full domain |

---

# Easy Memory Trick

- Pass = reuse
- Roasting = crack password
- Silver = one service
- Golden = full domain

---

# Final Summary

Understanding these attacks helps SOC analysts:

- Detect lateral movement
- Investigate Kerberos abuse
- Identify credential theft
- Correlate authentication anomalies
- Hunt advanced persistence techniques