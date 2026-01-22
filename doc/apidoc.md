# Callio V2 API Documentation

**Base URL:** `http://localhost:3001/api`
**Version:** 2.0

## Authentication

All endpoints except `/auth/login` and `/auth/register` require JWT authentication.

**Authorization Header:**

```
Authorization: Bearer <your_jwt_token>
```

---

## 🔐 Authentication Endpoints

### POST /auth/register

Register a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "agent",
  "clientId": "uuid-optional",
  "supervisorId": "uuid-optional",
  "phone": "+62812345678",
  "status": "active"
}
```

**Response (201):**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "agent",
    "status": "active",
    "clientId": "uuid",
    "supervisorId": "uuid",
    "createdAt": "2025-11-23T14:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /auth/login

Login with email and password.

**Request Body:**

```json
{
  "email": "superadmin@callio-tech.com",
  "password": "password123"
}
```

**Response (200):**

```json
{
  "user": {
    "id": "uuid",
    "email": "superadmin@callio-tech.com",
    "name": "Super Admin",
    "role": "superadmin",
    "status": "active"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### GET /auth/me

Get current authenticated user profile.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "id": "uuid",
  "email": "superadmin@callio-tech.com",
  "name": "Super Admin",
  "role": "superadmin",
  "status": "active"
}
```

---

## 👥 Clients Endpoints

### POST /clients

Create a new client.

**Request Body:**

```json
{
  "name": "Acme Corporation",
  "email": "contact@acme.com",
  "phone": "+62211234567",
  "address": "123 Business St, Jakarta",
  "status": "active",
  "subscriptionPlan": "premium",
  "maxUsers": 50,
  "maxConcurrentCalls": 20
}
```

### GET /clients

Get all clients with pagination and filters.

**Query Parameters:**

- `page` (number, default: 1)
- `limit` (number, default: 10)
- `search` (string) - Search by name, email, or phone
- `status` (string) - Filter by status
- `sortBy` (string, default: createdAt)
- `sortOrder` (string, default: desc)

### GET /clients/:id

Get a single client by ID.

### PATCH /clients/:id

Update a client.

### DELETE /clients/:id

Delete a client.

---

## 👤 Users Endpoints

### POST /users

Create a new user.

**Roles:** `superadmin`, `admin`, `supervisor`, `agent`

### GET /users

Get all users with pagination and filters.

**Query Parameters:**

- `page`, `limit`, `sortBy`, `sortOrder`
- `search` (string) - Search by name or email
- `role` (string) - Filter by role
- `status` (string)
- `clientId` (uuid)
- `supervisorId` (uuid)

### GET /users/:id

Get a single user by ID.

### PATCH /users/:id

Update a user.

### DELETE /users/:id

Delete a user.

---

## 📢 Campaigns Endpoints

### POST /campaigns

Create a new campaign.

**Status:** `active`, `paused`, `completed`

### GET /campaigns

Get all campaigns with pagination and filters.

**Query Parameters:**

- `page`, `limit`, `sortBy`, `sortOrder`
- `search` (string)
- `status` (string)
- `clientId` (uuid)
- `createdBy` (uuid)

### GET /campaigns/:id

Get campaign details.

### PATCH /campaigns/:id

Update a campaign.

### DELETE /campaigns/:id

Delete a campaign.

---

## 📞 Leads Endpoints

### POST /leads

Create a new lead.

**Status:** `new`, `attempted`, `hot`, `warm`, `cold`, `closed`

### GET /leads

Get all leads with pagination and filters.

**Query Parameters:**

- `page`, `limit`, `sortBy`, `sortOrder`
- `search` (string)
- `status` (string)
- `clientId` (uuid)

### GET /leads/:id

Get lead details.

### PATCH /leads/:id

Update a lead.

### DELETE /leads/:id

Delete a lead.

---

## 📅 Appointments Endpoints

### POST /appointments

Create a new appointment.

**Status:** `scheduled`, `completed`, `cancelled`

### GET /appointments

Get all appointments with pagination and filters.

**Query Parameters:**

- `page`, `limit`, `sortBy`, `sortOrder`
- `status` (string)
- `leadId` (uuid)
- `agentId` (uuid)

### GET /appointments/:id

Get appointment details.

### PATCH /appointments/:id

Update an appointment.

### DELETE /appointments/:id

Delete an appointment.

---

## 🎯 Lead Assignments Endpoints

### POST /lead-assignments

Assign a lead to a campaign and agent.

### GET /lead-assignments

Get all lead assignments with pagination and filters.

**Query Parameters:**

- `page`, `limit`, `sortBy`, `sortOrder`
- `status` (string)
- `leadId` (uuid)
- `campaignId` (uuid)
- `assignedAgentId` (uuid)
- `assignedSupervisorId` (uuid)

### GET /lead-assignments/:id

Get assignment details.

### PATCH /lead-assignments/:id

Update a lead assignment.

### DELETE /lead-assignments/:id

Delete a lead assignment.

---

## 🎙️ Recordings Endpoints

### POST /recordings

Create a new recording.

**Request Body:**

```json
{
  "agentId": "uuid",
  "leadId": "uuid-optional",
  "supervisorId": "uuid-optional",
  "fileUrl": "https://storage.example.com/recordings/call123.mp3",
  "durationSeconds": 180,
  "transcript": "Transcript of the call..."
}
```

### GET /recordings

Get all recordings with pagination and filters.

**Query Parameters:**

- `page`, `limit`, `sortBy`, `sortOrder`
- `search` (string) - Search in transcript
- `agentId` (uuid)
- `leadId` (uuid)
- `supervisorId` (uuid)

### GET /recordings/:id

Get recording details.

### PATCH /recordings/:id

Update a recording.

### DELETE /recordings/:id

Delete a recording.

---

## � Call Logs Endpoints

### POST /call-logs

Create a new call log.

**Request Body:**

```json
{
  "agentId": "uuid",
  "leadId": "uuid-optional",
  "direction": "outbound",
  "status": "connected",
  "startTime": "2025-06-15T10:00:00Z",
  "endTime": "2025-06-15T10:05:00Z",
  "durationSeconds": 300,
  "sipChannel": "SIP/1001-00000001"
}
```

**Direction:** `outbound`, `inbound`
**Status:** `ringing`, `connected`, `ended`, `failed`, `busy`

### GET /call-logs

Get all call logs with pagination and filters.

**Query Parameters:**

- `page`, `limit`, `sortBy`, `sortOrder`
- `direction` (string)
- `status` (string)
- `agentId` (uuid)
- `leadId` (uuid)

### GET /call-logs/:id

Get call log details.

### PATCH /call-logs/:id

Update a call log.

### DELETE /call-logs/:id

Delete a call log.

---

## 📊 System Logs Endpoints

### POST /system-logs

Create a system log entry.

**Request Body:**

```json
{
  "userId": "uuid-optional",
  "action": "user_login",
  "entity": "User",
  "entityId": "uuid-optional",
  "details": "User logged in from IP 192.168.1.1"
}
```

### GET /system-logs

Get all system logs with pagination and filters.

**Query Parameters:**

- `page`, `limit`, `sortBy`, `sortOrder`
- `userId` (uuid)
- `action` (string)
- `entity` (string)

### GET /system-logs/:id

Get system log details.

---

## � GSM Devices Endpoints

### POST /gsm-devices

Create a new GSM device.

**Request Body:**

```json
{
  "clientId": "uuid",
  "deviceName": "GSM Device 1",
  "imei": "123456789012345",
  "status": "active"
}
```

**Status:** `active`, `inactive`, `maintenance`

### GET /gsm-devices

Get all GSM devices with pagination and filters.

**Query Parameters:**

- `page`, `limit`, `sortBy`, `sortOrder`
- `clientId` (uuid)
- `status` (string)

### GET /gsm-devices/:id

Get GSM device details.

### PATCH /gsm-devices/:id

Update a GSM device.

### DELETE /gsm-devices/:id

Delete a GSM device.

---

## 🔌 GSM Device Ports Endpoints

### POST /gsm-device-ports

Create a new GSM device port.

**Request Body:**

```json
{
  "gsmDeviceId": "uuid",
  "portNumber": 1,
  "phoneNumber": "+62812345678",
  "status": "active"
}
```

**Status:** `active`, `inactive`, `busy`

### GET /gsm-device-ports

Get all GSM device ports with pagination and filters.

**Query Parameters:**

- `page`, `limit`, `sortBy`, `sortOrder`
- `gsmDeviceId` (uuid)
- `status` (string)

### GET /gsm-device-ports/:id

Get GSM device port details.

### PATCH /gsm-device-ports/:id

Update a GSM device port.

### DELETE /gsm-device-ports/:id

Delete a GSM device port.

---

## � Payment History Endpoints

### POST /payment-history

Create a payment record.

**Request Body:**

```json
{
  "clientId": "uuid",
  "amount": 1000000,
  "paymentDate": "2025-06-01",
  "paymentMethod": "bank_transfer",
  "status": "completed"
}
```

**Status:** `pending`, `completed`, `failed`

### GET /payment-history

Get all payment records with pagination and filters.

**Query Parameters:**

- `page`, `limit`, `sortBy`, `sortOrder`
- `clientId` (uuid)
- `status` (string)

### GET /payment-history/:id

Get payment record details.

### PATCH /payment-history/:id

Update a payment record.

### DELETE /payment-history/:id

Delete a payment record.

---

## 📝 Supervisor Coaching Notes Endpoints

### POST /supervisor-coaching-notes

Create a coaching note.

**Request Body:**

```json
{
  "supervisorId": "uuid",
  "agentId": "uuid",
  "leadId": "uuid-optional",
  "notes": "Great job handling the objection...",
  "rating": 4
}
```

### GET /supervisor-coaching-notes

Get all coaching notes with pagination and filters.

**Query Parameters:**

- `page`, `limit`, `sortBy`, `sortOrder`
- `supervisorId` (uuid)
- `agentId` (uuid)
- `leadId` (uuid)

### GET /supervisor-coaching-notes/:id

Get coaching note details.

### PATCH /supervisor-coaching-notes/:id

Update a coaching note.

### DELETE /supervisor-coaching-notes/:id

Delete a coaching note.

---

## 📜 Lead Assignment History Endpoints

### POST /lead-assignment-history

Create a lead assignment history entry.

**Request Body:**

```json
{
  "leadAssignmentId": "uuid",
  "changedBy": "uuid",
  "changeType": "status_change",
  "oldValue": "new",
  "newValue": "contacted"
}
```

### GET /lead-assignment-history

Get all lead assignment history with pagination and filters.

**Query Parameters:**

- `page`, `limit`, `sortBy`, `sortOrder`
- `leadAssignmentId` (uuid)
- `changedBy` (uuid)

### GET /lead-assignment-history/:id

Get lead assignment history details.

---

## 📋 Lead History Endpoints

### POST /lead-history

Create a lead history entry.

**Request Body:**

```json
{
  "leadId": "uuid",
  "agentId": "uuid-optional",
  "action": "status_changed",
  "details": "Status changed from new to contacted"
}
```

### GET /lead-history

Get all lead history with pagination and filters.

**Query Parameters:**

- `page`, `limit`, `sortBy`, `sortOrder`
- `leadId` (uuid)
- `agentId` (uuid)
- `action` (string)

### GET /lead-history/:id

Get lead history details.

---

## 📊 Data Models

### User Roles

- `superadmin` - Full system access
- `admin` - Client-level administration
- `supervisor` - Team management
- `agent` - Basic user access

### Status Values

**Client Status:** `active`, `inactive`
**User Status:** `active`, `inactive`
**Campaign Status:** `active`, `paused`, `completed`
**Lead Status:** `new`, `attempted`, `hot`, `warm`, `cold`, `closed`
**Appointment Status:** `scheduled`, `completed`, `cancelled`
**Call Direction:** `outbound`, `inbound`
**Call Status:** `ringing`, `connected`, `ended`, `failed`, `busy`
**GSM Device Status:** `active`, `inactive`, `maintenance`
**GSM Port Status:** `active`, `inactive`, `busy`
**Payment Status:** `pending`, `completed`, `failed`

### Pagination Response Format

All list endpoints return:

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

---

## 🔒 Error Responses

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": ["email must be an email"],
  "error": "Bad Request"
}
```

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "Access denied. Required roles: superadmin, admin",
  "error": "Forbidden"
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Resource with ID {id} not found",
  "error": "Not Found"
}
```

---

## 🚀 Quick Start Example

### 1. Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@callio-tech.com","password":"password123"}'
```

### 2. Use Token

```bash
curl -X GET http://localhost:3001/api/clients \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Create Resource

```bash
curl -X POST http://localhost:3001/api/clients \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Client","email":"client@example.com","status":"active"}'
```

---

## 📝 Notes for Frontend Development

1. **Store JWT Token:** Save `accessToken` in localStorage/sessionStorage after login
2. **Add to All Requests:** Include `Authorization: Bearer <token>` header
3. **Handle 401:** Redirect to login on unauthorized responses
4. **Pagination:** Use `page` and `limit` params for lists
5. **Search & Filter:** Combine query params: `?search=john&status=active&page=1`
6. **Date Format:** All dates are ISO 8601 format
7. **UUIDs:** All IDs are UUIDs (v4)

---

## ✅ Implementation Status

### Fully Implemented (15/15 Modules)

All modules are now complete with full CRUD operations:

1. ✅ **Authentication** - Login, register, profile
2. ✅ **Clients** - Client management
3. ✅ **Users** - User management with roles
4. ✅ **Campaigns** - Campaign management
5. ✅ **Leads** - Lead tracking
6. ✅ **Appointments** - Appointment scheduling
7. ✅ **Lead Assignments** - Lead assignment tracking
8. ✅ **Recordings** - Call recording management
9. ✅ **Call Logs** - Call history tracking
10. ✅ **System Logs** - Audit logging
11. ✅ **GSM Devices** - GSM device management
12. ✅ **GSM Device Ports** - Port management
13. ✅ **Payment History** - Payment tracking
14. ✅ **Supervisor Coaching Notes** - QA notes
15. ✅ **Lead Assignment History** - Assignment change tracking
16. ✅ **Lead History** - Lead interaction history

---

## 💡 CRUD Pattern

All endpoints follow this consistent pattern:

**Create:** `POST /{resource}`

- Accepts JSON body with required fields
- Returns created object with relations

**List:** `GET /{resource}`

- Query params: `page`, `limit`, `search`, `sortBy`, `sortOrder`
- Returns `{ data: [...], meta: { page, limit, total, totalPages } }`

**Get One:** `GET /{resource}/:id`

- Returns single object with full relations
- 404 if not found

**Update:** `PATCH /{resource}/:id`

- Accepts partial JSON body
- Returns updated object

**Delete:** `DELETE /{resource}/:id`

- Returns 204 No Content
- 404 if not found

---

**🎉 All 15 modules are now fully implemented and ready for frontend integration!**
