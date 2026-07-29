---
title: 12_Hands-On Labs
description: Reinforce your understanding of Windows Services through practical, investigation-driven exercises.
difficulty: 🟡 Intermediate
estimated_time: 60–90 Minutes
module: Windows Services
prerequisites:
  - Complete Windows Services Module
---

# Hands-On Labs

> **Goal:** Apply the concepts learned throughout the Windows Services module by investigating and interacting with real Windows Services.

---

# Learning Objectives

After completing these labs, you will be able to:

- Navigate Windows Service management tools.
- Inspect Service configuration.
- Identify Service Accounts.
- Investigate Service processes.
- Analyze Windows Event Logs.
- Build an investigation workflow.

---

# Lab Environment

Recommended:

- Windows 10/11 VM
- Windows Server VM (Optional)
- PowerShell
- Event Viewer
- Task Manager
- Registry Editor
- Sysinternals Process Explorer (Optional)

---

# Lab 1 – Explore Windows Services

## Objective

Become familiar with the Windows Services console.

### Tasks

- Open `services.msc`
- Count approximately how many Services exist.
- Identify five Automatic Services.
- Identify five Manual Services.
- Identify one Disabled Service.

### Questions

- Which Service is currently running?
- Which Service is stopped?
- Which Service surprised you?

---

# Lab 2 – Investigate a Service

Target:

```
Windows Defender
```

Collect:

- Service Name
- Display Name
- Startup Type
- Status
- Service Account
- Binary Path
- Dependencies

Tools:

- services.msc
- sc.exe
- PowerShell

---

# Lab 3 – Follow the Process

Objective:

Understand the relationship between Services and Processes.

Tasks:

- Locate `services.exe`
- Locate several `svchost.exe` processes
- Identify which Services each hosts
- Find one Service with its own executable

Questions:

- Which Services share a host?
- Which Service runs independently?

---

# Lab 4 – Registry Investigation

Navigate to:

```
HKLM\SYSTEM\CurrentControlSet\Services
```

Choose one Service.

Document:

- ImagePath
- Start
- Type
- ObjectName

Questions:

- What executable launches?
- Which account runs the Service?
- When does it start?

---

# Lab 5 – Event Log Investigation

Open Event Viewer.

Locate:

System Log

Find:

- 7035
- 7036
- 7040
- 7045 (if available)

Document:

- Time
- Service Name
- Event Description

---

# Lab 6 – PowerShell Investigation

Commands:

```powershell
Get-Service

Get-CimInstance Win32_Service

Get-Process
```

Questions:

- Which Services are running?
- Which are stopped?
- Which Services use LocalSystem?

---

# Lab 7 – Mini Investigation

Scenario:

A colleague reports:

> "Windows Update stopped working."

Investigate:

- Is the Service running?
- Startup Type?
- Dependencies?
- Recent Service events?
- Any errors?

Document your findings.

---

# Lab 8 – Investigation Challenge

Scenario

```
Alert:

New Service Installed
```

Evidence:

```
Event ID 7045

↓

ImagePath

↓

Executable

↓

Running Process
```

Your task:

Determine whether the Service appears legitimate.

Support your conclusion with evidence.

---

# Investigation Report Template

For every lab, record:

## Objective

---

## Evidence Collected

---

## Analysis

---

## Conclusion

---

## Recommended Actions

---

# Analyst Tips

> 💡 Don't rush to conclusions.

> 💡 Evidence first. Opinion second.

> 💡 Always document your investigation.

---

# Knowledge Graph

Related Topics

- Service Investigation
- Service Detection
- Windows Event Logs
- Registry
- Processes

---

## Next Lesson

➡ **12_Capstone_Incident.md**