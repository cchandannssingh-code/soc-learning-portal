---
title: 06_Service Management
description: Learn how to manage, inspect, and troubleshoot Windows Services using graphical tools, Command Prompt, and PowerShell.
difficulty: 🟡 Intermediate
estimated_time: 15 Minutes
module: Windows Services
prerequisites:
  - Introduction to Windows Services
  - Service Architecture
  - Service Configuration
  - Service Accounts
  - services.exe and svchost.exe
---

# Service Management

> **Goal:** Learn how Windows Services are managed and how SOC analysts can inspect them during investigations.

---

# Learning Objectives

After completing this lesson, you will be able to:

- View installed Services
- Start and stop Services
- Query Service configuration
- Identify the executable behind a Service
- Determine which account a Service runs under
- Use common Service management tools

---

# The Problem

Imagine you receive this alert:

> **"A suspicious Windows Service was detected."**

You now need answers.

- Does the Service exist?
- Is it currently running?
- Which executable does it launch?
- Who started it?
- Which account is it using?
- Is it configured correctly?

Windows provides several tools to answer these questions.

---

# Think Like Windows 🧠

> "Administrators need a simple way to control Services.
>
> They should be able to:
>
> • View
> • Start
> • Stop
> • Restart
> • Configure
>
> I'll provide both graphical and command-line tools."

---

# Service Management Tools

| Tool | Purpose |
|------|---------|
| Services Console | Graphical management |
| sc.exe | Service control utility |
| PowerShell | Automation and scripting |
| Task Manager | View running Services |
| WMIC / CIM | Query Service information |

---

# Services Console (services.msc)

Launch:

```
services.msc
```

The Services console displays:

- Service Name
- Display Name
- Status
- Startup Type
- Log On Account
- Description

Typical actions:

- Start
- Stop
- Restart
- Pause
- View Properties

This is the easiest way to inspect Services on a Windows system.

---

# Using sc.exe

`sc.exe` is the built-in Service Control utility.

### View Service

```
sc query WinDefend
```

---

### View Configuration

```
sc qc WinDefend
```

Displays:

- Binary Path
- Startup Type
- Service Type
- Dependencies
- Service Account

---

### Start Service

```
sc start WinDefend
```

---

### Stop Service

```
sc stop WinDefend
```

---

### List All Services

```
sc query
```

---

# Using PowerShell

### View Services

```powershell
Get-Service
```

---

### View One Service

```powershell
Get-Service WinDefend
```

---

### Running Services

```powershell
Get-Service | Where-Object {$_.Status -eq "Running"}
```

---

### Stopped Services

```powershell
Get-Service | Where-Object {$_.Status -eq "Stopped"}
```

---

### Restart a Service

```powershell
Restart-Service WinDefend
```

---

### Stop a Service

```powershell
Stop-Service WinDefend
```

---

# Viewing Detailed Information

PowerShell

```powershell
Get-CimInstance Win32_Service
```

Useful fields include:

- Name
- DisplayName
- State
- StartMode
- StartName
- PathName

This is one of the most useful commands during investigations.

---

# Viewing Running Services

Task Manager

```
Task Manager

↓

Services
```

Shows:

- Running Services
- Stopped Services
- Service PID
- Current Status

You can also right-click a Service and jump directly to the hosting process.

---

# Investigation Workflow

Suppose you receive this alert:

```
New Service Installed
```

A simple investigation flow:

```
Alert

↓

Get Service Name

↓

sc qc

↓

Verify ImagePath

↓

Verify Service Account

↓

Check Running Status

↓

Verify Digital Signature

↓

Determine if Legitimate
```

---

# SOC Perspective

The most commonly used commands during investigations are:

```
sc qc

Get-Service

Get-CimInstance Win32_Service

tasklist /svc
```

These four commands answer most initial Service-related questions.

---

# Attacker Perspective

Attackers also use Service management tools.

Examples include:

```
sc create

sc start

sc stop

sc config

sc delete
```

These commands may appear in:

- Command history
- Process creation logs
- EDR telemetry
- PowerShell logs

Unexpected use of these commands should be investigated.

---

# Defender Perspective

When investigating a Service, verify:

✓ Service Name

✓ Display Name

✓ Binary Path

✓ Startup Type

✓ Service Account

✓ Current State

✓ Parent Process

✓ Digital Signature

✓ File Hash

---

# Analyst Tips

> 💡 `sc qc` is one of the fastest ways to inspect Service configuration.

> 💡 `Get-CimInstance Win32_Service` provides more detail than `Get-Service`.

> 💡 `services.msc` is useful for quick manual inspection.

> 🚨 Attackers frequently use `sc.exe` to create or modify Services.

---

# Common Misconceptions

❌ `Get-Service` shows every detail.

✔ It primarily displays status information. Use `Get-CimInstance Win32_Service` for detailed configuration.

---

❌ `services.msc` is only for administrators.

✔ SOC analysts frequently use it during investigations.

---

❌ A running Service is always legitimate.

✔ Verify the executable path, digital signature, and configuration before trusting it.

---

# Key Takeaways

- Windows provides both graphical and command-line tools for managing Services.
- `services.msc` is the primary graphical interface.
- `sc.exe` is the standard command-line utility.
- PowerShell is ideal for querying and automation.
- Investigating a Service begins with understanding its configuration and executable.

---

# Quick Reference

### GUI

```
services.msc
```

### Command Prompt

```
sc query

sc qc

sc start

sc stop
```

### PowerShell

```powershell
Get-Service

Restart-Service

Stop-Service

Get-CimInstance Win32_Service
```

---

# Self-Check

You should now be able to answer:

- Which tool opens the Services console?
- What does `sc qc` display?
- Which PowerShell command lists Services?
- Which command shows detailed Service configuration?
- Which tools are most useful during a Service investigation?

---

# Knowledge Graph

## Related Topics

- Service Configuration
- Service Accounts
- Service Investigation
- Windows Processes

## Useful Commands

```
services.msc

sc query

sc qc

Get-Service

Get-CimInstance Win32_Service

tasklist /svc
```

## Related Event IDs

- 4697 — Service Installed
- 7035 — Service Control Request
- 7036 — Service State Changed
- 7040 — Startup Type Changed
- 7045 — New Service Installed

## Related MITRE ATT&CK

- T1543.003 — Create or Modify System Process: Windows Service

---

## Advanced Reading

📘 sc.exe Internals

📘 PowerShell CIM vs WMI

📘 Windows Service APIs

---

## Next Lesson

➡ **07_Service_Security.md**