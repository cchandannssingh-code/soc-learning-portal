# Timechart Command

## Overview

The `timechart` command is a transforming command in Splunk that creates **time-based statistical aggregations**. It groups events into time intervals (buckets) and applies statistical functions such as `count`, `sum`, `avg`, `min`, `max`, or `dc`.

It is one of the most commonly used commands for dashboards, trend analysis, monitoring, and SOC investigations.

---

## Why Use `timechart`?

Instead of simply counting events, SOC analysts often need to answer questions like:

- How many failed logins occurred every hour?
    
- Is malware activity increasing over time?
    
- Which host generated the most events today?
    
- When did the attack start?
    
- Are authentication failures spiking?
    

The `timechart` command is designed to answer these types of time-based questions.

---

## Syntax

```spl
... | timechart [options] <aggregation>(<field>)
```

### Basic Syntax

```spl
... | timechart count
```

### With Aggregation

```spl
... | timechart avg(duration)
```

### With Grouping

```spl
... | timechart count BY host
```

### With Custom Time Span

```spl
... | timechart span=1h count
```

---

## Parameters

|Parameter|Description|
|---|---|
|span|Defines the time bucket (1m, 5m, 1h, 1d, etc.)|
|BY|Splits results by another field|
|limit|Limits the number of series displayed|
|usenull|Includes events without the BY field|
|useother|Groups remaining values into "OTHER"|

---

## Supported Aggregation Functions

Some commonly used statistical functions:

- count
    
- sum()
    
- avg()
    
- min()
    
- max()
    
- dc() (Distinct Count)
    
- values()
    
- latest()
    
- earliest()
    

Example:

```spl
index=windows
| timechart dc(user)
```

---

# Examples

## Example 1 – Count Events Over Time

```spl
index=windows
| timechart count
```

Result:

```text
10:00   120
11:00   185
12:00   241
13:00   198
```

---

## Example 2 – Failed Logons Per Hour

```spl
index=windows EventCode=4625
| timechart span=1h count
```

This displays failed logons every hour.

---

## Example 3 – Successful Logons by Host

```spl
index=windows EventCode=4624
| timechart count BY host
```

Each host becomes its own line on the graph.

---

## Example 4 – Average Response Time

```spl
index=web
| timechart avg(response_time)
```

Useful for performance monitoring.

---

## Example 5 – Distinct Users

```spl
index=windows
| timechart dc(user)
```

Shows the number of unique users over time.

---

# Common SOC Use Cases

## Authentication Monitoring

```spl
index=windows EventCode=4625
| timechart span=30m count
```

Detect spikes in failed logins.

---

## PowerShell Monitoring

```spl
index=windows EventCode=4104
| timechart span=15m count
```

Monitor PowerShell script execution.

---

## RDP Activity

```spl
index=windows EventCode=4624 LogonType=10
| timechart count
```

Visualize Remote Desktop logons.

---

## Malware Detection

```spl
index=edr malware=*
| timechart count
```

Track malware detections over time.

---

## DNS Requests

```spl
index=dns
| timechart count BY query_type
```

Analyze DNS traffic patterns.

---

# Real Investigation Scenario

### Incident

A SOC analyst receives an alert about a possible password spraying attack.

To determine when the attack started and how it progressed:

```spl
index=windows EventCode=4625
| timechart span=5m count
```

The resulting graph immediately shows whether failed logons suddenly increased, helping identify the attack window.

---

# Difference Between `stats` and `timechart`

|stats|timechart|
|---|---|
|General statistical aggregation|Time-based aggregation|
|Does not automatically use `_time`|Automatically groups by time|
|Better for reports|Better for dashboards and trend analysis|

---

# Performance Considerations

- Always specify an appropriate time range.
    
- Use a suitable `span` value.
    
- Avoid extremely small spans over long time ranges.
    
- Filter data before using `timechart`.
    

Example:

Good:

```spl
index=windows EventCode=4625
| timechart span=1h count
```

Poor:

```spl
index=*
| timechart span=1s count
```

---

# Common Mistakes

- Forgetting to set an appropriate time range.
    
- Using very small `span` values unnecessarily.
    
- Expecting `timechart` to work without a valid timestamp.
    
- Using `timechart` when `stats` is more appropriate.
    

---

# Interview Questions

### Q1. What is the purpose of the `timechart` command?

**Answer:**  
It performs time-based statistical aggregation by grouping events into time intervals.

---

### Q2. What is the difference between `stats` and `timechart`?

**Answer:**  
`stats` performs general statistical aggregation, whereas `timechart` automatically aggregates data over time.

---

### Q3. What does the `span` parameter do?

**Answer:**  
It controls the size of each time bucket (for example, 5 minutes, 1 hour, or 1 day).

---

# Hands-on Practice

### Exercise 1

Create a graph showing failed logins every hour.

---

### Exercise 2

Display successful logons grouped by host.

---

### Exercise 3

Find the average web response time over time.

---

# Quick Summary

- Creates time-based statistical charts.
    
- Automatically groups events by `_time`.
    
- Commonly used for dashboards and monitoring.
    
- Supports all major statistical functions.
    
- One of the most frequently used commands in Splunk SOC investigations.
    

---

# Related Commands

- `stats`
    
- `chart`
    
- `eventstats`
    
- `streamstats`
    
- `bin`
    

---

# Official Documentation

- Splunk Search Reference – `timechart`