import { z } from "zod"

// Client Schema
export const clientSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  domain: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  status: z.enum(["active", "inactive"]),
  billingPlan: z.string().optional(),
  billingCycle: z.string().optional(),
  notes: z.string().optional(),
})

export type ClientFormData = z.infer<typeof clientSchema>

// Lead Schema
export const leadSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  status: z.enum(["hot", "warm", "cold"]),
  tags: z.array(z.string()).default([]),
  source: z.string().optional(),
  assignedAgent: z.string().optional(),
  notes: z.string().optional(),
})

export type LeadFormData = z.infer<typeof leadSchema>

// Campaign Schema
export const campaignSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  status: z.enum(["active", "paused", "completed"]),
  assignedAgents: z.array(z.string()).default([]),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.endDate) >= new Date(data.startDate)
    }
    return true
  },
  {
    message: "End date must be after start date",
    path: ["endDate"],
  }
)

export type CampaignFormData = z.infer<typeof campaignSchema>

// Agent Schema
export const agentSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
})

export type AgentFormData = z.infer<typeof agentSchema>

// Appointment Schema
export const appointmentSchema = z.object({
  agentId: z.string().min(1, "Agent is required"),
  leadId: z.string().min(1, "Lead is required"),
  datetime: z.string().min(1, "Date and time is required"),
  notes: z.string().optional(),
})

export type AppointmentFormData = z.infer<typeof appointmentSchema>

// Client User Schema
export const clientUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "supervisor", "agent"]),
})

export type ClientUserFormData = z.infer<typeof clientUserSchema>

// Payment History Schema (for display, not for creation)
export const paymentSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  status: z.enum(["paid", "pending", "failed"]),
  date: z.string().min(1, "Date is required"),
})

export type PaymentFormData = z.infer<typeof paymentSchema>
