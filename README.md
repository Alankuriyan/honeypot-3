# 🛡️ Autonomous Cyber Deception & Honeypot Intelligence Platform

> **A Windows-based cyber deception platform that deploys realistic decoy assets, detects unauthorized interactions through Windows Security telemetry, collects attacker activity, analyzes access behavior, and presents actionable security intelligence through a web dashboard and backend API.**

## 🚨 Problem

After gaining access to an endpoint, attackers commonly perform reconnaissance to locate valuable information such as:

* credentials
* financial documents
* customer information
* network configuration
* database configuration
* sensitive files

Traditional monitoring produces large amounts of legitimate activity, making suspicious behavior difficult to identify.

Our project uses **Cyber Deception** to create high-value-looking decoy assets.

When an attacker interacts with a decoy, the interaction becomes a strong security signal.

---

# 💡 Our Solution

The system deploys realistic decoy files and continuously monitors Windows Security events for unauthorized interaction.

The complete detection pipeline is:

```text
                 ATTACKER
                     │
                     ▼
              Discovers Decoy
                     │
                     ▼
             Opens / Accesses File
                     │
                     ▼
        Windows Security Event 4663
                     │
                     ▼
               monitor.py
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
    Local Alert            Express API
          │                     │
          ▼                     ▼
   access_log.txt        Backend Database
          │                     │
          ▼                     ▼
    log_parser.py          Dashboard
          │
          ▼
   access_events.csv
          │
          ▼
   Security Reporting
```

---

# 🎯 Core Objective

The project transforms a simple honeypot into a complete **deception-driven security monitoring pipeline**:

```text
DEPLOY
   ↓
DETECT
   ↓
COLLECT
   ↓
NORMALIZE
   ↓
ANALYZE
   ↓
VISUALIZE
   ↓
REPORT
```

---

# 🪤 1. Intelligent Decoy Assets

The system maintains a centralized `decoy_registry.json`.

Current decoy categories include:

| Category    | Example                     |
| ----------- | --------------------------- |
| Credentials | `Passwords.txt`             |
| Credentials | `VPN_Credentials.txt`       |
| Financial   | `Salary_Report.txt`         |
| Financial   | `Financial_Report_2026.pdf` |
| Customer    | `Customer_List.txt`         |
| Network     | `Network_Config.txt`        |
| Network     | `Network_Diagram.png`       |
| Database    | `database_config.js`        |
| Employee    | `Employee_Salaries.xlsx`    |

These files are designed to appear interesting to an unauthorized user while functioning as **detection sensors**.

---

# 🔍 2. Windows Security Event Monitoring

The monitoring engine is implemented in Python.

`monitor.py` queries Windows Security logs for:

```text
Event ID: 4663
```

The event contains information about object access.

The monitor retrieves recent Windows Security events and analyzes their messages to determine whether a registered deception asset was accessed.

---

# 🧠 3. Decoy Matching Engine

The monitor does not treat every Windows 4663 event as an attack.

Instead:

```text
Windows Event
      ↓
Extract Event Message
      ↓
Compare Against Decoy Registry
      ↓
Full Path Match
      OR
Filename Match
      ↓
Decoy Interaction Detected
```

This is important because it reduces unnecessary alerts from unrelated file activity.

---

# 🚨 4. High-Confidence Security Signal

When a registered decoy is accessed, the system generates a security alert.

Example:

```text
====================================

[2026-08-08 12:00:00]
🚨 DECOY ACCESSED

File:
Passwords.txt

Path:
C:\Users\DELL\Desktop\Passwords.txt

Windows Event:
4663

Record ID:
12345

Event Time:
...

User:
...

Process:
...

Access:
...
```

The system captures important telemetry including:

* event ID
* Windows record ID
* decoy filename
* full file path
* username
* process name
* access type
* event timestamp
* severity

---

# 📡 5. Security Telemetry Pipeline

Once a decoy interaction is detected, the monitor sends structured telemetry to the Express backend.

The current API endpoint is:

```text
POST /api/events
```

The monitor sends structured event data containing fields such as:

```json
{
  "event_id": 4663,
  "record_id": "...",
  "file_name": "...",
  "file_path": "...",
  "user_name": "...",
  "process_name": "...",
  "access_type": "...",
  "event_time": "...",
  "severity": "HIGH"
}
```

This creates a clean separation between:

```text
Python
   ↓
Detection + Collection

Node.js / Express
   ↓
Backend + API + Storage

Dashboard
   ↓
Visualization
```

---

# 🧩 6. Python Monitoring Layer

### `monitor.py`

Responsible for:

* reading Windows Security events
* tracking previously processed event IDs
* loading registered decoys
* matching events against decoys
* extracting user information
* extracting process information
* extracting access information
* creating local alerts
* sending telemetry to the backend

The monitor also maintains state using `monitor_state.json` so previously processed Windows events are not repeatedly handled.

---

# 📋 7. Log Parsing Layer

### `log_parser.py`

The monitoring system produces structured local alerts in:

```text
access_log.txt
```

The parser converts those alerts into:

```text
access_events.csv
```

The CSV contains structured security telemetry:

```text
id
alert_time
file_name
file_path
event_id
event_time
user
process
access
```

This creates a simple telemetry pipeline:

```text
Windows Security Event
        ↓
monitor.py
        ↓
access_log.txt
        ↓
log_parser.py
        ↓
access_events.csv
```

---

# 🌐 8. Backend API

The project contains a Node.js / Express backend.

```text
honey/server/
├── server.js
├── database.js
├── package.json
└── package-lock.json
```

The backend receives security events from the Python monitoring component.

This architecture allows the monitoring layer and visualization layer to remain independent.

```text
Python Monitor
      │
      │ HTTP POST
      ▼
Express API
      │
      ▼
Backend Storage
      │
      ▼
Dashboard
```

---

# 📊 9. Security Dashboard

The project includes a browser-based dashboard:

```text
honey/dashboard/
├── index.html
├── app.js
└── style.css
```

The dashboard provides a visual interface for security telemetry rather than forcing a security analyst to inspect raw logs manually.

The intended workflow is:

```text
Raw Security Events
        ↓
Backend Processing
        ↓
Dashboard
        ↓
Security Analyst
```

---

# 📑 10. Automated Security Reporting

The project also includes a report-generation layer.

The report generator should consume the structured:

```text
access_events.csv
```

rather than depending on an unrelated SQLite database.

The generated report can summarize:

### Incident Overview

* total decoy interactions
* number of unique users
* number of targeted assets
* number of critical/high-risk events

### Targeted Assets

```text
Passwords.txt
VPN_Credentials.txt
Salary_Report.txt
Network_Config.txt
database_config.js
```

### Attack Categories

```text
Credential Access
Financial Data Access
Customer Data Access
Network Reconnaissance
Database Reconnaissance
```

### Activity Timeline

```text
Timestamp
    ↓
User
    ↓
Process
    ↓
Target Decoy
    ↓
Access Type
```

### Security Findings

Repeated access to credential or sensitive-data decoys can be highlighted as higher-priority findings.

---

# 🔐 Why Deception Works

The key security principle behind the project is:

> **A legitimate user generally has little reason to interact with specially deployed deception assets.**

For example:

```text
Normal Document
      ↓
Many legitimate users may access it
      ↓
High monitoring noise
```

Compared with:

```text
Passwords.txt
      ↓
Specifically deployed as a decoy
      ↓
Unauthorized access
      ↓
Strong indication of suspicious discovery
```

Therefore, deception provides **high-value, low-noise detection signals**.

---

# 🧠 Detection Intelligence

The platform does not simply monitor a directory.

It combines:

```text
Deception
+
Operating-System Telemetry
+
Event Correlation
+
Decoy Classification
+
Backend Telemetry
+
Visualization
+
Reporting
```

This turns individual file accesses into security intelligence.

---

# 🏗️ Complete Architecture

```text
┌──────────────────────────────────────────────────────┐
│                 WINDOWS ENDPOINT                     │
│                                                      │
│   ┌──────────────────────────────────────────────┐   │
│   │             DECOY ASSETS                     │   │
│   │                                              │   │
│   │ Passwords.txt                                │   │
│   │ VPN_Credentials.txt                          │   │
│   │ Salary_Report.txt                            │   │
│   │ Network_Config.txt                           │   │
│   │ database_config.js                            │   │
│   └─────────────────────┬────────────────────────┘   │
│                         │                            │
│                         ▼                            │
│              Windows Security Event 4663            │
│                         │                            │
│                         ▼                            │
│                  ┌──────────────┐                    │
│                  │  monitor.py  │                    │
│                  └──────┬───────┘                    │
│                         │                            │
│              ┌──────────┴──────────┐                 │
│              ▼                     ▼                 │
│       access_log.txt         Express API             │
│              │                     │                 │
│              ▼                     ▼                 │
│       log_parser.py          Backend Storage         │
│              │                     │                 │
│              ▼                     ▼                 │
│     access_events.csv        Security Dashboard      │
│                                                      │
└──────────────────────────────────────────────────────┘
                         │
                         ▼
                 Security Reports
```

---

# 🛠️ Technology Stack

| Technology        | Role                                      |
| ----------------- | ----------------------------------------- |
| Python            | Event monitoring and telemetry collection |
| PowerShell        | Windows Security Event retrieval          |
| Windows Event Log | Operating-system telemetry                |
| JSON              | Decoy registry and monitor state          |
| CSV               | Structured event storage/export           |
| Node.js           | Backend runtime                           |
| Express.js        | Security telemetry API                    |
| JavaScript        | Dashboard logic                           |
| HTML/CSS          | Dashboard interface                       |

---

# 📁 Repository Structure

```text
honeypot-3/
│
└── honey/
    │
    ├── monitor.py
    ├── log_parser.py
    ├── setup.ps1
    ├── decoy_registry.json
    ├── decoy.txt
    ├── test.txt
    ├── access_events.csv
    │
    ├── dashboard/
    │   ├── index.html
    │   ├── app.js
    │   └── style.css
    │
    └── server/
        ├── server.js
        ├── database.js
        ├── package.json
        └── package-lock.json
```

This reflects the current repository structure rather than describing a separate architecture.

---

# 🚀 Execution Flow

## Step 1 — Deploy Decoys

The setup process creates/registers deception assets.

```text
setup.ps1
    ↓
Decoy Files
    ↓
decoy_registry.json
```

## Step 2 — Start Backend

```bash
cd honey/server
npm install
node server.js
```

## Step 3 — Start Monitor

```bash
cd honey
python monitor.py
```

## Step 4 — Simulate Unauthorized Access

Access one of the registered decoy files.

Example:

```text
Passwords.txt
```

## Step 5 — Detect

Windows generates:

```text
Event ID 4663
```

## Step 6 — Correlate

`monitor.py` checks whether the event references a registered decoy.

## Step 7 — Collect

The event is:

```text
Logged locally
+
Sent to Express API
```

## Step 8 — Parse

`log_parser.py` converts the local alert log into structured CSV telemetry.

## Step 9 — Visualize

The dashboard presents the collected security information.

## Step 10 — Report

The reporting layer converts the structured telemetry into a security incident report.

---

# 🧪 Example Attack Scenario

Imagine an attacker gains access to a Windows workstation.

They begin searching for valuable files.

They discover:

```text
C:\Users\DELL\Desktop\Passwords.txt
```

The attacker opens the file.

Windows records the object-access event:

```text
4663
```

The monitor detects that the accessed path matches a registered deception asset.

The system then:

```text
Detects
   ↓
Classifies
   ↓
Records
   ↓
Sends telemetry
   ↓
Displays
   ↓
Reports
```

The security analyst can then investigate:

* who accessed it
* when it was accessed
* which process accessed it
* which decoy was targeted
* what access operation occurred
* whether similar decoys were accessed

---

# 🏆 What Makes This Project Different?

The project is not only a fake-file generator.

It implements an end-to-end **cyber deception telemetry pipeline**:

### 1. Deception

Realistic-looking decoy assets attract unauthorized attention.

### 2. Detection

Windows Security telemetry identifies object-access activity.

### 3. Correlation

Events are matched against the registered decoy inventory.

### 4. Telemetry

Relevant attacker activity is extracted into structured data.

### 5. Backend Integration

Python monitoring communicates with an Express backend.

### 6. Visualization

Security events are exposed through a web dashboard.

### 7. Reporting

Collected telemetry can be converted into an incident report.

---

# 🔮 Future Roadmap

The architecture can be extended with:

* AI-assisted attacker behavior analysis
* MITRE ATT&CK technique mapping
* Threat-intelligence enrichment
* IP reputation analysis
* automated attacker profiling
* honeytokens for credentials and secrets
* canary URLs
* process-behavior analysis
* automated containment
* real-time WebSocket alerts
* SIEM integration
* machine-learning-based anomaly detection
* automated incident-response playbooks

These are future extensions and are intentionally separated from the currently implemented functionality.

---

# 🎯 Project Vision

The long-term goal is to evolve the platform from a Windows decoy-file monitor into an **adaptive cyber-deception intelligence platform**.

```text
STATIC DECOYS
      ↓
INTELLIGENT DECEPTION
      ↓
ATTACKER TELEMETRY
      ↓
BEHAVIOR ANALYSIS
      ↓
THREAT INTELLIGENCE
      ↓
AUTOMATED RESPONSE
```

### Core principle

> **Turn attacker curiosity into high-confidence security intelligence.**

---

# ⚠️ Responsible Use

This project is intended for:

* authorized security research
* cybersecurity education
* controlled laboratory environments
* defensive security testing
* authorized enterprise monitoring

Do not deploy monitoring or deception mechanisms on systems you do not own or have permission to monitor.

---

# ⭐ Keywords

`Cybersecurity` `Cyber Deception` `Honeypot` `Honeypot Monitoring` `Windows Security` `Event 4663` `Threat Detection` `Security Telemetry` `Decoy Assets` `Honeytokens` `Incident Response` `Security Dashboard` `Python` `Node.js` `Express.js` `Threat Intelligence` `SOC` `Blue Team`

---

# 🔗 Repository

**GitHub:** https://github.com/Alankuriyan/honeypot-3

---

## 👥 Project Summary

**Honeypot-3** is a Windows cyber-deception platform that uses realistic decoy assets as detection sensors. It monitors Windows Security Event 4663, identifies interactions with registered decoys, extracts attacker-related telemetry, sends events to an Express backend, generates structured event data, and presents the information through a security dashboard.

The project demonstrates an end-to-end defensive security workflow:

> **DECEIVE → DETECT → COLLECT → CORRELATE → VISUALIZE → REPORT**
