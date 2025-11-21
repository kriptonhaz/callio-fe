---
description:
---

# **1\. PROJECT GOAL**

Build the first phase of **Callio**, a modern call-center dashboard application.

Focus ONLY on:

- Login page

- Dashboard page

- Sidebar with role-based menu

- Light/Dark theme toggle

- English/Indonesian i18n

- Dummy authentication using 3 users (superadmin, admin, agent)

All code must be **100% TypeScript-correct** and compile with:

`bun tsc --noEmit`

---

# **2\. TECH STACK**

All generated code must exclusively use:

- **React \+ TypeScript**

- **TanStack Start (file-based routing)**

- **TanStack Router**

- **TanStack Store**

- **TanStack Query**

- **React Hook Form**

- **Zod**

- **Chakra UI**

- **Tailwind CSS (layout spacing only)**

- **Framer Motion (micro animations)**

- **react-i18next**

- **bun** package manager

No other UI libraries allowed.

---

# **3\. DESIGN SYSTEM**

### **Colors**

- **Primary:** `#FF6A00`

- **Secondary:** `#0B1F3B`

- **No gradients allowed.**

### **Theme**

- Must support: **light mode \+ dark mode**

- Theme must persist using `localStorage`

- Chakra theme override is required

### **Typography**

- Clean, modern dashboard look

- Good spacing via Tailwind (`px-`, `py-`, `gap-`, etc.)

### **Micro-animations using Framer Motion:**

- Sidebar icons subtle hover animation

- Card hover lift

- Button subtle scale

---

# **4\. AUTHENTICATION REQUIREMENTS**

No backend yet. Use dummy users:

`export const dummyUsers = [`

`{`

    `id: "1",`

    `role: "superadmin",`

    `email: "super@callio.com",`

    `password: "super123",`

`},`

`{`

    `id: "2",`

    `role: "admin",`

    `email: "admin@callio.com",`

    `password: "admin123",`

`},`

`{`

    `id: "3",`

    `role: "agent",`

    `email: "agent@callio.com",`

    `password: "agent123",`

`},`

`] as const;`

### **Login flow:**

1. User enters email \+ password

2. React Hook Form \+ Zod validate input

3. Look up user in `dummyUsers`

4. If matched:
   - Save authenticated user in a **global TanStack Store**

   - Redirect to `/app/dashboard`

5. If not matched:
   - Show Chakra UI error alert

### **Type safety:**

- Absolutely **no `any`**, no casts, no `ts-ignore`

- Store must use strongly typed auth schema

---

# **5\. ROLE-BASED SIDEBAR MENU**

Sidebar items depend on `role` based on PRD.

---

## **5.1 Super Admin Sidebar**

`- Dashboard`

`- Clients`

`- Server Monitoring`

`- User Management`

---

## **5.2 Admin Sidebar**

`- Dashboard`

`- KPI Dashboard`

`- Campaigns`

`- Leads`

`- Agent Monitoring`

`- Recordings`

`- Reports`

`- User Management`

---

## **5.3 Agent Sidebar**

`- Dashboard`

`- My Leads`

`- My History`

`- My Appointments`

`- Settings`

---

### **Requirements:**

- Sidebar must hide/show items based on the logged-in user’s role

- Sidebar must support collapse/expand state

- Sidebar items must have icons (Chakra \+ lucide-react or icon library already allowed)

- Icons should animate slightly on hover

---

# **6\. PAGES TO IMPLEMENT**

This phase includes only:

---

## **6.1 Login Page**

Route: `/login`

Must include:

- Email field (React Hook Form)

- Password field (React Hook Form)

- Zod validation:
  - Email is required \+ must be valid

  - Password required, min 6 chars

- Chakra UI form components

- Show error message (Chakra Alert)

- Submit button with loading state

- Redirect on success

**UI style:**

- Centered card

- Brand logo or name “Callio”

- Clean modern style

- Light/dark mode toggle in corner

---

## **6.2 Dashboard Page**

Route: `/app/dashboard`

Dashboard must include:

- Welcome header with user name \+ role

- 3–4 statistic cards with dummy data

- A simple Recharts chart (line, bar, or pie — only one needed)

- Responsive grid

- Sidebar visible on this layout

- Topbar with:
  - Theme toggle

  - Language toggle

  - Logout button

---

# **7\. INTERNATIONALIZATION REQUIREMENTS (i18n)**

Use **react-i18next** with:

- `en` and `id` namespaces

- Every UI string must use `t("key")`

- No hardcoded English or Indonesian text

- Provide suggested translation keys when generating components

Example:

`t("login.title")`

`t("dashboard.stats.totalCalls")`

---

# **8\. FILE STRUCTURE REQUIREMENTS**

Generated code must follow TanStack Start:

`src/`

`app/`

`components/`

`hooks/`

`store/`

`routes/`

    `login.tsx`

    `app/`

      `layout.tsx`

      `dashboard.tsx`

---

# **9\. TYPE SAFETY REQUIREMENTS**

All generated code must be **100% TypeScript correct**.

Rules:

- No implicit any

- No ts-ignore

- No unused variables

- All props fully typed

- All hook return types explicit

- All components typed

- All i18n keys typed

- All route params typed

- Authentication store typed strictly

Everything must compile cleanly with:

`bun tsc --noEmit`

---

# **10\. WHAT THE AI MUST GENERATE**

When asked to generate files, the AI must output:

- Complete `.tsx` components

- Complete Chakra UI code

- Complete routing files

- Complete store (`authStore`)

- Complete theme setup

- Complete i18n setup

- Complete login form \+ logic

- Complete sidebar

- Complete dashboard UI

- All dummy data

No placeholders, no omitted logic.

---

# **11\. PROHIBITED OUTPUT**

The AI must never:

- Use gradients

- Hardcode English/Indonesian strings

- Use any UI library besides Chakra

- Produce incomplete code

- Generate TypeScript errors

- Add unnecessary abstractions
