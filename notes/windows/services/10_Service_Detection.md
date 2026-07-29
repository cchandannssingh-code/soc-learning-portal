---
title: 10_Service Detection
description: Learn how to detect suspicious Windows Service activity using logs, telemetry, and behavioral analysis.
difficulty: 🟡 Intermediate
estimated_time: 20 Minutes
module: Windows Services
prerequisites:
  - Service Investigation
---

# Service Detection

> **Goal:** Learn how defenders detect malicious Windows Service activity by monitoring logs, process behavior, registry changes, and endpoint telemetry.

---

# Learning Objectives

After completing this lesson, you will be able to:

- Identify common indicators of malicious Service activity.
- Understand which Windows logs are useful for Service detection.
- Correlate multiple telemetry sources.
- Reduce false positives.
- Build an investigation from a detection.

---

# The Problem

Imagine malware installs itself as a Windows Service.

Nothing crashes.

No user notices anything.

The attacker simply waits until the computer reboots.

After reboot...

the malware starts automatically.

How can defenders detect this?

---

# Think Like a Defender 🛡️

> "I don't detect malware because of its name.
>
> I detect suspicious behavior.
>
> Every Service leaves traces.
>
> I need to collect and correlate those traces."

---

# Detection Sources

Useful telemetry includes:

| Source | What It Tells You |
|---------|-------------------|
| Windows Event Logs | Service lifecycle events |
| Sysmon | Process creation and image loading |
| EDR | Process behavior and command line |
| Registry Auditing | Configuration changes |
| File Monitoring | Executable replacement |
| PowerShell Logs | Administrative actions |

No single source tells the complete story.

---

# Important Windows Event IDs

| Event ID | Description |
|----------|-------------|
| 4697 | Service Installed |
| 7035 | Service Control Request |
| 7036 | Service Started or Stopped |
| 7040 | Startup Type Changed |
| 7045 | New Service Installed |

These are often the starting point of an investigation.

---

# What Should Raise Suspicion?

Examples include:

- New Service installed unexpectedly
- Service executable in a user-writable directory
- Unsigned executable
- Startup Type changed to Automatic
- Service running as LocalSystem
- Unexpected Service name
- Service executable launched from Temp or Public folders

One indicator alone may not be malicious.

Several together deserve investigation.

---

# Detection Workflow

```
Alert

↓

Validate Event

↓

Collect Service Information

↓

Inspect Executable

↓

Review Process

↓

Correlate Logs

↓

Risk Assessment

↓

Escalate or Close
```

---

# Detection Opportunities

Monitor for:

✓ Event ID 7045

✓ ImagePath changes

✓ Registry modifications

✓ Service executable replacement

✓ New Auto-Start Services

✓ Unsigned Service binaries

✓ Unexpected Service Accounts

---

# Correlation Example

```
7045

↓

New Service Installed

+

4688

↓

sc.exe create

+

4657

↓

Registry Modified

↓

High Confidence Detection
```

Multiple related events increase confidence.

---

# Case File 🗂

## Alert

```
Event ID: 7045

Service Name:
AdobeUpdateHelper

ImagePath:
C:\Users\Public\AdobeUpdate.exe

Startup:
Automatic

Account:
LocalSystem
```

---

## Additional Evidence

```
Unsigned executable

↓

Parent Process

cmd.exe

↓

Command

sc create AdobeUpdateHelper

↓

Network Connection

185.xxx.xxx.xxx
```

---

## Investigation

Questions:

- Is Adobe installed?
- Why is the executable in Users\Public?
- Why is it unsigned?
- Who executed `sc.exe`?
- What happened immediately before this event?

---

## Analysis

Findings:

- Service created manually.
- Executable stored in a user-writable location.
- Unsigned binary.
- Automatic startup.
- Runs as LocalSystem.
- Outbound network communication.

Assessment:

**High confidence malicious persistence.**

---

## Detection Opportunities

Behavioral Indicators:

✓ New Service

✓ Auto-start

✓ Unsigned executable

✓ LocalSystem account

✓ User-writable directory

✓ External network traffic

Rather than relying on one IOC, the detection is based on several correlated behaviors.

---

# SOC Perspective

Good detections answer:

- What changed?
- When?
- Who made the change?
- Why is it suspicious?
- What evidence supports the conclusion?

---

# False Positives

Not every new Service is malicious.

Examples:

- Software installation
- Antivirus updates
- Printer drivers
- Enterprise management tools
- IT deployment software

Always verify context before escalating.

---

# Analyst Tips

> 💡 Event ID 7045 is a starting point, not proof of malware.

> 💡 Correlating process, registry, and network telemetry increases confidence.

> 💡 Always inspect ImagePath and the executable location.

> 🚨 Services running from Temp or Public directories deserve immediate attention.

---

# Common Misconceptions

❌ Every new Service indicates malware.

✔ Many legitimate applications install Services.

---

❌ Event ID 7045 alone is sufficient.

✔ Combine it with additional evidence before drawing conclusions.

---

❌ Detection ends when the alert is closed.

✔ A good detection should lead to a complete investigation.

---

# Key Takeaways

- Detect behavior, not filenames.
- Correlate multiple telemetry sources.
- Validate the Service executable and configuration.
- Reduce false positives through context.
- Evidence-based detection produces stronger investigations.

---

# Quick Reference

Primary Events

- 4697
- 7035
- 7036
- 7040
- 7045

High-Risk Indicators

- Unsigned executable
- User-writable path
- Auto-start
- LocalSystem
- ImagePath changes

---

# Self-Check

You should now be able to answer:

- Which Event IDs are most useful for Service detection?
- Why should multiple telemetry sources be correlated?
- Which Service characteristics are considered high risk?
- Why is Event ID 7045 only the beginning of an investigation?

---

# Knowledge Graph

## Related Topics

- Service Investigation
- Windows Event Logs
- Sysmon
- Registry Auditing
- Endpoint Detection and Response (EDR)

## Related MITRE ATT&CK

- T1543.003 — Create or Modify System Process: Windows Service
- T1036 — Masquerading
- T1574 — Hijack Execution Flow

## Advanced Reading

📘 Advanced → Sigma Rules for Services

📘 Advanced → Sysmon Detection Engineering

📘 Advanced → Service Abuse Techniques

---

## Next Lesson

➡ **10_Malware_Case_Studies.md**