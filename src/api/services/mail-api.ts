import { api } from "../client";

export type SendEmailPayload = {
  to: string[];
  subject: string;
  html: string;
};

export type EmailAuditItem = {
  _id: string;
  requestedByUserId?: string;
  requestedByEmail?: string;
  fromEmail: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyPreview: string;
  status: "PENDING" | "SENT" | "FAILED";
  provider: "M365_GRAPH";
  errorMessage?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type EmailAuditResponse = {
  items: EmailAuditItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type EmailContact = {
  _id: string;
  name: string;
  email: string;
  department?: string;
  role?: string;
  isActive: boolean;
};

export type EmailTemplate = {
  _id: string;
  title: string;
  subject: string;
  body: string;
  category?: string;
  isDefault: boolean;
  isActive: boolean;
};

export async function sendEmail(payload: SendEmailPayload) {
  const response = await api.post("/email/send", payload);
  return response.data;
}

export async function getEmailAudit(page = 1, limit = 10) {
  const response = await api.get<{ data: EmailAuditResponse }>(
    `/email/audit?page=${page}&limit=${limit}`,
  );

  return response.data.data;
}

export async function getEmailContacts(search = "") {
  const response = await api.get<{ data: EmailContact[] }>(
    `/email/contacts?search=${encodeURIComponent(search)}`,
  );

  return response.data.data;
}

export async function getEmailTemplates() {
  const response = await api.get<{ data: EmailTemplate[] }>("/email/templates");

  return response.data.data;
}
