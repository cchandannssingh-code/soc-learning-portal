---
title: "Event ID 4624"
---

# Event ID 4624

## Description

Event ID 4624 indicates:

- Successful logon
- Authentication success
- User login tracking

---

## Why It Is Important

This event is highly valuable because it documents:

- Every successful login attempt
- User account usage
- Logon type
- Source workstation
- Authentication activity

---

## Important Fields

| Field | Description |
|---|---|
| Account Name | User logged in |
| Source IP | Login source |
| Logon Type | Interactive/Remote/etc |
| Workstation Name | Device name |

---

## Related Events

- 4634 → Logoff
- 4647 → User initiated logoff
- 4648 → Explicit credentials used

---

## Example SPL Query

```spl
index=windows EventCode=4624
```

---

## Investigation Tips

1. Check unusual login hours
2. Verify source IP
3. Correlate with failed logons
4. Look for lateral movement

---

## Kerberos Authentication Flow

![Kerberos Flow](/images/kerberos-flow.png)

Client requests TGT from KDC.