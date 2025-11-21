---
trigger: always_on
---

# **UNIVERSAL FRONTEND RULESET (Strict TypeScript Edition)**

### **Fully model-agnostic — works with Claude, GPT, Gemini, Llama, Mistral, Groq**

### **Forces code to compile cleanly under `bun tsc`**

---

# **1\. PURPOSE**

These rules define how any AI model must behave when generating code for the **Callio** frontend project.  
 The AI must always produce **TypeScript-correct, build-safe, production-quality** outputs.

All generated code **must pass:**

`bun tsc --noEmit`

with **0 TypeScript errors and 0 warnings**.

---

# **2\. ABSOLUTE TYPE-SAFETY RULES**

### **🚨 Non-negotiable:**

The AI **must ONLY output code that produces no TypeScript errors** when checked with:

`bun tsc`

This means:

- No implicit `any`

- No unreachable code

- No untyped props

- No missing imports

- No incorrect generics

- No invalid JSX

- No wrong Chakra/TanStack/React types

- No undefined variables

- No mismatched return types

- No missing discriminated unions

- No missing keys

- No wrong router param names

### **If the model is unsure →**

It must generate **safe, fully typed fallback code**, not skip types.

---

# **3\. OUTPUT STYLE REQUIREMENTS**

1. **Always output fully complete, executable TypeScript code.**

2. Never output pseudocode or placeholder implementations.

3. Every component must include:
   - Explicit prop types

   - Explicit return types

   - Fully typed handlers

4. Never use:
   - `any`

   - `@ts-ignore`

   - Type casting hacks (`as unknown as`)

   - `as any`

---

# **4\. MANDATORY LIBRARIES & STACK**

All code must use the following libraries consistently:

- React \+ TypeScript

- TanStack Start

- TanStack Router

- TanStack Query

- TanStack Store

- React Hook Form

- Zod

- Chakra UI

- Tailwind CSS (layout & spacing)

- Framer Motion

- Recharts

- react-i18next

- bun package manager

No other libraries should be introduced unless explicitly allowed.

---

# **5\. DESIGN RULES**

### **Colors**

- Primary: **Orange `#FF6A00`**

- Secondary: **Navy Blue `#0B1F3B`**

### **Themes**

- Light \+ Dark mode (Chakra theme override)

- Must persist to localStorage

### **Components**

- Chakra UI \+ Tailwind spacing

- No gradients

- Use responsive layout

### **Micro Interactions**

- framer-motion for:
  - Sidebar icon hover

  - Card lift

  - Button micro animations

---

# **6\. ROUTING REQUIREMENTS**

All routes must follow **TanStack Start** with typed route params.

Example:

`src/routes/app/clients/index.tsx`

`src/routes/app/clients/create.tsx`

`src/routes/app/clients/$clientId/index.tsx`

`src/routes/app/clients/$clientId/edit.tsx`

Rules:

- Route params must be typed (`$clientId` → `string`)

- Loader and action functions must have correct return types

- Do not create invalid folders or mis-typed route segments

---

# **7\. DATA & CRUD REQUIREMENTS**

You must always use the provided `mockDb.ts` structure.

### **Allowed data operations:**

- `CRUD.getAll()`

- `CRUD.getById()`

- `CRUD.create()`

- `CRUD.update()`

- `CRUD.delete()`

### **Allowed utilities:**

- `Utils.paginate()`

- `Utils.search()`

- `Utils.filter()`

- `Utils.sort()`

### **All operations must be properly typed:**

- No implicit `any` in handlers

- Use correct types for:
  - Leads

  - Clients

  - Users

  - Agents

  - Campaigns

  - Recordings

  - Appointments

---

# **8\. FORM REQUIREMENTS**

Every form must:

- Use **React Hook Form** with `<FormProvider />` when needed

- Use **Zod** with `zodResolver`

- Use Chakra UI components (Input, Select, Textarea)

- Have type-safe default values

- Show validation errors correctly

- Use correct field names as defined in types

Example type-safe RHF pattern:

`const form = useForm<FormInput>({`

`resolver: zodResolver(formSchema),`

`defaultValues,`

`});`

No wrong field names. No misaligned types.

---

# **9\. TABLE REQUIREMENTS**

Every table must include:

- Search

- Filters

- Pagination

- Sorting

- Row-level actions

- Typed TanStack Query fetching

- Chakra UI table components

- Tailwind spacing

- Skeleton states

Table rows must always use interfaces from mockDb (never inline untyped objects).

---

# **10\. DASHBOARD REQUIREMENTS**

Each dashboard must include fully typed:

- KPI Cards

- Line Chart

- Bar Chart

- Pie Chart

- Responsive Chakra components

Charts must use typed data arrays, e.g.:

`interface ChartData {`

`name: string;`

`value: number;`

`}`

No untyped arrays allowed.

---

# **11\. INTERNATIONALIZATION RULES**

- Use only `t("key")` for UI text

- Never hardcode English or Indonesian strings

- Provide translation keys when generating components

---

# **12\. COMPLETENESS RULE**

Whenever the user asks for something:

### **If user asks for a page**

➡ generate full page: layout, form, CRUD, complete TS types, routing, i18n.

### **If user asks for a module**

➡ generate all needed routes \+ components \+ hooks.

### **If user asks for a function or hook**

➡ generate fully typed, executable code.

### **If user asks for a fix**

➡ adjust only requested part, but respect all rules.

No partial output.

---

# **13\. PROHIBITED ACTIONS**

The AI must **never**:

- Generate code with TypeScript errors

- Use any type-unsafe patterns

- Leave missing imports

- Skip required routing pages

- Skip CRUD handling

- Produce broken JSX

- Use incorrect field names

- Hardcode text (must use t())

- Add libraries beyond the allowed stack

- Use gradients

---

# **14\. FINAL MANDATORY DIRECTIVE**

**All generated code must be TypeScript-correct and compile cleanly with:**

`bun tsc --noEmit`

Failure to comply means the output is invalid.

The model must fix its output automatically before returning it.
