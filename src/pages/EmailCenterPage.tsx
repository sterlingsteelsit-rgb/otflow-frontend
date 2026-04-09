/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import {
  Send,
  Loader2,
  Clock3,
  CheckCircle2,
  XCircle,
  FileText,
  RefreshCw,
  Search,
  X,
  Users,
  LayoutTemplate,
} from "lucide-react";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import {
  getEmailAudit,
  getEmailContacts,
  getEmailTemplates,
  sendEmail,
  type EmailAuditItem,
  type EmailContact,
  type EmailTemplate,
} from "../api/services/mail-api";

const schema = z.object({
  to: z.array(z.string().email()).min(1, "Select at least one recipient"),
  subject: z.string().min(1, "Subject is required").max(200),
  message: z.string().min(1, "Message is required"),
  templateId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function textToHtml(text: string) {
  return text
    .split("\n")
    .map((line) => `<p>${line || "&nbsp;"}</p>`)
    .join("");
}

function StatusBadge({ status }: { status: EmailAuditItem["status"] }) {
  if (status === "SENT") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Sent
      </span>
    );
  }

  if (status === "FAILED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
        <XCircle className="h-3.5 w-3.5" />
        Failed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
      <Clock3 className="h-3.5 w-3.5" />
      Pending
    </span>
  );
}

export function EmailCenterPage() {
  const [audits, setAudits] = useState<EmailAuditItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  const [contacts, setContacts] = useState<EmailContact[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  const {
    setValue,
    watch,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      to: [],
      subject: "",
      message: "",
      templateId: "",
    },
  });

  const selectedRecipients = watch("to");
  const messageValue = watch("message");
  const subjectValue = watch("subject");
  const selectedTemplateId = watch("templateId");

  const previewHtml = useMemo(() => {
    if (!messageValue) return "<p>Your email preview will appear here.</p>";
    return textToHtml(messageValue);
  }, [messageValue]);

  async function loadAudit(currentPage = page) {
    try {
      setIsLoadingAudit(true);
      const result = await getEmailAudit(currentPage, 8);
      setAudits(result.items);
      setPage(result.meta.page);
      setTotalPages(result.meta.totalPages || 1);
    } catch {
      toast.error("Failed to load audit records");
    } finally {
      setIsLoadingAudit(false);
    }
  }

  async function loadTemplates() {
    try {
      const data = await getEmailTemplates();
      setTemplates(data);
    } catch {
      toast.error("Failed to load templates");
    }
  }

  async function loadContacts(search = "") {
    try {
      setIsLoadingContacts(true);
      const data = await getEmailContacts(search);
      setContacts(data);
    } catch {
      toast.error("Failed to load email contacts");
    } finally {
      setIsLoadingContacts(false);
    }
  }

  useEffect(() => {
    loadAudit(1);
    loadTemplates();
    loadContacts("");
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadContacts(contactSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [contactSearch]);

  function addRecipient(email: string) {
    if (selectedRecipients.includes(email)) return;
    setValue("to", [...selectedRecipients, email], { shouldValidate: true });
  }

  function removeRecipient(email: string) {
    setValue(
      "to",
      selectedRecipients.filter((item) => item !== email),
      { shouldValidate: true },
    );
  }

  function applyTemplate(templateId: string) {
    const template = templates.find((item) => item._id === templateId);
    setValue("templateId", templateId);

    if (!template) return;

    setValue("subject", template.subject, { shouldValidate: true });
    setValue("message", template.body, { shouldValidate: true });
  }

  async function onSubmit(values: FormValues) {
    const loadingToast = toast.loading("Sending email...");

    try {
      await sendEmail({
        to: values.to,
        subject: values.subject,
        html: textToHtml(values.message),
      });

      toast.success("Email sent successfully", { id: loadingToast });

      reset({
        to: [],
        subject: "",
        message: "",
        templateId: "",
      });

      loadAudit(1);
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Failed to send email", {
        id: loadingToast,
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">
            Email Center
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">
            Select users, choose a template, edit the message, and send email
            without needing HTML knowledge.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => loadAudit(page)}
          variant="ghost"
          className="border border-gray-300 bg-white font-black text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Audit
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-600" />
                <label className="text-sm font-semibold text-gray-700">
                  Select Recipients
                </label>
              </div>

              <div className="rounded-xl border border-gray-300 bg-white p-3">
                <div className="mb-3 flex flex-wrap gap-2">
                  {selectedRecipients.length === 0 ? (
                    <span className="text-sm text-gray-400">
                      No recipients selected
                    </span>
                  ) : (
                    selectedRecipients.map((email) => (
                      <span
                        key={email}
                        className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                      >
                        {email}
                        <button
                          type="button"
                          onClick={() => removeRecipient(email)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    placeholder="Type user name or email"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-3 text-sm outline-none focus:border-brand-blue focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div className="mt-3 max-h-52 overflow-auto rounded-lg border border-gray-200">
                  {isLoadingContacts ? (
                    <div className="flex items-center justify-center p-4 text-sm text-gray-500">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading users...
                    </div>
                  ) : contacts.length === 0 ? (
                    <div className="p-4 text-sm text-gray-500">
                      No users found
                    </div>
                  ) : (
                    contacts.map((contact) => (
                      <button
                        key={contact._id}
                        type="button"
                        onClick={() => addRecipient(contact.email)}
                        className="flex w-full items-center justify-between border-b border-gray-100 px-4 py-3 text-left hover:bg-gray-50"
                      >
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {contact.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {contact.email}
                          </div>
                        </div>

                        {contact.department && (
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                            {contact.department}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {errors.to?.message && (
                <p className="mt-2 text-xs font-medium text-red-600">
                  {errors.to.message}
                </p>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2">
                <LayoutTemplate className="h-4 w-4 text-gray-600" />
                <label className="text-sm font-semibold text-gray-700">
                  Template
                </label>
              </div>

              <select
                value={selectedTemplateId ?? ""}
                onChange={(e) => applyTemplate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-brand-blue focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Select a template</option>
                {templates.map((template) => (
                  <option key={template._id} value={template._id}>
                    {template.title}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Subject"
              placeholder="Enter email subject"
              {...register("subject")}
              error={errors.subject?.message}
              className="border-gray-300"
            />

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Message
              </label>
              <textarea
                {...register("message")}
                rows={10}
                placeholder="Write your message here"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-blue focus:ring-4 focus:ring-blue-100"
              />
              {errors.message?.message && (
                <p className="mt-2 text-xs font-medium text-red-600">
                  {errors.message.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3">
              <div>
                <div className="text-sm font-semibold text-gray-800">
                  Ready to send
                </div>
                <div className="text-xs text-gray-500">
                  Message will be formatted automatically for email.
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg border border-brand-blue bg-gradient-to-r from-brand-blue to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-blue-600 hover:to-blue-700 hover:shadow"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Email
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-600" />
              <h2 className="text-lg font-bold text-gray-900">Email Preview</h2>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="mb-4 border-b border-gray-200 pb-3">
                <div className="text-sm font-semibold text-gray-900">
                  {subjectValue || "No subject"}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  To:{" "}
                  {selectedRecipients.join(", ") || "No recipients selected"}
                </div>
              </div>

              <div
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                Recent Audit Trail
              </h2>
              <p className="text-sm text-gray-500">
                Latest email activity recorded by the backend.
              </p>
            </div>

            {isLoadingAudit ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
              </div>
            ) : audits.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-8 text-center text-sm text-gray-500">
                No audit records found yet.
              </div>
            ) : (
              <div className="space-y-3">
                {audits.map((item) => (
                  <div
                    key={item._id}
                    className="rounded-xl border border-gray-200 bg-white p-4"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-gray-900">
                          {item.subject}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          To: {item.to.join(", ")}
                        </div>
                      </div>

                      <StatusBadge status={item.status} />
                    </div>

                    <div className="line-clamp-2 text-xs leading-5 text-gray-600">
                      {item.bodyPreview}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-gray-100 pt-3 text-xs text-gray-500">
                      <span>{formatDate(item.sentAt || item.createdAt)}</span>
                      <span>{item.provider}</span>
                    </div>

                    {item.status === "FAILED" && item.errorMessage && (
                      <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        {item.errorMessage}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
              <Button
                type="button"
                disabled={page <= 1}
                onClick={() => loadAudit(page - 1)}
                variant="ghost"
                className="border border-gray-300 bg-white font-black text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </Button>

              <div className="text-sm font-medium text-gray-600">
                Page {page} of {totalPages}
              </div>

              <Button
                type="button"
                disabled={page >= totalPages}
                onClick={() => loadAudit(page + 1)}
                variant="ghost"
                className="border border-gray-300 bg-white font-black text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
