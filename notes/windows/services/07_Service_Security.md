---
title: 07_Service Security
description: Learn how Windows protects Services using permissions, access control, and security descriptors, and why these protections matter in security investigations.
difficulty: 🟡 Intermediate
estimated_time: 18 Minutes
module: Windows Services
prerequisites:
  - Introduction to Windows Services
  - Service Architecture
  - Service Configuration
  - Service Accounts
  - services.exe and svchost.exe
  - Service Management
---

# Service Security

> **Goal:** Understand how Windows protects Services from unauthorized access and why weak Service security can lead to privilege escalation.

---

# Learning Objectives

After completing this lesson, you will be able to:

- Explain why Windows protects Services.
- Understand Service permissions.
- Explain Service security descriptors.
- Recognize common Service security weaknesses.
- Understand how weak Service security can lead to attacks.

---

# The Problem

Imagine every user on a computer could:

- Stop Windows Defender
- Disable Event Logging
- Modify Windows Update
- Restart LSASS
- Replace critical Services

Windows would become unstable and insecure.

Windows needs a way to decide:

- Who can start a Service?
- Who can stop it?
- Who can modify it?
- Who can delete it?

Windows solves this with **Service Security**.

---

# Think Like Windows 🧠

> "Every Service is an important system resource.
>
> Not everyone should be able to control it.
>
> I'll assign permissions to every Service, just like I do for files and folders."

---

# What is Service Security?

Every Windows Service has its own **security descriptor**.

This security descriptor defines:

- Who can read the Service
- Who can start it
- Who can stop it
- Who can modify its configuration
- Who can delete it

Think of it as a permission list for the Service.

---

# How Windows Protects Services

```
User

↓

Requests Action

↓

Windows Checks Permissions

↓

Allowed?

↓

Yes → Perform Action

No → Access Denied
```

Windows validates permissions before allowing any Service operation.

---

# Common Service Permissions

| Permission | Allows |
|------------|--------|
| Query Status | View current state |
| Start | Start the Service |
| Stop | Stop the Service |
| Pause/Continue | Pause or resume |
| Change Config | Modify Service configuration |
| Delete | Remove the Service |
| Read Security | View permissions |
| Write Security | Modify permissions |

Different users receive different permissions.

---

# Who Usually Has Access?

Typical permission model:

| Account | Typical Access |
|----------|----------------|
| SYSTEM | Full Control |
| Administrators | Full Control |
| TrustedInstaller | Full Control (critical Services) |
| Standard Users | Limited or Read Only |

This prevents ordinary users from changing critical Services.

---

# Security Descriptor (Concept)

Internally, Windows stores Service permissions in a **Security Descriptor**.

It contains:

- Owner
- Group
- DACL (permissions)
- SACL (auditing)

If you've worked with NTFS permissions, the concept is very similar.

---

# Example

```
Windows Defender

↓

Administrators

✓ Start

✓ Stop

✓ Configure

Standard User

✓ Read

❌ Modify

❌ Stop
```

The Service behaves differently depending on the user's permissions.

---

# Why Service Security Matters

If Service permissions are configured incorrectly:

A low-privileged user may be able to:

- Change ImagePath
- Replace the executable
- Modify startup settings
- Restart the Service

If that Service runs as **LocalSystem**, the attacker could gain SYSTEM privileges.

---

# SOC Perspective

When investigating a suspicious Service, ask:

- Who owns the Service?
- Who can modify it?
- Can ordinary users change its configuration?
- Is the Service running as LocalSystem?
- Does it have overly permissive access?

These questions help identify privilege escalation opportunities.

---

# Attacker Perspective

Attackers search for Services where they have permissions they shouldn't.

Common targets include:

- Weak Service Permissions
- Writable Service Executables
- Writable Service Directories
- Weak Registry Permissions
- Unquoted Service Paths

These weaknesses can allow code execution as SYSTEM.

---

# Defender Perspective

During investigations:

Verify:

- Service permissions
- Executable permissions
- Registry permissions
- Startup configuration
- Service Account
- Recent configuration changes

Misconfigured permissions should be treated as security findings, even if no attack has occurred.

---

# Analyst Tips

> 💡 Every Service has a security descriptor.

> 💡 Service permissions are separate from file permissions.

> 💡 A Service running as LocalSystem is only safe if its permissions are properly configured.

> 🚨 Weak Service permissions are one of the most common Windows privilege escalation vectors.

---

# Common Misconceptions

❌ If the executable is secure, the Service is secure.

✔ The Service object itself has its own permissions.

---

❌ Only administrators can misconfigure Services.

✔ Third-party installers sometimes create Services with weak permissions.

---

❌ Every Service has the same security settings.

✔ Each Service has its own security descriptor.

---

# Key Takeaways

- Every Windows Service has its own security descriptor.
- Permissions determine who can control a Service.
- Weak Service permissions can enable privilege escalation.
- Service security and file security are separate concepts.
- Reviewing Service permissions is an important part of security investigations.

---

# Quick Reference

Security protects:

✓ Start

✓ Stop

✓ Configure

✓ Delete

✓ Read

✓ Modify

---

Important Concepts

- Security Descriptor
- DACL
- SACL
- Least Privilege

---

# Self-Check

You should now be able to answer:

- Why does Windows protect Services?
- What is a Service security descriptor?
- What permissions can a Service have?
- Why are weak Service permissions dangerous?
- How can weak permissions lead to privilege escalation?

---

# Knowledge Graph

## Related Topics

- Service Accounts
- Service Configuration
- Windows Security
- Windows Access Tokens
- NTFS Permissions

## Related MITRE ATT&CK

- T1543.003 – Create or Modify System Process: Windows Service
- T1574 – Hijack Execution Flow

## Related Event IDs

- 4697 – Service Installed
- 7040 – Startup Type Changed
- 7045 – New Service Installed

## Advanced Reading

📘 Security Descriptors (SDDL)

📘 Access Tokens

📘 Service Control Manager APIs

📘 Protected Services

---

## Next Lesson

➡ **08_Service_Abuse.md**