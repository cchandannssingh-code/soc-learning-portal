---
title: 04_Service_Accounts
description: Learn how Windows Service Accounts work, why they exist, and why they are important during security investigations.
difficulty: 🟡 Intermediate
estimated_time: 15 Minutes
module: Windows Services
prerequisites:
  - Introduction to Windows Services
  - Service Architecture
  - Service Configuration
---

# Service Accounts

> **Goal:** Understand which accounts Windows Services use, why different accounts exist, and how attackers abuse highly privileged Service Accounts.

---

# Learning Objectives

After completing this lesson, you will be able to:

- Explain what a Service Account is.
- Identify the most common Service Accounts.
- Understand the privileges of each account.
- Determine which account a Service runs under.
- Explain why attackers target privileged Service Accounts.

---

# The Problem

Imagine Windows starts a Service.

Windows knows:

- Which executable to launch
- When to start it
- Which configuration to use

But one important question remains.

**Who should run this Service?**

For example:

- Should Windows Defender have administrator-level privileges?
- Should the DNS Client have full control of the operating system?
- Should SQL Server run as SYSTEM?

Not every Service needs the same permissions.

Windows solves this using **Service Accounts**.

---

# Think Like Windows 🧠

> "Every Service performs a different job.
>
> Some need complete control.
>
> Others only need limited access.
>
> Instead of giving every Service maximum privileges,
> I'll assign each Service an appropriate account."

This follows the **Principle of Least Privilege**.

---

# What is a Service Account?

A **Service Account** is the identity under which a Windows Service runs.

The assigned account determines:

- What files the Service can access
- Which Registry keys it can modify
- Which processes it can interact with
- Which network resources it can access
- What system privileges it receives

Simply put:

> **The Service Account defines what a Service is allowed to do.**

---

# Common Service Accounts

Windows includes several built-in Service Accounts.

| Account | Privilege Level | Typical Use |
|----------|-----------------|-------------|
| LocalSystem | Very High | Core Windows Services |
| LocalService | Low | Local system tasks |
| NetworkService | Medium | Services requiring network access |
| User / Domain Account | Varies | Enterprise applications |

---

# LocalSystem

The **LocalSystem** account has the highest privileges on the local computer.

Characteristics:

- Full access to the operating system
- Can load drivers
- Can access protected system resources
- Almost unlimited local privileges

Examples:

- Windows Defender
- Task Scheduler
- Windows Event Log

---

# LocalService

The **LocalService** account is designed for Services that require very limited permissions.

Characteristics:

- Minimal local privileges
- Presents anonymous credentials over the network
- Reduces the impact of compromise

Examples include lightweight Windows background services.

---

# NetworkService

The **NetworkService** account is similar to LocalService but can authenticate to remote systems using the computer account.

Characteristics:

- Limited local privileges
- Network authentication capability
- Commonly used by networking components

Examples:

- Network-related Windows Services
- IIS components

---

# User or Domain Accounts

Some enterprise applications run under dedicated user accounts.

Examples:

- SQL Server
- Microsoft Exchange
- Backup software
- Monitoring tools

These accounts are often managed by system administrators.

---

# Where is the Service Account Stored?

The Service Account is stored in the Service configuration.

Registry value:

```
ObjectName
```

Examples:

```
LocalSystem

LocalService

NetworkService

DOMAIN\SQLService
```

---

# Service Startup

```
SCM
    │
Reads Configuration
    │
Reads ObjectName
    │
Logs on Account
    │
Starts Service
```

The Service starts using the permissions of its assigned account.

---

# SOC Perspective

One of the first questions during a Service investigation is:

**Which account is running this Service?**

If a suspicious executable is running as:

```
LocalSystem
```

the potential impact is significantly greater than if it runs as:

```
LocalService
```

Privilege matters.

---

# Attacker Perspective

Attackers often target Services running as **LocalSystem** because compromising such a Service can provide complete control over the system.

Common techniques include:

- Replacing the Service executable
- Modifying ImagePath
- Exploiting weak Service permissions
- DLL hijacking
- Unquoted Service Paths

If the compromised Service runs as LocalSystem, the malware also executes with LocalSystem privileges.

---

# Defender Perspective

During an investigation, verify:

- Which account runs the Service?
- Is the account expected?
- Has the account recently changed?
- Is a privileged account necessary?
- Is a domain account being used?
- Does the Service require such privileges?

Unexpected changes to the Service Account should always be investigated.

---

# Analyst Tips

> 💡 LocalSystem is the most privileged built-in Service Account.

> 💡 Not every Service should run as LocalSystem.

> ⚠ A Service running as LocalSystem deserves extra attention because any compromise can have severe impact.

> 🚨 Enterprise applications running under Domain Accounts should be reviewed carefully, as they may have access to sensitive network resources.

---

# Common Misconceptions

❌ Every Service runs as LocalSystem.

✔ No. Windows provides multiple Service Accounts with different privilege levels.

---

❌ LocalService and NetworkService are identical.

✔ No. NetworkService can authenticate to remote systems, while LocalService typically cannot.

---

❌ A Service Account is always a local account.

✔ No. Enterprise applications often use dedicated Domain Accounts or Group Managed Service Accounts (gMSA).

---

# Key Takeaways

- Every Windows Service runs under a Service Account.
- The Service Account determines the permissions available to the Service.
- LocalSystem has the highest local privileges.
- Windows uses different Service Accounts to follow the Principle of Least Privilege.
- Compromising a highly privileged Service Account can lead to complete system compromise.

---

# Self-Check

You should now be able to answer:

- What is a Service Account?
- Why do different Service Accounts exist?
- What is LocalSystem?
- What is the difference between LocalService and NetworkService?
- Why do attackers target LocalSystem Services?

---

# Knowledge Graph

## Related Topics

- Service Configuration
- Service Security
- Windows Security
- Windows Access Tokens

## Related Registry Value

- ObjectName

## Related MITRE ATT&CK

- T1543.003 – Create or Modify System Process: Windows Service
- T1574 – Hijack Execution Flow

## Malware Examples

- TrickBot
- Ryuk
- Black Basta

---

## Advanced Reading

📘 Group Managed Service Accounts (gMSA)

📘 Virtual Service Accounts

📘 Service SIDs

---

## Next Lesson

➡ **05_svchost_and_services.exe.md**