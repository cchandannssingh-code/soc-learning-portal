---
title: 03_Configuration
description: Learn how Windows stores Service configuration, what each important registry value means, and which settings attackers commonly abuse.
difficulty: 🟡 Intermediate
estimated_time: 15 Minutes
module: Windows Services
prerequisites:
  - Introduction to Windows Services
  - Service Architecture
---

# Service Configuration

> **Goal:** Understand how Windows stores Service configuration and how configuration changes impact system behavior and security investigations.

---

# Learning Objectives

After completing this lesson, you will be able to:

- Identify where Service configuration is stored.
- Explain the purpose of common Service configuration values.
- Understand how Windows uses Service configuration during startup.
- Recognize which configuration settings attackers commonly modify.
- Investigate suspicious Service configuration changes.

---

# The Problem

Imagine Windows has just booted.

The Service Control Manager (SCM) knows it must start several Services.

But before it can do that, it must answer questions like:

- Which executable should I run?
- Should this Service start automatically?
- Which account should run it?
- Are there dependencies?
- Is this a driver or a user-mode Service?

The answers must be stored somewhere.

Windows stores all of this information in the **Registry**.

---

# Think Like Windows 🧠

> "I manage hundreds of Services.
>
> I need to remember how each one should behave.
>
> Instead of storing configuration in hundreds of text files,
> I'll keep everything in one central database.
>
> That database is the Windows Registry."

---

# Where is Service Configuration Stored?

Every Service has its own Registry key.

```
HKLM
└── SYSTEM
    └── CurrentControlSet
        └── Services
            └── <ServiceName>
```

Example:

```
HKLM\SYSTEM\CurrentControlSet\Services\WinDefend
```

Every subkey under **Services** represents one installed Service.

---

# How Windows Uses Service Configuration

```
Windows Boots
      │
      ▼
SCM Starts
      │
      ▼
Reads Registry
      │
      ▼
Loads Service Configuration
      │
      ▼
Starts Service
```

No Registry configuration means Windows doesn't know how to start the Service.

---

# Important Configuration Values

Most investigations focus on only a handful of Registry values.

---

## ImagePath

**Purpose**

Specifies the executable that Windows launches.

Example

```
ImagePath

C:\Program Files\Windows Defender\MsMpEng.exe
```

Why it matters

If an attacker changes this value:

```
Original

C:\Program Files\App\Service.exe

↓

Modified

C:\Users\Public\evil.exe
```

Windows will execute the malicious program instead.

This is a common persistence technique.

---

## Start

Determines **when** Windows starts the Service.

| Value | Startup Type |
|--------|--------------|
| 0 | Boot |
| 1 | System |
| 2 | Automatic |
| 3 | Manual |
| 4 | Disabled |

Changing this value changes the Service's startup behavior.

---

## Type

Defines what kind of Service it is.

Common values include:

| Value | Meaning |
|--------|----------|
| 1 | Kernel Driver |
| 2 | File System Driver |
| 16 | Standalone Service |
| 32 | Shared Service (`svchost.exe`) |

---

## ObjectName

Specifies the account that runs the Service.

Examples:

```
LocalSystem

LocalService

NetworkService
```

We'll study Service Accounts in the next lesson.

---

## DependOnService

Some Services require others to start first.

Example:

```
Service A

↓

Depends on

↓

Service B
```

If Service B fails, Service A may not start.

---

# Configuration Flow

```
Registry

↓

ImagePath

↓

Executable

↓

Process

↓

Running Service
```

Changing the Registry changes how Windows launches the Service.

---

# SOC Perspective

When investigating a suspicious Service, verify:

- Registry path
- ImagePath
- Startup Type
- Running account
- Dependencies
- Last modification time
- Executable location

Most Service investigations involve reviewing these values.

---

# Attacker Perspective

Attackers commonly modify:

✅ ImagePath

→ Launch malware

---

✅ Start

→ Ensure malware starts automatically

---

✅ ObjectName

→ Gain higher privileges

---

✅ Service Type

→ Install malicious driver Services

---

Instead of creating new Services, attackers often modify existing ones because they are less noticeable.

---

# Defender Perspective

During an investigation:

Verify:

- Has ImagePath changed?
- Is the executable digitally signed?
- Is the executable stored in an unusual location?
- Has the Startup Type recently changed?
- Is the Service running under the expected account?
- Are there unexpected Registry modifications?

Unexpected configuration changes should always be investigated.

---

# Analyst Tips

> 💡 Every installed Service has a Registry key.

> 💡 ImagePath tells Windows which executable to launch.

> ⚠ Changing ImagePath changes what Windows executes.

> 🚨 Attackers often modify existing Services instead of creating new ones.

---

# Common Misconceptions

❌ The Service executable stores its own configuration.

✔ Windows stores Service configuration in the Registry.

---

❌ Deleting the executable removes the Service.

✔ The Registry entry still exists until the Service is removed.

---

❌ Every Registry value is equally important.

✔ During investigations, ImagePath, Start, Type, ObjectName, and DependOnService are usually the most valuable.

---

# Key Takeaways

- Windows stores Service configuration in the Registry.
- Each Service has its own Registry key.
- ImagePath determines which executable runs.
- Start determines when the Service starts.
- ObjectName specifies which account runs the Service.
- Service configuration is a common target for attackers.

---

# Self-Check

After completing this lesson, you should be able to answer:

- Where is Service configuration stored?
- What is ImagePath?
- What does the Start value control?
- Why is ObjectName important?
- Why do attackers modify Service configuration?

If you can answer these questions confidently, you're ready for the next lesson.

---

# Knowledge Graph

## Related Topics

- Service Architecture
- Service Accounts
- Windows Registry
- Windows Processes

## Related Event IDs

- 7040 — Startup Type Changed
- 7045 — New Service Installed
- 4657 — Registry Value Modified (Auditing Enabled)

## Related MITRE ATT&CK

- T1543.003 — Create or Modify System Process: Windows Service

## Malware Examples

- TrickBot
- Ryuk
- PlugX
- Black Basta

---

## Next Lesson

➡ **04_Service_Accounts.md**