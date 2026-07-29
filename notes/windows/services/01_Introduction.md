---
title: 01_Introduction
description: Learn what Windows Services are, why they exist, and why they are essential for both Windows operation and security investigations.
difficulty: 🟢 Beginner
estimated_time: 10-15 Minutes
module: Windows Services
prerequisites: None
---

# Introduction to Windows Services

> **Goal:** Understand what Windows Services are, why they exist, and why every SOC analyst must understand them before investigating Windows systems.

---

# Learning Objectives

After completing this lesson, you will be able to:

- Explain what a Windows Service is.
- Understand why Windows needs Services.
- Differentiate a Service from an Application.
- Explain how Services start.
- Identify common Service States.
- Identify common Startup Types.
- Understand why attackers frequently abuse Services.

---

# The Problem

Imagine you press the power button on your computer.

Even before anyone logs in,

- Windows Defender is already protecting the system.
- Networking already works.
- DNS resolution already works.
- Time synchronization has started.
- Windows Update is running.

Nobody clicked an application.

Nobody logged in.

So...

**Who started all these programs?**

Windows needed a mechanism to automatically start important software during boot.

That mechanism is called a **Windows Service**.

---

# What is a Windows Service?

A **Windows Service** is a background program that performs a specific task for Windows or an installed application.

Unlike desktop applications, Services are designed to:

- Run in the background
- Start automatically (if configured)
- Continue running without user interaction
- Operate even when no user is logged in

A Service performs **one specific job** and allows Windows to function correctly.

---

# Think Like Windows 🧠

> "I cannot wait for a user to open important software.
>
> Antivirus must already be running.
>
> Networking must already be available.
>
> Time synchronization must already work.
>
> Therefore, I need a way to automatically start these programs.
>
> I'll use **Windows Services**."

This is exactly why Services exist.

---

# Real-World Examples

| Service | Purpose |
|----------|---------|
| Windows Defender | Malware protection |
| DHCP Client | Obtains an IP address |
| DNS Client | Resolves domain names |
| Windows Time | Synchronizes system time |
| Print Spooler | Handles printing |
| Windows Update | Downloads and installs updates |
| SQL Server | Runs database services |

These are all Windows Services performing different jobs.

---

# Service vs Application

Although both are executable programs, they are designed for different purposes.

| Windows Service | Desktop Application |
|-----------------|---------------------|
| Runs in background | Runs in foreground |
| Usually no GUI | Usually has a GUI |
| Can start automatically | Started by a user |
| Managed by Windows | Managed by the user |
| Runs without logon | Usually requires a logged-in user |

### Example

| Program | Type |
|----------|------|
| Microsoft Defender | Service |
| SQL Server | Service |
| Google Chrome | Application |
| Microsoft Word | Application |

---

# How Windows Starts Services

The process is surprisingly simple.

```
Computer Starts
        │
        ▼
Windows Boot
        │
        ▼
Service Control Manager (SCM)
        │
Reads Service Configuration
        │
Starts Required Services
        │
Running Windows Services
```

At this stage, simply remember:

> **The Service Control Manager (SCM) is responsible for starting, stopping, and managing Windows Services.**

The SCM will be discussed in detail in the next lesson.

---

# Service States

A Service can exist in only one state at a time.

| State | Description |
|--------|-------------|
| Running | Service is active |
| Stopped | Service is not running |
| Start Pending | Windows is starting the Service |
| Stop Pending | Windows is stopping the Service |
| Paused | Service execution is temporarily suspended |

---

# Startup Types

Startup Type determines **when** Windows starts a Service.

| Startup Type | Description |
|--------------|-------------|
| Automatic | Starts during system boot |
| Automatic (Delayed Start) | Starts shortly after boot |
| Manual | Starts only when requested |
| Disabled | Cannot be started until enabled |

Changing a Startup Type changes future behavior—it does not necessarily start or stop the Service immediately.

---

# SOC Perspective

As a SOC analyst, you will frequently investigate Windows Services because they are commonly used for:

- Persistence
- Privilege Escalation
- Defense Evasion
- Malware Execution

Many security alerts eventually lead to a Service investigation.

Examples include:

- Event ID 7045 (New Service Installed)
- Event ID 4697 (Service Installed)
- Suspicious `sc.exe` execution
- Service ImagePath modification
- Unexpected Startup Type changes

Understanding Services is one of the core Windows investigation skills.

---

# Attacker Perspective

Attackers like Windows Services because they can:

- Automatically start after reboot
- Run with high privileges
- Blend in with legitimate Services
- Remain unnoticed by users

Common attacker techniques include:

- Creating a new malicious Service
- Modifying an existing Service
- Replacing a Service executable
- Hijacking a Service DLL
- Exploiting weak Service permissions

Each of these techniques will be covered in later lessons.

---

# Defender Perspective

When investigating a Service-related alert, begin with these questions:

- Was a new Service created?
- Was an existing Service modified?
- Which executable does it launch?
- Is the executable digitally signed?
- Who created or modified the Service?
- Is the change expected?
- Does the executable exist on other systems?

These questions form the foundation of every Service investigation.

---

# Analyst Tips

> 💡 Every running Windows Service eventually becomes a **Process**.

> ⚠ A legitimate-looking Service Name does **not** guarantee a legitimate executable.

> 🚨 Most organizations rarely install new Services. Treat unexpected Service installations as potentially suspicious until verified.

---

# Common Misconceptions

❌ Every Process is a Service.

✔ No. Many Processes (for example, Chrome or Notepad) are not Services.

---

❌ Every Service runs under `svchost.exe`.

✔ No. Many Services run inside their own executable, such as Microsoft Defender (`MsMpEng.exe`).

---

❌ Every Service starts automatically.

✔ No. Services can be Automatic, Delayed, Manual, or Disabled.

---

# Key Takeaways

- Windows Services run important software in the background.
- Services allow Windows to function before any user logs in.
- The Service Control Manager manages all Services.
- Services are a common target for attackers.
- Understanding Services is essential for Windows investigations.

---

# Self-Check

After reading this lesson, you should be able to answer:

- Why do Windows Services exist?
- What is the difference between a Service and an Application?
- Who starts Windows Services?
- What are Service States?
- What are Startup Types?
- Why are Services attractive to attackers?

If you can confidently answer these questions, you're ready for the next lesson.

---

# Knowledge Graph

## Related Topics

- Service Architecture
- Service Configuration
- Windows Processes
- Windows Registry

## Related Event IDs

- 4697 — Service Installed
- 7045 — New Service Installed
- 7040 — Startup Type Changed

## MITRE ATT&CK

- T1543.003 — Create or Modify System Process: Windows Service

## Malware Examples

- TrickBot
- Ryuk
- PlugX
- Black Basta

---

## Next Lesson

➡ **02_Service_Architecture.md**