---
title: 09_Service Investigation
description: Learn a structured methodology for investigating Windows Services during incident response and threat hunting.
difficulty: 🟡 Intermediate
estimated_time: 20 Minutes
module: Windows Services
prerequisites:
  - Introduction to Windows Services
  - Service Architecture
  - Service Configuration
  - Service Accounts
  - services.exe and svchost.exe
  - Service Management
  - Service Security
---

# Service Investigation

> **Goal:** Learn a systematic approach to investigate Windows Services and determine whether they are legitimate, misconfigured, or malicious.

---

# Learning Objectives

After completing this lesson, you will be able to:

- Build an investigation workflow for Windows Services.
- Identify suspicious Service characteristics.
- Validate Service configuration and execution.
- Correlate evidence from multiple sources.
- Determine whether a Service is legitimate or malicious.

---

# The Problem

Imagine your EDR generates this alert:

> **"Suspicious Windows Service Detected"**

At this point, you don't know whether it's:

- A legitimate Windows Service
- A third-party application
- A recently installed enterprise agent
- A misconfiguration
- Malware

Jumping to conclusions can lead to false positives or missed threats.

You need a structured investigation process.

---

# Think Like an Analyst 🧠

> "Don't assume a Service is malicious because of its name.
>
> Don't assume it's legitimate because it exists.
>
> Verify everything using evidence."

---

# Investigation Workflow

```
Alert

↓

Identify Service

↓

Collect Information

↓

Validate Configuration

↓

Inspect Process

↓

Correlate Logs

↓

Assess Risk

↓

Conclusion
```

Always follow the same process.

---

# Step 1 — Identify the Service

Start with the basics.

Collect:

- Service Name
- Display Name
- Current Status
- Startup Type
- Service Account

Questions:

- Is the Service expected?
- Does the name look suspicious?
- Was it recently installed?

---

# Step 2 — Verify Configuration

Review:

- ImagePath
- ObjectName
- Start
- Type
- Dependencies

Questions:

- Is the executable in a trusted location?
- Has ImagePath changed?
- Is Startup Type expected?
- Does the Service use the correct account?

---

# Step 3 — Inspect the Executable

Review:

- File Path
- Digital Signature
- File Hash
- Company Name
- File Version
- Creation Time

Questions:

- Is it signed?
- Is it located in `C:\Windows\System32` or `Program Files`?
- Is the hash known?
- Is the publisher expected?

---

# Step 4 — Inspect the Running Process

If the Service is running, examine:

- Process ID (PID)
- Parent Process
- Command Line
- Loaded Modules
- Child Processes
- Network Connections

Questions:

- Is the parent process `services.exe`?
- Is the command line expected?
- Is the process communicating externally?

---

# Step 5 — Review Event Logs

Useful Event IDs:

| Event ID | Description |
|----------|-------------|
| 4697 | Service Installed |
| 7035 | Service Control Request |
| 7036 | Service Started / Stopped |
| 7040 | Startup Type Changed |
| 7045 | New Service Installed |

Questions:

- When was the Service installed?
- Who installed it?
- Was it recently modified?

---

# Step 6 — Correlate Other Evidence

Don't investigate the Service in isolation.

Correlate with:

- Process Creation Logs
- Registry Changes
- PowerShell Logs
- Scheduled Tasks
- User Logons
- Network Activity
- EDR Alerts

A complete picture is more valuable than a single indicator.

---

# Investigation Checklist

```
✓ Service Name

✓ Display Name

✓ Status

✓ Startup Type

✓ Service Account

✓ ImagePath

✓ Digital Signature

✓ File Hash

✓ Parent Process

✓ Command Line

✓ Event Logs

✓ Network Activity
```

Use this checklist consistently.

---

# Example Investigation

### Alert

```
New Service Installed
```

### Service Name

```
WindowsUpdateService
```

### ImagePath

```
C:\Users\Public\WindowsUpdateService.exe
```

### Account

```
LocalSystem
```

### Signature

```
Unsigned
```

### Parent Process

```
services.exe
```

### Event ID

```
7045
```

### Assessment

Several suspicious indicators:

- Executable stored in a user-writable directory.
- Runs as LocalSystem.
- Unsigned binary.
- Recently installed.

This warrants further investigation.

---

# SOC Perspective

The goal is not simply to find malware.

The goal is to answer:

- What happened?
- Is it expected?
- What evidence supports that conclusion?
- What is the potential impact?

---

# Defender Perspective

Document:

- Findings
- Evidence
- Timeline
- Risk Assessment
- Recommended Actions

Good investigations are evidence-based and reproducible.

---

# Analyst Tips

> 💡 A legitimate Service can still be abused.

> 💡 Never rely on the Service name alone.

> 💡 Validate the executable, not just the configuration.

> 🚨 Multiple weak indicators together often reveal malicious activity.

---

# Common Misconceptions

❌ Every Service in System32 is legitimate.

✔ Attackers may replace legitimate binaries or exploit vulnerable Services.

---

❌ An unsigned Service is always malicious.

✔ Many internal enterprise applications are unsigned. Consider the full context.

---

❌ One suspicious indicator proves compromise.

✔ Base your conclusion on multiple pieces of evidence.

---

# Key Takeaways

- Follow a structured investigation process.
- Validate configuration, process, executable, and logs.
- Correlate evidence from multiple sources.
- Base conclusions on evidence, not assumptions.

---

# Quick Reference

### Verify

- Service Name
- ImagePath
- Startup Type
- Service Account
- Signature
- Hash
- Parent Process

### Review

- Event IDs: 4697, 7035, 7036, 7040, 7045

### Correlate

- Process Logs
- Registry
- Network
- EDR
- PowerShell

---

# Self-Check

You should now be able to answer:

- What is the first step in a Service investigation?
- Which configuration values should be verified?
- Which Event IDs are important?
- Why should multiple evidence sources be correlated?
- How do you determine whether a Service is malicious?

---

# Knowledge Graph

## Related Topics

- Service Management
- Service Security
- Windows Event Logs
- Windows Registry
- Windows Processes

## Related Event IDs

- 4697
- 7035
- 7036
- 7040
- 7045

## Related MITRE ATT&CK

- T1543.003 – Create or Modify System Process: Windows Service
- T1036 – Masquerading

## Advanced Reading

📘 Advanced → Service Abuse

📘 Advanced → Windows Event Log Internals

📘 Advanced → Sysmon Service Monitoring

---

## Next Lesson

➡ **09_Service_Detection.md**