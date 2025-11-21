/* --------------------------------------------------------------------------
 * Callio Mock Database
 * Complete mock data layer for TanStack Query + TanStack Start Frontend
 * Includes:
 * - Full types for all domain objects
 * - Seeded mock data
 * - CRUD utilities
 * - Pagination, searching, filtering, sorting
 * - Auto-increment ID helpers
 * -------------------------------------------------------------------------- */

import { nanoid } from "nanoid";

/* --------------------------------------------------------------------------
 * Types
 * -------------------------------------------------------------------------- */

export type Status = "active" | "inactive";
export type LeadStatus = "hot" | "warm" | "cold";

export interface Client {
  id: string;
  name: string;
  domain?: string;
  contactPerson?: string;
  email: string;
  phone?: string;
  status: Status;
  billingPlan?: string;
  billingCycle?: string;
  notes?: string;
  createdAt: string;
}

export interface ClientUser {
  id: string;
  clientId: string;
  name: string;
  email: string;
  role: "admin" | "supervisor" | "agent";
  createdAt: string;
}

export interface PaymentHistory {
  id: string;
  clientId: string;
  amount: number;
  invoiceNumber: string;
  status: "paid" | "pending" | "failed";
  date: string;
}

export interface Lead {
  id: string;
  clientId: string;
  name: string;
  phone: string;
  email?: string;
  status: LeadStatus;
  tags: string[];
  source?: string;
  assignedAgent?: string;
  notes?: string;
  createdAt: string;
}

export interface Campaign {
  id: string;
  clientId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: "active" | "paused" | "completed";
  assignedAgents: string[];
}

export interface Recording {
  id: string;
  clientId: string;
  agentId: string;
  leadId: string;
  url: string;
  duration: number;
  timestamp: string;
}

export interface Agent {
  id: string;
  clientId: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  agentId: string;
  leadId: string;
  datetime: string;
  notes?: string;
}

/* --------------------------------------------------------------------------
 * Internal mock DB containers
 * -------------------------------------------------------------------------- */

const db = {
  clients: [] as Client[],
  clientUsers: [] as ClientUser[],
  paymentHistory: [] as PaymentHistory[],
  leads: [] as Lead[],
  campaigns: [] as Campaign[],
  agents: [] as Agent[],
  recordings: [] as Recording[],
  appointments: [] as Appointment[],
};

/* --------------------------------------------------------------------------
 * Seed Data
 * -------------------------------------------------------------------------- */

function seed() {
  // Clients
  const clientA: Client = {
    id: nanoid(),
    name: "Acme Corp",
    domain: "acme.com",
    contactPerson: "John Doe",
    email: "admin@acme.com",
    phone: "+628123456789",
    status: "active",
    billingPlan: "Pro",
    billingCycle: "Monthly",
    createdAt: new Date().toISOString(),
  };

  const clientB: Client = {
    id: nanoid(),
    name: "Nusantara Connect",
    domain: "nusantara.id",
    contactPerson: "Siti Nurhaliza",
    email: "support@nusantara.id",
    phone: "+628987654321",
    status: "inactive",
    billingPlan: "Starter",
    billingCycle: "Yearly",
    createdAt: new Date().toISOString(),
  };

  db.clients.push(clientA, clientB);

  // Client Users
  db.clientUsers.push(
    {
      id: nanoid(),
      clientId: clientA.id,
      name: "Alice Admin",
      email: "alice@acme.com",
      role: "admin",
      createdAt: new Date().toISOString(),
    },
    {
      id: nanoid(),
      clientId: clientA.id,
      name: "Bob Supervisor",
      email: "bob@acme.com",
      role: "supervisor",
      createdAt: new Date().toISOString(),
    }
  );

  // Payment History
  db.paymentHistory.push(
    {
      id: nanoid(),
      clientId: clientA.id,
      amount: 200000,
      invoiceNumber: "INV-202401",
      status: "paid",
      date: "2024-01-15",
    },
    {
      id: nanoid(),
      clientId: clientA.id,
      amount: 200000,
      invoiceNumber: "INV-202402",
      status: "pending",
      date: "2024-02-15",
    }
  );

  // Leads
  db.leads.push(
    {
      id: nanoid(),
      clientId: clientA.id,
      name: "Wawan Wijaya",
      phone: "+628123000111",
      email: "wawan@example.com",
      status: "hot",
      tags: ["priority", "new"],
      source: "Website",
      createdAt: new Date().toISOString(),
    },
    {
      id: nanoid(),
      clientId: clientA.id,
      name: "Ayu Lestari",
      phone: "+628556998877",
      email: "ayu@example.com",
      status: "warm",
      tags: ["follow-up"],
      source: "Referral",
      createdAt: new Date().toISOString(),
    }
  );

  // Agents
  const agent1: Agent = {
    id: nanoid(),
    clientId: clientA.id,
    name: "Rizky Saputra",
    email: "rizky@acme.com",
    phone: "+628221234567",
    createdAt: new Date().toISOString(),
  };

  const agent2: Agent = {
    id: nanoid(),
    clientId: clientA.id,
    name: "Dewi Anggreani",
    email: "dewi@acme.com",
    phone: "+628778889900",
    createdAt: new Date().toISOString(),
  };

  db.agents.push(agent1, agent2);

  // Campaigns
  db.campaigns.push({
    id: nanoid(),
    clientId: clientA.id,
    name: "Ramadhan Promo",
    description: "Discount call package for Ramadhan",
    startDate: "2024-03-01",
    endDate: "2024-04-01",
    status: "active",
    assignedAgents: [agent1.id, agent2.id],
  });

  // Recordings
  db.recordings.push({
    id: nanoid(),
    clientId: clientA.id,
    agentId: agent1.id,
    leadId: db.leads[0].id,
    url: "/mock/recording1.mp3",
    duration: 122,
    timestamp: new Date().toISOString(),
  });

  // Appointments
  db.appointments.push({
    id: nanoid(),
    agentId: agent1.id,
    leadId: db.leads[0].id,
    datetime: "2024-03-02T10:30:00",
    notes: "Follow up demo",
  });
}

seed();

/* --------------------------------------------------------------------------
 * Utility helpers
 * -------------------------------------------------------------------------- */

function paginate<T>(items: T[], page: number, pageSize: number) {
  const offset = (page - 1) * pageSize;
  return {
    total: items.length,
    page,
    pageSize,
    data: items.slice(offset, offset + pageSize),
  };
}

function search<T>(items: T[], key: keyof T, query: string) {
  if (!query) return items;
  return items.filter((item: any) =>
    String(item[key]).toLowerCase().includes(query.toLowerCase())
  );
}

function filter<T>(items: T[], predicate: (item: T) => boolean) {
  return items.filter(predicate);
}

function sort<T>(items: T[], key: keyof T, direction: "asc" | "desc") {
  return [...items].sort((a: any, b: any) => {
    const x = a[key];
    const y = b[key];
    if (x < y) return direction === "asc" ? -1 : 1;
    if (x > y) return direction === "asc" ? 1 : -1;
    return 0;
  });
}

/* --------------------------------------------------------------------------
 * CRUD Generators for each collection
 * -------------------------------------------------------------------------- */

function createCRUD<T extends { id: string }>(collection: keyof typeof db) {
  return {
    getAll: () => db[collection] as unknown as T[],
    getById: (id: string) => (db[collection] as unknown as T[]).find((i) => i.id === id),
    create: (item: Omit<T, "id">) => {
      const newItem = { ...item, id: nanoid() } as T;
      (db[collection] as unknown as T[]).push(newItem);
      return newItem;
    },
    update: (id: string, data: Partial<T>) => {
      const list = db[collection] as unknown as T[];
      const idx = list.findIndex((i) => i.id === id);
      if (idx === -1) return null;
      list[idx] = { ...list[idx], ...data };
      return list[idx];
    },
    delete: (id: string) => {
      const list = db[collection] as unknown as T[];
      const idx = list.findIndex((i) => i.id === id);
      if (idx === -1) return false;
      list.splice(idx, 1);
      return true;
    },
  };
}

/* --------------------------------------------------------------------------
 * Exported CRUD APIs
 * -------------------------------------------------------------------------- */

export const Clients = createCRUD<Client>("clients");
export const ClientUsers = createCRUD<ClientUser>("clientUsers");
export const Payments = createCRUD<PaymentHistory>("paymentHistory");
export const Leads = createCRUD<Lead>("leads");
export const Campaigns = createCRUD<Campaign>("campaigns");
export const Recordings = createCRUD<Recording>("recordings");
export const Agents = createCRUD<Agent>("agents");
export const Appointments = createCRUD<Appointment>("appointments");

/* --------------------------------------------------------------------------
 * Export utilities
 * -------------------------------------------------------------------------- */

export const Utils = {
  paginate,
  search,
  filter,
  sort,
};

export default db;
