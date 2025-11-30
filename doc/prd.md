# **1\. Product Overview**

**Callio** is a cloud-based outbound call center and lead management platform enabling companies to manage campaigns, oversee agents, monitor live calls, distribute leads, analyze performance, and record communication history.

The system integrates:

- **Frontend:** React, TanStack Start, TanStack Query, TanStack Store, Chakra UI, Tailwind spacing, React Hook Form, Zod
- **Backend:** Java Spring Boot
- **Telephony:** Asterisk PBX, WebRTC softphone, GOIP GSM hardware
- **Real-Time Features:** Live audio monitoring, whisper coaching, call barging, call recordings, call transcripts

Callio supports **four core user roles**:

1. **Super Admin (Platform level)**
2. **Admin (Client/company level)**
3. **Supervisor (SPV)**
4. **Agent**

Each role has specific responsibilities and system access boundaries.

---

# **2\. Goals & Objectives**

- Provide a scalable outbound call center platform
- Enable multi-company (client-based) call center operations
- Support real-time telephony features (spy, whisper, barge, recording, transcription)
- Improve agent productivity with unified dashboards
- Empower Admins to manage campaigns and lead distribution
- Enable Supervisors to coach and evaluate agents
- Provide secure and compliant data management

---

#

# **3\. User Roles & Permissions**

---

# **3.1 Super Admin (Platform Owner)**

Super Admin manages the **entire Callio platform** and all client organizations.

### **Responsibilities**

- Manage clients (B2B companies)
- Manage subscription and payment history
- Monitor Asterisk server health and infrastructure
- Manage internal platform-level users
- Provide login credentials to client Admins
- Manage platform analytics

### **Super Admin Features**

1. **Client Management**
   - Create / edit / deactivate clients
   - View client details
   - Payment history
   - Manage client-level Admin users

2. **Server Monitoring**
   - Traffic dashboard
   - Call volume
   - Active channels
   - GOIP hardware status
   - Uptime & system health
   - CPU / RAM / Storage monitoring
   - Error logs
   - Audit logs

3. **Internal User Management**
   - Create internal account managers
   - Role assignment for internal staff

---

# **3.2 Admin (Client Level)**

Admin manages **call center operations for their company**.

### **Responsibilities**

- Manage supervisors and agents
- Manage campaigns
- Distribute leads
- Monitor performance
- Access recordings and reports

### **Admin Features**

1. **KPI Dashboard**
   - Overview of all campaigns
   - Call statistics
   - Lead progress (hot/warm/cold)
   - Agent workload
   - Appointment summary

2. **Campaign Management**
   - Create/edit campaigns
   - Assign agents or supervisors
   - Campaign scheduling

3. **Lead Management**
   - Upload leads (CSV)
   - Auto deduplicate
   - Distribute leads to supervisors or agents
   - Monitor lead statuses

4. **Agent Activity Monitoring**
   - Live agent status (on call, idle, offline)
   - Realtime call tracking
   - Activity logs

5. **Recordings & Files**
   - Search recordings
   - Listen/download recordings
   - Access call transcripts

6. **Report Analysis**
   - Agent-level report
   - Campaign summary
   - Call disposition metrics
   - Export to CSV/PDF

7. **User Management**
   - Create Supervisors (SPVs)
   - Create Agents
   - Assign to teams
   - Reset credentials

---

# **3.3 Supervisor (SPV)**

Supervisor oversees a **team of Agents**, providing coaching and quality control.

### **Responsibilities**

- Monitor live calls for their assigned agents
- Provide coaching (whisper)
- Intervene in calls (barge-in)
- Review call history and agent performance
- Download recordings
- Add coaching notes & scoring

### **Supervisor Features**

1. **Supervisor Dashboard**
   - Team performance summary
   - Live agent statuses
   - Lead progress summary
   - Daily activity overview

2. **Team Monitoring**
   - List of assigned agents
   - Live call monitoring
   - Spy (listen silently)
   - Whisper (coach agent only)
   - Barge (enter call)
   - View daily logs

3. **Recordings (Team Only)**
   - Access recordings from assigned agents
   - Playback with transcript
   - Download recording

4. **Agent History**
   - Review call logs
   - Review follow-up notes
   - Review appointment outcomes
   - Provide evaluation & coaching notes

5. **Team Leads**
   - View distributed leads
   - Track progress (hot/warm/cold)
   - View lead-level history

**SPV Restrictions**

- Cannot create agents
- Cannot upload leads
- Cannot modify campaigns
- Cannot access global reports

---

# **3.4 Agent**

Agents execute outbound communication tasks.

### **Responsibilities**

- Call assigned leads
- Update lead follow-ups
- Add notes & dispositions
- Schedule appointments
- Chat with leads (if supported)

### **Agent Features**

1. **Agent Dashboard**
   - Today’s KPIs
   - Assigned leads summary
   - Call results
   - Appointment reminders

2. **Lead Management**
   - View assigned leads
   - Click-to-call
   - Click-to-chat
   - Update lead status & notes

3. **Lead History**
   - Interaction logs
   - Call results
   - Status changes

4. **Appointment Management**
   - Create appointment
   - View daily/weekly schedule

5. **User Settings**
   - Change password
   - Update profile information

---

| Role        | Can Create                     | Can View         | Can Edit     | Can Delete | Monitor Calls           | Download Recordings | Access Reports      |
| ----------- | ------------------------------ | ---------------- | ------------ | ---------- | ----------------------- | ------------------- | ------------------- |
| Super Admin | Clients, internal users        | All              | All          | All        | No                      | No                  | Platform-level only |
| Admin       | Supervisors, Agents, Campaigns | All under client | Yes          | Yes        | Yes                     | Yes                 | Yes                 |
| Supervisor  | Coaching notes only            | Team agents only | Team-related | No         | Yes (spy/whisper/barge) | Yes (team only)     | Yes (team only)     |
| Agent       | Notes, appointments            | Self only        | Self only    | No         | No                      | No                  | Self KPIs only      |

---

# **4\. Functional Requirements**

---

## **4.1 Authentication**

- Email \+ Password
- 4 roles: Super Admin, Admin, Supervisor, Agent
- Role-based routes & sidebar
- JWT recommended (phase 2\)

---

## **4.2 Client Management (Super Admin Only)**

- Create client
- Edit client
- Deactivate client
- View client activity
- Assign Admin user

---

## **4.3 Campaign Management (Admin)**

- Create / edit / pause
- Assign supervisor or agents
- Set campaign rules
- Schedule start/end date

---

## **4.4 Lead Management**

### **Upload**

- CSV upload
- File validation
- Duplicate detection

### **Distribution**

- Auto/manual lead distribution
- Assign leads to SPV/Agents

### **Tracking**

- Lead lifecycle: new → follow-up → hot/warm/cold → closed
- Full interaction timeline

---

## **4.5 Telephony Module**

### **Calls**

- WebRTC softphone
- Asterisk integration
- GOIP routing

### **Call Controls**

- Mute/unmute
- Hold
- Hang up
- Call transfer (future)

### **SPV Monitoring**

- Spy
- Whisper
- Barge
- Realtime waveform (optional)

### **Recording**

- .wav or .mp3 format
- Search by:
  - Lead
  - Phone number
  - Agent
  - Date

### **Transcription**

- Optional future upgrade

---

## **4.6 Reports**

- Agent performance
- Campaign KPIs
- Lead conversion
- Call volume
- Appointment success rate
- Export to CSV/PDF

---

# **5\. User Flow Summary**

---

## **Super Admin → Creates Client**

1. Login
2. Go to Clients
3. Create new client
4. Add Admin user
5. Provide credentials

---

## **Admin → Creates Supervisor & Agents**

1. Login
2. Go to User Management
3. Create Supervisor
4. Create Agents
5. Assign to Supervisor
6. Distribute leads

---

## **Supervisor → Manages Agents**

1. Login
2. Opens Team Dashboard
3. Monitors real-time calls
4. Performs spy/whisper/barge
5. Adds coaching notes
6. Reviews agent performance

---

## **Agent → Works on Leads**

1. Login

2. Dashboard shows today's targets
3. Opens My Leads
4. Click-to-call
5. Update notes & results
6. Schedule appointments

---

# **6\. Non-Functional Requirements**

### **Performance**

- Dashboard load under 2 seconds
- Call events must update in real-time

### **Security**

- Role-based access
- Mask sensitive data
- Call recordings access is restricted

### **Scalability**

- Multi-client support
- Horizontal scaling for telephony

### **Usability**

- Clean, modern UI
- No gradients
- Responsive design

---

# **7\. System Architecture Overview**

- **Frontend:** SPA \+ WebRTC softphone
- **Backend:** REST API \+ WebSocket for live events
- **Asterisk PBX:** Manages voice calls
- **GOIP:** GSM termination
- **Storage:**
  - Leads (database)
  - Recordings (object storage)
- **Authentication:** JWT or session-based

---

# **8\. Future Enhancements**

- Predictive dialing
- Omni-channel integrations (WhatsApp, SMS, Email)
- AI call scoring
- AI follow-up recommendation
- Speech analytics

# **9\. Database Table Specifications (New Section)**

Below are the required collections/tables for Callio, aligned with Super Admin → Admin → Supervisor → Agent workflow.

---

# **9.1 Clients Table**

**Purpose:** Stores information about companies using Callio.

| Column              | Type                      | Description                  |
| ------------------- | ------------------------- | ---------------------------- |
| id                  | UUID                      | Primary key                  |
| name                | String                    | Client/company name          |
| address             | String                    | Business address             |
| phone               | String                    | Main company phone           |
| email               | String                    | Contact email                |
| status              | Enum("active","inactive") | Client status                |
| subscription_plan   | String                    | Plan name (e.g., Basic, Pro) |
| subscription_expiry | Date                      | Expiration date              |
| created_at          | Timestamp                 | Creation date                |
| updated_at          | Timestamp                 | Last update                  |

---

# **9.2 Users Table**

**Purpose:** Stores all users across all roles.

| Column        | Type                                            | Description                          |
| ------------- | ----------------------------------------------- | ------------------------------------ |
| id            | UUID                                            | Primary key                          |
| client_id     | UUID / Nullable                                 | If null → Super Admin                |
| role          | Enum("superadmin","admin","supervisor","agent") | Role type                            |
| name          | String                                          | Full name                            |
| email         | String                                          | Login email                          |
| password_hash | String                                          | Encrypted password                   |
| phone         | String                                          | User phone number                    |
| supervisor_id | UUID / Nullable                                 | For agents assigned under supervisor |
| status        | Enum("active","inactive")                       | User status                          |
| created_at    | Timestamp                                       | Creation date                        |
| updated_at    | Timestamp                                       | Last update                          |

---

# **9.3 Campaigns Table**

**Purpose:** Contains outbound calling campaigns for each client.

| Column      | Type                                | Description       |
| ----------- | ----------------------------------- | ----------------- |
| id          | UUID                                | Primary key       |
| client_id   | UUID                                | Belongs to client |
| name        | String                              | Campaign name     |
| description | Text                                | Summary           |
| status      | Enum("active","paused","completed") | Campaign status   |
| start_date  | Date                                | Campaign start    |
| end_date    | Date                                | Campaign end      |
| created_by  | UUID                                | Admin user ID     |
| created_at  | Timestamp                           | Creation date     |
| updated_at  | Timestamp                           | Last update       |

---

# **9.4 Leads Table**

**Purpose:** Stores the **unique master lead records**. This table contains only the core identity and metadata for a lead.

| Column           | Type                                                 | Description            |
| ---------------- | ---------------------------------------------------- | ---------------------- |
| id               | UUID                                                 | Primary key            |
| client_id        | UUID                                                 | Belongs to client      |
| lead_name        | String                                               | Name of the lead       |
| phone            | String                                               | Lead phone number      |
| email            | String / Nullable                                    | Lead email             |
| tags             | String / Nullable                                    | Lead tags              |
| status           | Enum("new","attempted","hot","warm","cold","closed") | Lead lifecycle         |
| last_call_status | String                                               | Result of last attempt |
| notes            | Text                                                 | Additional notes       |
| created_at       | Timestamp                                            | Creation date          |
| updated_at       | Timestamp                                            | Last update            |

---

# **9.5 Lead Assignment Table**

**Purpose:** Stores the **many-to-many** relationship and state tracking between:

- Lead
- Campaign
- Supervisor (optional)
- Agent

This is where follow-up statuses, dispositions, progress, and assignments happen.

| Column                 | Type                                                 | Description                            |
| ---------------------- | ---------------------------------------------------- | -------------------------------------- |
| id                     | UUID                                                 | Primary key                            |
| lead_id                | UUID                                                 | References Lead (master)               |
| client_id              | UUID                                                 | Redundant but helps indexing/filtering |
| campaign_id            | UUID                                                 | Which campaign this lead is part of    |
| assigned_supervisor_id | UUID / Nullable                                      | Supervisor responsible                 |
| assigned_agent_id      | UUID / Nullable                                      | Agent assigned for this campaign       |
| status                 | Enum("new","attempted","hot","warm","cold","closed") | Lead lifecycle for this campaign       |
| last_call_status       | String / Nullable                                    | Last call disposition                  |
| lead_progress_notes    | Text / Nullable                                      | Notes for this campaign assignment     |
| followup_count         | Int                                                  | Number of attempts                     |

---

# **9.5.1 Lead Assignment History Table**

_(Logs follow-up actions per campaign assignment)_

**Purpose:**  
 Tracks every interaction, disposition, attempt, note, and status change **per agent and per campaign**.

| Column        | Type                                                     | Description                      |
| ------------- | -------------------------------------------------------- | -------------------------------- |
| id            | UUID                                                     | Primary key                      |
| assignment_id | UUID                                                     | References Lead Assignment       |
| agent_id      | UUID                                                     | Agent who performed the activity |
| action_type   | Enum("call","chat","note","status_change","appointment") | Activity type                    |
| disposition   | String / Nullable                                        | Call result or status change     |
| notes         | Text / Nullable                                          | Additional notes                 |
| created_at    | Timestamp                                                | Log timestamp                    |

---

# **9.6 Lead History Table**

**Purpose:** Interaction logs for each lead.

| Column        | Type                                                     | Description                      |
| ------------- | -------------------------------------------------------- | -------------------------------- |
| id            | UUID                                                     | Primary key                      |
| assignment_id | UUID                                                     | References Lead Assignment       |
| agent_id      | UUID                                                     | Agent who performed the activity |
| action_type   | Enum("call","chat","note","status_change","appointment") | Activity type                    |
| disposition   | String / Nullable                                        | Call result or status change     |
| notes         | Text / Nullable                                          | Additional notes                 |
| created_at    | Timestamp                                                | Log timestamp                    |

---

# **9.7 Appointments Table**

**Purpose:** Stores agent-booked appointments with leads.

| Column           | Type                                      | Description       |
| ---------------- | ----------------------------------------- | ----------------- |
| id               | UUID                                      | Primary key       |
| lead_id          | UUID                                      | Belongs to lead   |
| agent_id         | UUID                                      | Created by agent  |
| appointment_time | DateTime                                  | Scheduled time    |
| status           | Enum("scheduled","completed","cancelled") | Appointment state |
| remarks          | Text                                      | Notes             |
| created_at       | Timestamp                                 | Creation date     |
| updated_at       | Timestamp                                 | Last update       |

---

# **9.8 Recordings Table**

**Purpose:** Stores information about audio recordings.

| Column           | Type            | Description                 |
| ---------------- | --------------- | --------------------------- |
| id               | UUID            | Primary key                 |
| agent_id         | UUID            | Agent who made call         |
| lead_id          | UUID / Nullable | Call lead reference         |
| supervisor_id    | UUID / Nullable | If SPV downloaded or tagged |
| file_url         | String          | Path to recording file      |
| duration_seconds | Int             | Length of recording         |
| transcript       | Text / Nullable | Speech-to-text              |
| created_at       | Timestamp       | Call timestamp              |

---

# **9.9 Call Logs Table**

**Purpose:** Logs every telephony event.

| Column           | Type                                                | Description                 |
| ---------------- | --------------------------------------------------- | --------------------------- |
| id               | UUID                                                | Primary key                 |
| agent_id         | UUID                                                | Agent                       |
| lead_id          | UUID / Nullable                                     | Lead reference              |
| direction        | Enum("outbound","inbound")                          | Direction                   |
| status           | Enum("ringing","connected","ended","failed","busy") | Call status                 |
| start_time       | DateTime                                            | Start                       |
| end_time         | DateTime                                            | End                         |
| duration_seconds | Int                                                 | Total seconds               |
| sip_channel      | String                                              | Asterisk channel identifier |

---

# **9.10 Supervisor Coaching Notes Table**

**Purpose:** SPV evaluation for agents.

| Column        | Type            | Description              |
| ------------- | --------------- | ------------------------ |
| id            | UUID            | Primary key              |
| supervisor_id | UUID            | SPV who created note     |
| agent_id      | UUID            | Agent evaluated          |
| recording_id  | UUID / Nullable | If tied to a call        |
| score         | Int             | Evaluation score (1–100) |
| comments      | Text            | Feedback                 |
| created_at    | Timestamp       | Creation date            |

---

# **9.11 System Logs Table**

**Purpose:** Track CRUD activities and critical actions.

| Column     | Type      | Description                                      |
| ---------- | --------- | ------------------------------------------------ |
| id         | UUID      | Primary key                                      |
| user_id    | UUID      | User who performed the action                    |
| action     | String    | e.g., "create_client", "update_lead", "spy_call" |
| metadata   | JSON      | Additional info                                  |
| created_at | Timestamp | Timestamp                                        |

---

# **9.12 GSM Device Table (New)**

### **_Physical GSM/GOIP Hardware Device Management_**

**Purpose:**  
 Stores and tracks physical GSM gateway devices (GOIP or similar) that provide GSM lines for outbound calls through Asterisk.

This table allows Callio to display:

- Device health
- Connected ports
- SIM card information
- Real-time signal strength
- Current port usage
- Last call metadata
- Device uptime
- Operator/provider information

---

## **9.12.1 GSM Devices Table**

### **Table: gsm_devices**

| Column           | Type                                | Description                                |
| ---------------- | ----------------------------------- | ------------------------------------------ |
| id               | UUID                                | Primary key                                |
| name             | String                              | Friendly name (example: “GOIP-Jakarta-01”) |
| ip_address       | String                              | Device IP address                          |
| model            | String                              | GOIP model (e.g., GOIP-8, GOIP-16)         |
| total_ports      | Int                                 | Number of GSM ports available              |
| status           | Enum("online","offline","degraded") | Device health                              |
| uptime_seconds   | Int / Nullable                      | Reported uptime from device                |
| firmware_version | String / Nullable                   | Device firmware                            |
| created_at       | Timestamp                           | Creation date                              |
| updated_at       | Timestamp                           | Last update                                |

---

## **9.12.2 GSM Device Ports Table**

### **_(Each physical GOIP device has multiple ports, each port has its own SIM card and telephony parameters)_**

### **Table: gsm_device_ports**

| Column                     | Type                                          | Description                           |
| -------------------------- | --------------------------------------------- | ------------------------------------- |
| id                         | UUID                                          | Primary key                           |
| device_id                  | UUID                                          | References gsm_devices                |
| port_number                | Int                                           | Port index (1..N)                     |
| msisdn                     | String                                        | SIM phone number                      |
| imei                       | String / Nullable                             | Device port IMEI                      |
| imsi                       | String / Nullable                             | SIM IMSI                              |
| operator                   | String / Nullable                             | GSM provider (Telkomsel, Indosat, XL) |
| signal_strength            | Int / Nullable                                | 0–31 (standard GSM RSSI)              |
| balance                    | Decimal / Nullable                            | Optional SIM credit balance           |
| last_call_at               | Timestamp / Nullable                          | When last call used this port         |
| last_call_duration_seconds | Int / Nullable                                | Duration of last call made            |
| status                     | Enum("available","in_use","disabled","error") | Port availability                     |
| asterisk_channel           | String / Nullable                             | Bound SIP/Asterisk channel ID         |
| temperature_celsius        | Float / Nullable                              | Port-level temperature, if reported   |
| created_at                 | Timestamp                                     | Creation date                         |
| updated_at                 | Timestamp                                     | Last update                           |

# **9.12 Payment History Table (Super Admin)**

**Purpose:** Track client billing.

| Column         | Type                            | Description                |
| -------------- | ------------------------------- | -------------------------- |
| id             | UUID                            | Primary key                |
| client_id      | UUID                            | Related client             |
| amount         | Decimal                         | Payment amount             |
| period         | String                          | e.g. "Jan 2025"            |
| payment_method | String                          | Credit card, bank transfer |
| status         | Enum("paid","pending","failed") | Payment status             |
| created_at     | Timestamp                       | Timestamp                  |

---

# **10\. User Stories (Updated & Fully Rewritten)**

This section describes the complete end-to-end user stories across all roles based on the correct hierarchy:

**Super Admin → Admin → Supervisor (SPV) → Agent**

Each user story is grouped into logical flows reflecting the true operational lifecycle of the Callio platform.

---

# **10.1 Flow 1 — Client Onboarding (Super Admin)**

### **10.1.1 Client Creation**

1. As a Super Admin, I want to create a new client so that the company can start using Callio.
2. As a Super Admin, I want to specify which GSM device(s) belong to the client so that outbound calls are routed correctly.
3. As a Super Admin, I want to prevent a GSM device from being assigned to multiple clients to avoid cross-tenant conflicts.

### **10.1.2 Client Admin Creation**

1. As a Super Admin, I want to create the Admin user for a client so that they can manage their own organization.
2. As a Super Admin, I want the newly created Admin to receive an email verification link so that their account becomes active.
3. As a Super Admin, I want to see whether the Admin has verified their email so that I know when onboarding has progressed.

### **10.1.3 Client Activation**

1. As a Super Admin, I want to activate or deactivate a client so that I can control access to the system.
2. As a Super Admin, I want to view all users under a client so that I can understand their structure and usage.

---

# **10.2 Flow 2 — Team Setup (Admin)**

### **10.2.1 Supervisor Creation**

1. As an Admin, I want to create one or more Supervisors so that the team hierarchy can be built.
2. As an Admin, I want each new Supervisor to receive an email verification link so that the account becomes valid.
3. As an Admin, I want to re-send verification emails so that unverified Supervisors can be activated.

### **10.2.2 Agent Creation**

1. As an Admin, I want to create Agents under a specific Supervisor so that the organizational flow is maintained.
2. As an Admin, I want Agents to receive email verification links to activate their accounts.
3. As an Admin, I want to be prevented from creating Agents without selecting a Supervisor because hierarchy is mandatory.

### **10.2.3 Agent Assignment**

1. As an Admin, I want to reassign Agents to different Supervisors so that team restructuring is possible.
2. As an Admin, I want to disable an Agent without deleting them so that temporary leave situations are supported.

---

# **10.3 Flow 3 — Campaign Management (Admin)**

### **10.3.1 Campaign Creation**

1. As an Admin, I want to create a new campaign so that calls and leads are organized under a single project.
2. As an Admin, I want to define campaign details (name, purpose, dates) so that the project has structure.
3. As an Admin, I want to assign Supervisors to the campaign so that monitoring responsibility is clear.

### **10.3.2 Lead Importation**

1. As an Admin, I want to import leads under a specific campaign so that they are properly grouped.
2. As an Admin, I want to map CSV fields to system fields so that data imports correctly.
3. As an Admin, I want to assign imported leads to a Supervisor as part of the import process so that distribution happens immediately.
4. As an Admin, I want to handle duplicates across campaigns by tagging leads so that a single lead can exist in multiple campaigns safely.

### **10.3.3 Lead Distribution**

1. As an Admin, I want to assign leads to Supervisors manually so that I retain control.
2. As a Supervisor, I want to import leads directly to my agent pool so that I can take initiative for my team.
3. As a Supervisor, I want imported leads to auto-assign to the Agents under me so that I don’t need to distribute manually.

---

# **10.4 Flow 4 — Daily Operations (Supervisor & Agent)**

### **10.4.1 Supervisor Monitoring**

1. As a Supervisor, I want to see all Agents under me so that I can track team structure.
2. As a Supervisor, I want to view real-time Agent status (idle, calling, after-call work) so that I know who is available.
3. As a Supervisor, I want to see all leads assigned to my team so that I understand workload distribution.

### **10.4.2 Call Supervision**

1. As a Supervisor, I want to silently listen (spy) on an Agent’s live call so that I can evaluate performance.
2. As a Supervisor, I want to whisper to an Agent during a call so that I can coach them in real time.
3. As a Supervisor, I want to barge into an active call so that I can handle escalated issues.

### **10.4.3 Recording & Coaching**

1. As a Supervisor, I want to replay call recordings so that I can assess call quality.
2. As a Supervisor, I want to download recordings so that I can use them for training or escalation.
3. As a Supervisor, I want to leave coaching notes after reviewing recordings so that Agents can improve.

---

# **10.5 Flow 5 — Lead Follow-Up (Agent)**

### **10.5.1 Lead Handling**

1. As an Agent, I want to view all leads assigned to me so that I know whom to contact.
2. As an Agent, I want to click-to-call or click-to-chat a lead so that follow-ups are fast.
3. As an Agent, I want to update lead statuses (hot/warm/cold/closed) so that progress is recorded.
4. As an Agent, I want to add call notes so that my Supervisor can understand the interaction.

### **10.5.2 Activity Tracking**

1. As an Agent, I want to see my call history so that I can review previous conversations.
2. As an Agent, I want to listen to my own recordings so that I can self-evaluate.

### **10.5.3 Appointment Setting**

1. As an Agent, I want to schedule appointments with leads so that I can plan follow-ups.
2. As an Agent, I want to see upcoming appointments so that I stay organized.

---

# **10.6 Flow 6 — Payment & Subscription (Admin → Super Admin)**

### **10.6.1 Invoice Handling (Admin)**

1. As an Admin, I want to view current invoices so that I know what needs to be paid.
2. As an Admin, I want to download invoices for documentation purposes.
3. As an Admin, I want to see invoice history so that I can track billing cycles.

### **10.6.2 Payment Submission (Admin)**

1. As an Admin, I want to upload payment proof so that I can notify Super Admin of completed payments.
2. As an Admin, I want to track the approval status of uploaded payments so that I know when subscription is updated.

### **10.6.3 Payment Verification (Super Admin)**

1. As a Super Admin, I want to review payment proofs so that I can confirm their validity.
2. As a Super Admin, I want to approve or reject payment proofs so that billing remains accurate.

### **10.6.4 Automated Subscription Update**

1. As a System, I want to update the client’s subscription upon approval so that access remains uninterrupted.
2. As a System, I want to notify both Admin and Super Admin when payment is approved or rejected.

---

# **10.7 Flow 7 — GSM Device Management (Super Admin)**

### **10.7.1 Device Setup**

1. As a Super Admin, I want to add GSM devices so that calls can be routed through physical GSM lines.
2. As a Super Admin, I want to assign GSM devices to a specific client so that multiple clients do not share a single device.

### **10.7.2 Device Health Monitoring**

1. As a Super Admin, I want to see device uptime, signal strength, balance, and port status so that I can ensure reliable calling.
2. As a Super Admin, I want to see which port made the last call and for how long so that troubleshooting is easier.

# **11\. System Logic & Business Rules**

## **11.1 Click2Call – Port Selection & Call Handling Logic**

This rule governs how the system selects GSM ports, initiates calls, handles call events, and updates resource usage.

---

### **11.1.1 Port Selection Rules**

Before initiating a call:

1. **System queries all GSM ports assigned to the client.**
2. A port is considered _available_ if:
   - `status = idle`
   - `remaining_talktime > 0`
   - The port is **not** currently being used by another call session.
3. If multiple ports are available:
   - System selects based on **round-robin** or **least-recently-used** (configurable).
4. If **no port** matches availability:
   - System returns an error: _“No available ports”_.

---

### **11.1.2 Pre-Call Setup**

Once a port is selected:

1. System sets the port status → **busy (preparing_call)**
2. System creates a call session record:
   - call_id
   - lead_id
   - agent_id
   - port_id
   - timestamp_requested

This prevents race conditions where multiple calls try to use the same port.

---

### **11.1.3 Asterisk Call Events Handling**

After Asterisk initiates the call:

---

### **Event: ANSWERED**

When the callee picks up:

1. System sets port status → **active**
2. System stores:
   - `handshake_start_timestamp`
   - `caller`, `callee`, `channel`
   - `bridge_info` if available
3. System begins **real-time talktime tracking**.

---

### **Event: FAILED / REJECTED / UNREACHABLE**

If the callee does not answer:

1. System sets port status → **idle**
2. System logs the failure reason
3. System updates call session → `status = failed`
4. No talktime is consumed

Failures include:

- Busy line
- Network unreachable
- Call rejected
- SIM blocked
- No signal

---

### **Event: HANGUP**

When either the agent or callee terminates the call:

1. System records:
   - `call_end_timestamp`
   - Call duration → (end \- handshake start)
   - Billing/talktime consumption

2. System subtracts the consumed seconds from `remaining_talktime`.
3. **If remaining talktime \<= threshold:**
   - Port status → `maintenance_required`
4. **Else:**
   - Port status → `idle`

---

# **11.1.4 Talktime & Port Maintenance Logic**

### **When remaining talktime is ≤ 0:**

- Port becomes **not_ready (maintenance_required)**
- Port is no longer usable until:
  - SIM balance is topped up, or
  - Port is manually reset by Super Admin

---

# **11.1.5 Summary of Port Lifecycle**

| Transition           | From → To                     | Trigger                 |
| -------------------- | ----------------------------- | ----------------------- |
| Idle → Busy          | System reserves port          | Call requested          |
| Busy → Active        | Callee answered               | “ANSWERED” event        |
| Active → Idle        | Call ended & talktime ok      | “HANGUP” event          |
| Active → Maintenance | Call ended & talktime drained | Talktime \<= 0          |
| Busy → Idle          | Failed / unreachable          | “FAILED”, “UNREACHABLE” |
| Maintenance → Idle   | Balance topped up             | Manual / automatic      |

**11.2 Super Admin – Talktime Usage & Port Monitoring Logic**

This logic governs how the system monitors GSM port talktime, identifies low-balance conditions, and alerts the Super Admin.

---

## **11.2.1 Port Usage Tracking Overview**

The system must track talktime usage **per GSM device port** and provide a real-time or near-real-time view for the Super Admin.

**Primary goals:**

- Identify which ports are low on talktime
- Ensure uninterrupted outbound calling capacity
- Alert Super Admin early to avoid downtime
- Provide clear visibility on port health and balance

---

## **11.2.2 Talktime Calculation Rules**

To reduce database load and avoid inaccurate traffic-based calculation:

1. **Talktime is calculated ONLY at the end of each call.**
2. Calculation formula:

`remaining_talktime = remaining_talktime – call_duration_in_seconds`

3. The system must **not** calculate talktime based on:
   - Data usage
   - RTP traffic
   - Network consumption
4. Each port has:
   - `initial_talktime_allowed`
   - `remaining_talktime`
   - `low_talktime_threshold` (e.g., 10 minutes)

---

## **11.2.3 Port Status Update Logic**

After each call ends:

1. If `remaining_talktime > low_talktime_threshold`  
   → port status remains **idle** or **active** depending on state
2. If `remaining_talktime ≤ low_talktime_threshold`  
   → port status becomes **low_balance_warning**
3. If `remaining_talktime ≤ 0`  
   → port status becomes **maintenance_required**  
   → port cannot be used until topped up

---

## **11.2.4 Port Monitoring Dashboard Requirements**

Super Admin must have a page displaying all relevant port metrics:

| Metric             | Description                              |
| ------------------ | ---------------------------------------- |
| GSM Device Name    | Which device the port belongs to         |
| Port Number        | Port index                               |
| MSISDN             | SIM phone number                         |
| Signal Strength    | Current RSSI                             |
| Operator           | Carrier name                             |
| Remaining Talktime | In seconds/minutes                       |
| Last Call Duration | Most recent call                         |
| Port Status        | idle, active, busy, warning, maintenance |
| Last Updated       | Timestamp                                |

### **Dashboard Features:**

- Sort by remaining talktime
- Filter by status (low balance, maintenance required, active, idle)
- Highlight low balance ports in **orange**
- Highlight maintenance ports in **red**

---

## **11.2.5 Alerting Logic**

The system must send **immediate alerts** to the Super Admin when a port reaches low balance.

### **Trigger Conditions**

Alert is sent when:

`remaining_talktime ≤ low_talktime_threshold`

or

`status changes to maintenance_required`

### **Alert Channels**

- **Email** (required)
- **WhatsApp API** (if enabled)

### **Alert Message Includes:**

- Device name
- Port number
- MSISDN
- Remaining talktime
- Status (low balance or maintenance required)
- Time of the event

---

## **11.2.6 Daily Summary Report (Optional Enhancement)**

At a configurable time (default: 08:00 AM), the system sends a **daily port health summary** to the Super Admin containing:

- Ports with low balance
- Ports under maintenance
- Ports inactive for \> X hours
- Ports with repeated failures
- Total call usage per port

---

## **11.2.7 Error Handling Logic**

If monitoring fails due to device or network errors:

- Log the error internally
- Mark port as **unknown**
- Notify Super Admin: _“Port status cannot be retrieved”_

---

## **11.2.8 High-Level Flow Summary (For the PRD)**

1. Call ends → system calculates talktime
2. Remaining talktime updated
3. System updates port status
4. If below threshold → trigger warning
5. Warning sent via email or WhatsApp
6. Monitoring dashboard displays updated status
7. If talktime runs out → port becomes maintenance_required
8. After top-up → admin resets port → port returns to idle
