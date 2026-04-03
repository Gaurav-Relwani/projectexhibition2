# 🛡️ SecureVault: Sovereign Digital Fortress

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg) ![Security](https://img.shields.io/badge/Security-Enterprise%20Grade-red) ![Status](https://img.shields.io/badge/Status-Prototype%20Live-success)

> **"Adaptive Security. Zero-Data-Loss Migration. Active Defense."**

SecureVault is a next-generation file management ecosystem designed for high-security institutions. It solves the critical problem of **"Protocol Paralysis"**—allowing ministries to update identity standards (e.g., changing Agent IDs from `AGT-XXX` to `CYBER-XXX`) without data loss, while actively trapping intruders using heuristic analysis.

---

## 🚨 The Problem
Traditional government systems are **rigid** and **passive**.
1.  **Protocol Paralysis:** Updating a naming convention usually requires database migrations, downtime, and often leads to orphaned accounts.
2.  **Passive Defense:** Standard firewalls block attacks but do not trap the attacker, allowing infinite retries.

## ⚡ The Solution: SecureVault
We built a **Self-Healing, Active-Defense Ecosystem** that evolves with policy.
* **Rebirth Protocol:** A migration engine that detects legacy users during login and forces a secure, atomic identity update without losing file ownership.
* **Active Honeypot:** Instead of blocking SQL Injection attempts, we weaponize them. Attackers are silently redirected to a forensic "Trap Room."
* **Dynamic Policy Engine:** Admins can update validation logic (Regex) in real-time without redeploying code.

---

## 🌟 Key Features

### 1. 🔄 The "Rebirth" Migration Engine (USP)
* **Zero-Data-Loss:** If the Ministry updates ID formats, old users are prompted to migrate via a secure modal.
* **Atomic Propagation:** Instantly updates User Profiles, Access Logs, File Ownership, and Request History in one transaction.

### 2. 🕸️ Active Defense (Honeypot)
* **Heuristic Detection:** Scans for patterns like `' OR 1=1`, `UNION SELECT`, `DROP TABLE`.
* **Containment:** Redirects attackers to a fake "System Recovery" page (`/honeypot`) to waste their time and log their IP.

### 3. 👁️ God-Mode Admin Console
* **Live Telemetry:** Real-time scrolling audit logs of all system activity.
* **Dynamic Firewall:** Update ID Regex patterns and allowed domains instantly.
* **Kill Switch:** Emergency "System Lockdown" button to freeze all API access.

### 4. 📂 Granular Access Control
* **Sector Security:** Restrict access to specific departments (HR, Nuclear Ops).
* **Ephemeral Clearance:** Users must request time-bound access to high-security sectors.

---

## 🛠️ Tech Stack

**Frontend:**
* ![Next.js](https://img.shields.io/badge/-Next.js%2014-black?logo=next.js) **Next.js 14:** Server-side rendering for security and speed.
* ![Tailwind](https://img.shields.io/badge/-Tailwind%20CSS-38B2AC?logo=tailwind-css) **Tailwind CSS:** For the "Cyber-Punk" aesthetic.
* ![Framer Motion](https://img.shields.io/badge/-Framer%20Motion-black) **Framer Motion:** For cinematic animations and modals.

**Backend:**
* ![Node.js](https://img.shields.io/badge/-Node.js-339933?logo=node.js) **Node.js & Express:** Robust API handling.
* ![JWT](https://img.shields.io/badge/-JWT-000000?logo=json-web-tokens) **JWT:** Stateless, encrypted session management.
* **JSON Persistence:** Custom-built, cloud-agnostic data storage (NoSQL simulation) for rapid prototyping and deployment.

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v18+)
* npm

### Installation

1.  **Clone the Repository**
    ```bash
    git clone [https://github.com/your-username/secure-vault.git](https://github.com/your-username/secure-vault.git)
    cd secure-vault
    ```

2.  **Setup Backend (Server)**
    ```bash
    # From root directory
    npm install
    node server.js
    ```
    *Server runs on Port 5000*

3.  **Setup Frontend (Client)**
    ```bash
    # Open a new terminal
    cd client
    npm install
    npm run dev
    ```
    *Client runs on Port 3000*

---

## 🎮 How to Demo (For Judges)

### Scenario 1: The Active Defense (Honeypot)
1.  Go to the **Login Page**.
2.  Enter Username: `' OR 1=1` (or `admin' --`).
3.  Enter any password and click **Authenticate**.
4.  **Result:** You will be redirected to the "System Failure" Trap Page.

### Scenario 2: The "Rebirth" Migration
1.  **Register** a user with the default format (e.g., `AGT-001`).
2.  Login as Admin (**Credentials below**) and go to **Firewall Rules**.
3.  Change ID Pattern to: `^CYBER-\d{3}$` and click **Update**.
4.  Go back to Login. Try logging in as `AGT-001`.
5.  **Result:** The "Policy Update" Modal appears. Enter `CYBER-001` to migrate.

### Scenario 3: Admin Powers
1.  Login to Admin Console.
2.  Observe the **Live Audit Log** showing the intrusion attempts.
3.  Toggle **"System Lockdown"** and try to login as a user (Access will be denied).

---

## 🔑 Default Credentials

| Role | Username | Password |
| :--- | :--- | :--- |
| **System Admin** | `sys_admin` | `master_key_v1` |
| **Test Agent** | *Register New* | *Your Choice* |

---

## 📂 Project Structure
secure-vault/
├── client/                 # Next.js Frontend
│   ├── src/app/page.tsx    # Login & Migration Logic
│   └── src/app/dashboard/  # Secure File System
├── server.js               # Node.js Backend & Security Middleware
├── data/                   # JSON Persistence Layer
│   ├── users.json          # Encrypted User Profiles
│   ├── settings.json       # Dynamic Policy Config
│   └── logs.json           # Audit Telemetry
└── README.md               # Documentation

---

## 🛡️ License
This project is developed for educational and hackathon purposes. All rights reserved by **Team Innoventure**.

> *"Data is Sovereign. Defense is Active."*
