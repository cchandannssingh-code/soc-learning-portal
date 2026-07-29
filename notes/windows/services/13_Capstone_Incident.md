---
title: 13_Capstone Incident – Rogue Windows Service Investigation
description: Investigate a simulated security incident involving a suspicious Windows Service by analyzing logs, processes, registry entries, and endpoint telemetry.
difficulty: 🔴 Advanced
estimated_time: 90–120 Minutes
module: Windows Services
prerequisites:
  - Complete Windows Services Module
---

# Capstone Incident

> **Mission:** You are the SOC analyst assigned to investigate a suspicious Windows Service detected on an employee workstation.

---

# Learning Objectives

After completing this capstone, you will be able to:

- Conduct a complete Windows Service investigation.
- Build an evidence-based timeline.
- Correlate telemetry from multiple sources.
- Identify attacker techniques.
- Recommend containment and detection improvements.
- Produce an analyst-quality incident report.

---

# Scenario

**Date:** March 18, 2026

**Host:** WIN10-FINANCE-07

**Department:** Finance

At **10:14 AM**, your EDR generated the following alert:

```
High Severity

Suspicious Windows Service Installed
```

The user reports:

> "My computer seems a little slower than usual, but I haven't noticed anything else."

You have been assigned the investigation.

---

# Available Evidence

The following artifacts have been collected.

✓ Windows Event Logs

✓ Sysmon Logs

✓ Process Tree

✓ Registry Export

✓ Service Configuration

✓ File Metadata

✓ Network Connections

✓ PowerShell History

✓ EDR Timeline

---

# Evidence 1 – Event Log

```
Event ID : 7045

Service Name

Windows Update Helper

Service File

C:\Users\Public\WindowsUpdateHelper.exe

Account

LocalSystem
```

---

# Evidence 2 – Process Creation

```
4688

cmd.exe

↓

sc.exe create "Windows Update Helper"
```

Parent:

```
explorer.exe
```

User:

```
jsmith
```

---

# Evidence 3 – Registry

```
HKLM\SYSTEM\CurrentControlSet\Services\Windows Update Helper

ImagePath

C:\Users\Public\WindowsUpdateHelper.exe

Start

2

ObjectName

LocalSystem
```

---

# Evidence 4 – File Information

```
Unsigned

Company

Unknown

Compile Date

2 days ago

Location

Users\Public
```

SHA256

```
<Provided Hash>
```

---

# Evidence 5 – Process Tree

```
explorer.exe

↓

cmd.exe

↓

sc.exe

↓

services.exe

↓

WindowsUpdateHelper.exe
```

---

# Evidence 6 – Network Activity

```
Destination

203.xxx.xxx.xxx

Port

443

First Connection

10:15 AM

Repeated every 60 seconds
```

---

# Evidence 7 – PowerShell History

```
Get-Service

sc.exe create

Start-Service
```

---

# Evidence 8 – Timeline

```
10:11

User downloads ZIP

↓

10:12

ZIP extracted

↓

10:13

cmd.exe launched

↓

10:13

sc.exe create

↓

10:14

Event ID 7045

↓

10:14

Service Started

↓

10:15

Outbound HTTPS Connection
```

---

# Investigation Tasks

## Task 1

Identify all suspicious indicators.

---

## Task 2

Determine how persistence was established.

---

## Task 3

Determine which Windows components were modified.

---

## Task 4

Map the activity to MITRE ATT&CK.

---

## Task 5

Build a complete attack timeline.

---

## Task 6

Determine the likely attacker objective.

---

## Task 7

Recommend containment actions.

---

## Task 8

Recommend long-term detection improvements.

---

# Deliverables

Submit:

✓ Incident Summary

✓ Timeline

✓ Evidence Table

✓ Root Cause Analysis

✓ MITRE ATT&CK Mapping

✓ Indicators of Compromise

✓ Containment Plan

✓ Eradication Steps

✓ Detection Recommendations

✓ Lessons Learned

---

# Investigation Notes

Use this space to record observations.

```
______________________________________

______________________________________

______________________________________
```

---

# Success Criteria

You successfully complete this capstone when you can:

- Explain every artifact.
- Defend every conclusion with evidence.
- Build an accurate timeline.
- Recommend realistic response actions.

Remember:

**Evidence drives conclusions—not assumptions.**

---

# Analyst Reflection

After completing the investigation, consider:

- Which evidence was most valuable?
- Which evidence was misleading?
- Could you have reached the same conclusion with fewer artifacts?
- What additional telemetry would have helped?

---

# Module Complete

Congratulations!

You have completed the **Windows Services** learning module.

You now understand:

- Service Architecture
- Service Configuration
- Service Accounts
- Service Management
- Service Security
- Investigation
- Detection

The next Windows module will build upon these concepts.