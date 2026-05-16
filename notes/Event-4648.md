# Event ID 4648

## Definition

Generated when explicit credentials are used.

## Common Attack Usage

- Pass-the-Hash
- PsExec
- WinRM

## Investigation Steps

1. Identify source process
2. Check TargetUserName
3. Correlate with 4624
4. Review PowerShell activity