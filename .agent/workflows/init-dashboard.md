---
description: dashboard init
---

# **Callio Frontend Development Prompt**

### **(Full UI, Full CRUD, Full Detail Pages, Fully Functional Mock Data)**

## **1\. Goal**

Build a **complete, fully interactive frontend** for the Callio Platform using React \+ TanStack Start.  
 Every module must include:

- Full CRUD flows (Create, Read, Update, Delete)

- Detail pages (view, edit, delete)

- Form pages with React Hook Form \+ Zod validation

- Table pages with **search**, **filters**, **sorting**, and **pagination**

- Local state or MSW-powered mock data (persistent during session)

- Functional buttons and navigation flows

- Nested routing for detail pages

- No empty or placeholder pages: **every menu item must fully work**

---

# **2\. Tech Stack Requirements**

Use only the following stack:

- **React \+ TypeScript**

- **TanStack Start \+ TanStack Router** (for nested routing & layouts)

- **TanStack Query** (for data fetching \+ caching over mocks)

- **TanStack Store** (global UI state: theme, layout, dropdowns)

- **React Hook Form**

- **Zod** (strict schema validation)

- **Tailwind CSS** (utility styling)

- **Chakra UI** (accessible UI primitives)

- **Recharts** (charts)

- **framer-motion** (micro-animations)

- **react-i18next** (English/Indonesian)

- **MSW or local in-memory data store**

- **bun** package manager

**Must. Not. Use:**  
 No Shadcn UI, no Radix UI, no gradient colors.

---

# **3\. Design System Requirements**

### **Colors**

- Primary: **Orange** `#FF6A00`

- Secondary: **Navy Blue** `#0B1F3B`

- Must create full token palette for light/dark

### **Theme**

- Full dark & light theme support (Chakra \+ Tailwind)

- Persist theme in localStorage

### **Interaction**

- Small, subtle micro-animations:
  - Sidebar icon hover

  - Card hover lift

  - Button ripple or scale

- Accessible for `prefers-reduced-motion`

### **Layout**

- Sidebar \+ TopNav layout

- Fully responsive (mobile drawer sidebar)

- Every page must include:
  - Title

  - Breadcrumbs

  - Page-level actions (Create, Filter, Export, etc)

---

# **4\. Required Modules & Required Screens (ALL MUST BE IMPLEMENTED)**

Every module includes the following pages:

## **1\. List Page**

- Search

- Filters

- Sorting

- Pagination

- Table view

- Row-level actions (View, Edit, Delete)

- Bulk selection (optional)

## **2\. Create Page**

- Full form

- Validation (Zod)

- On submit → update mock DB \+ redirect to detail

## **3\. Detail Page**

- Full read view

- Tabs (optional)

- Edit / Delete buttons

## **4\. Edit Page**

- Full form (pre-filled)

- Validation

- Update mock DB

## **5\. Delete Workflow**

- Confirmation modal

---

# **5\. Modules to Implement (Deep, Complete CRUD)**

## **5.1 Super Admin Modules**

### **Clients**

Routes must include:

- `/clients`

- `/clients/create`

- `/clients/:clientId`

- `/clients/:clientId/edit`

Client fields:

- name (required)

- domain

- contactPerson

- email (required, validate)

- phone

- status (active/inactive)

- billingPlan

- billingCycle

- notes

Client detail must include tabs:

- Overview

- Payment History

- Users

- Activity Log

### **Payment History**

- Paginated table

- Filter: date range, status

- Dummy invoices

### **Client User Management**

CRUD required for:

- name

- email

- role (admin / supervisor / agent)

### **Server Monitoring**

- Asterisk status

- GOIP status

- Traffic

- Health

- Audit Logs (search \+ pagination)

- Auto-refresh

---

## **5.2 Admin Modules**

### **Campaigns**

- List → CRUD → Detail

- Filters: status, date range

- Detail:
  - Assigned agents

  - Lead stats

  - Charts

### **Leads**

Full CRUD with fields:

- name

- phone

- email

- tags

- source

- status (hot/warm/cold)

- assignedAgent

- notes

Lead Detail includes:

- Overview

- Notes (CRUD)

- Call history

- Transcripts

### **Agent Management**

- Agent CRUD

- Assign leads

- Agent detail with:
  - performance metrics

  - charts

  - call logs

### **Recording Search**

- Search by phone, agent, date

- Pagination

- Action: play dummy audio, download dummy file

### **Reports**

- Charts

- Date filters

- Export CSV/PDF (dummy)

---

## **5.3 Agent Modules**

### **My Dashboard**

- Calls today

- Conversion rate

- Avg talk time

- Appointments

- Charts (line/bar/pie)

### **My Leads**

- Table with search, filters, pagination

- Lead detail

- Click2Call button (mock UI)

- Change status form

### **Appointments**

- CRUD

- Calendar-like view

### **Settings**

- Update profile

- Change password

- Theme selector

- Language selector

- Microphone test (mock)

---

# **6\. Routing Requirements**

Use TanStack Start `routes/`:

Example structure:

`src/routes/`  
 `app/`  
 `clients/`  
 `index.tsx`  
 `create.tsx`  
 `$clientId/`  
 `index.tsx`  
 `edit.tsx`

Every module must follow this pattern, with nested routes and full page components.

---

# **7\. Table Requirements**

Tables must support:

- Search

- Filters

- Sorting

- Pagination

- Row actions

- Selectable rows

- Skeleton loading

- TanStack Query for fetching

- Chakra Table components

- Tailwind padding & spacing

---

# **8\. Form Requirements**

All forms must:

- Use React Hook Form

- Use Zod for schema validation

- Show validation errors

- Use Chakra form components

- Update mock data on submit

- Pre-fill data on Edit pages

- Have Cancel / Save buttons

Validation must include:

- Required fields

- Email format

- Phone format

- Enum checks

- Number positivity

- Date range validation

---

# **9\. Mock Data Requirements**

Use MSW **or** local in-memory store.

Example:

`src/lib/mockDb.ts`

Contains:

- Arrays for all domain data

- Auto-increment IDs

- CRUD utility functions

- Query helpers for pagination/filter/search

---

# **10\. Dashboard Requirements**

Each dashboard must show:

### **Super Admin**

- Client stats

- Active vs inactive

- Server health

- System usage

### **Admin**

- Agent performance

- Lead funnel

- Campaign KPIs

- Multiple charts

### **Agent**

- Calls today

- Appointments

- Performance graphs

**Each dashboard must have at least 3 charts.**

---

# **11\. i18n Requirements**

Use `react-i18next` with:

`/locales/en/common.json`  
`/locales/id/common.json`

EVERY UI label must come from translations:

- Buttons

- Menu items

- Form labels

- Validation messages

- Table columns

- Breadcrumbs

---

# **12\. Acceptance Criteria**

A module is DONE when:

### **CRUD:**

- Create works

- Edit works

- Delete works

- Detail page exists

### **Tables:**

- Search works

- Filters work

- Pagination works

- Sorting works

- Row actions work

### **Forms:**

- Zod validation

- All errors displayed

- Fields pre-populated on edit

### **Navigation:**

- All routes clickable

- All buttons functional

- No dead menus

### **UX:**

- No gradients

- Fully responsive

- Dark/light theme works

- Micro-animations applied

- No blank pages

---

# **13\. Final Instruction to Agent**

Generate a complete, deeply functional UI for **ALL** modules above.  
 Every page must contain full logic.  
 All CRUD must work using mock/local data.  
 All tables must have search/filter/sort/pagination.  
 All forms must use React Hook Form \+ Zod.  
 Every detail page must exist and be fully implemented.  
 Every menu and button must have working navigation.  
 No gradients.  
 Use Chakra \+ Tailwind cleanly.  
 Use i18n everywhere.  
 Use bun.  
 Use TanStack Start patterns.
