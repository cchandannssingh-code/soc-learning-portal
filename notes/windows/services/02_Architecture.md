---
title: 02_Architecture
description: Understand how Windows starts, manages, and runs Services from boot until execution.
difficulty: 🟢 Beginner
estimated_time: 15 Minutes
module: Windows Services
prerequisites:
  - Introduction to Windows Services
---

# Service Architecture

> **Goal:** Understand how Windows starts and manages Services by following the complete Service lifecycle.

---

# Learning Objectives

After completing this lesson, you will be able to:

- Explain the role of the Service Control Manager (SCM).
- Understand how Windows starts Services.
- Identify the purpose of `services.exe`.
- Explain why multiple `svchost.exe` processes exist.
- Follow the lifecycle of a Windows Service from boot to execution.

---

# The Problem

Windows contains hundreds of Services.

Examples include:

- Windows Defender
- DHCP Client
- DNS Client
- Windows Update
- Print Spooler
- SQL Server

Windows cannot simply start every executable randomly.

It needs a central manager that knows:

- Which Services exist
- Which Services should start automatically
- Which executable belongs to each Service
- Which account should run the Service
- Which Services depend on others

Windows solves this problem using the **Service Control Manager (SCM).**

---

# Think Like Windows 🧠

> "I have hundreds of Services.
>
> Some should start automatically.
>
> Some should wait.
>
> Some depend on others.
>
> I need one central manager to control all of them.
>
> I'll use the **Service Control Manager**."

---

# High-Level Architecture

```
                  Windows Boot
                        │
                        ▼
              Service Control Manager
                        │
          Reads Service Configuration
                        │
        Determines Which Services Start
                        │
          ┌─────────────┴─────────────┐
          │                           │
          ▼                           ▼
     svchost.exe                service.exe
          │                           │
   Shared Windows Services      Standalone Service
          │                           │
          └─────────────┬─────────────┘
                        ▼
                 Running Service
```

---

# Service Control Manager (SCM)

The **Service Control Manager (SCM)** is the component responsible for managing every Windows Service.

Its responsibilities include:

- Maintaining the Service database
- Starting Services
- Stopping Services
- Restarting Services
- Tracking Service status
- Managing Service dependencies

Think of the SCM as the **traffic controller** for all Windows Services.

Without the SCM, Windows would have no organized way to manage Services.

---

# services.exe

The SCM is implemented by the process:

```
services.exe
```

During system boot, Windows starts `services.exe`.

From that point onward, `services.exe` is responsible for managing Services throughout the lifetime of the system.

You can think of it like this:

```
SCM = Service Manager

services.exe = The process that implements SCM
```

Many beginners treat them as different things.

In practice:

- SCM is the management service.
- `services.exe` is the executable that provides it.

---

# Service Startup Flow

The startup process follows a predictable sequence.

```
Computer Starts
        │
        ▼
Windows Kernel Loads
        │
        ▼
services.exe Starts
        │
        ▼
SCM Initializes
        │
        ▼
Reads Service Configuration
        │
        ▼
Determines Startup Type
        │
        ▼
Starts Required Services
```

Every automatically started Service follows this workflow.

---

# How a Service Actually Runs

Not every Service runs in its own executable.

There are two common models.

### Model 1 – Shared Process

```
svchost.exe
     │
     ├── Service A
     ├── Service B
     └── Service C
```

Multiple Services share one process.

This reduces memory usage.

---

### Model 2 – Dedicated Process

```
Service.exe
      │
      └── One Service
```

Large applications often run in their own executable.

Examples include:

- Microsoft Defender
- SQL Server
- VMware Tools

---

# Why Are There Many svchost.exe Processes?

One of the most common SOC questions is:

> "Why do I see 30+ svchost.exe processes?"

This is normal.

Instead of placing every Service inside one process, Windows groups related Services together.

For example:

```
svchost.exe
    ├── DHCP Client
    ├── DNS Client

svchost.exe
    ├── Windows Audio
    ├── Audio Endpoint Builder

svchost.exe
    ├── Windows Update
    ├── Background Intelligent Transfer Service
```

Using multiple `svchost.exe` processes improves:

- Stability
- Performance
- Isolation
- Reliability

If one host process crashes, only the Services in that process are affected.

---

# Service Lifecycle

Every Service follows the same lifecycle.

```
Installed
      │
      ▼
Configured
      │
      ▼
Started
      │
      ▼
Running
      │
      ▼
Stopped
      │
      ▼
Removed
```

The SCM manages each stage.

---

# SOC Perspective

Understanding the architecture helps answer questions like:

- Why did a Service fail to start?
- Which process is hosting this Service?
- Which executable is actually running?
- Why are there multiple `svchost.exe` processes?
- Which Service owns this process?

Without understanding the architecture, these investigations become much more difficult.

---

# Attacker Perspective

Attackers understand that the SCM trusts Service configurations.

Common abuse includes:

- Creating a malicious Service
- Modifying a legitimate Service
- Replacing a Service executable
- Changing startup behavior
- Executing malware through a Service

The architecture itself is legitimate.

Attackers abuse the trust placed in it.

---

# Defender Perspective

When investigating a Service:

Verify:

- Service Name
- Display Name
- Executable Path
- Parent Process
- Startup Type
- Running Account
- Hosting Process
- Creation Time

Understanding the architecture allows you to quickly distinguish expected behavior from suspicious activity.

---

# Analyst Tips

> 💡 Every Service is managed by the Service Control Manager.

> 💡 `services.exe` is the process that implements the SCM.

> 💡 Multiple `svchost.exe` processes are normal.

> ⚠ Never assume `svchost.exe` is malicious simply because many instances are running.

---

# Common Misconceptions

❌ SCM is a separate executable.

✔ SCM is implemented by `services.exe`.

---

❌ Every Service runs inside `svchost.exe`.

✔ Many Services run inside their own executable.

---

❌ Multiple `svchost.exe` processes indicate malware.

✔ Modern Windows intentionally runs many `svchost.exe` processes for stability and isolation.

---

# Key Takeaways

- The Service Control Manager manages every Windows Service.
- `services.exe` is the executable that implements the SCM.
- Services may run in a shared `svchost.exe` process or their own executable.
- Windows groups Services for stability and resource management.
- Understanding this architecture is essential for effective Service investigations.

---

# Self-Check

You should now be able to answer:

- What is the Service Control Manager?
- What is `services.exe`?
- Why are there multiple `svchost.exe` processes?
- How does Windows start Services?
- What is the lifecycle of a Service?

---

# Knowledge Graph

## Related Topics

- Introduction to Windows Services
- Service Configuration
- Service Accounts
- Windows Processes
- Windows Registry

## Related Event IDs

- 7035 — Service Control Request
- 7036 — Service State Changed
- 7040 — Startup Type Changed
- 7045 — New Service Installed

## Related MITRE ATT&CK

- T1543.003 – Create or Modify System Process: Windows Service

## Malware Examples

- TrickBot
- Ryuk
- PlugX

---

## Next Lesson

➡ **03_Service_Configuration.md**