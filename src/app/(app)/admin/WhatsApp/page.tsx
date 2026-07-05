"use client";

import { useState } from "react";
import { useGetWhatsAppMessagesQuery } from "@/store/admin";
import TabBar from "@/components/Tab/Tab";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type Message = {
  _id: string;
  phone: string;
  direction: string;
  status: string;
  templateId: string;
  messageType: string;
  text: string;
  errorCode?: string;
  errorReason?: string;
  createdAt: string;
};

const statusColor: Record<string, string> = {
  enqueued: "text-yellow-400",
  sent: "text-blue-400",
  delivered: "text-green-400",
  read: "text-green-300",
  failed: "text-red-400",
  received: "text-blue-300",
};

const subtabs = [
  { label: "Outbound", value: "outbound" },
  { label: "Inbound", value: "inbound" },
];

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Enqueued", value: "enqueued" },
  { label: "Sent", value: "sent" },
  { label: "Delivered", value: "delivered" },
  { label: "Read", value: "read" },
  { label: "Failed", value: "failed" },
];

const WhatsAppAdmin = () => {
  const [direction, setDirection] = useState<"outbound" | "inbound">(
    "outbound",
  );
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const isOutbound = direction === "outbound";

  const { data, isLoading } = useGetWhatsAppMessagesQuery({
    direction,
    page,
    status: isOutbound ? status || undefined : undefined,
    templateId: isOutbound ? templateId.trim() || undefined : undefined,
    from: isOutbound ? from || undefined : undefined,
    to: isOutbound ? to || undefined : undefined,
  });

  const messages: Message[] = data?.data ?? [];
  const totalPages: number = data?.totalPages ?? 1;
  const total: number = data?.total ?? 0;

  return (
    <div className="flex flex-col gap-4 p-10">

      <TabBar
        value={direction}
        tabs={subtabs}
        onChange={(v) => {
          setDirection(v as "outbound" | "inbound");
          setPage(1);
        }}
      />

      {isOutbound && (
        <div className="flex flex-col gap-3">
          <TabBar
            value={status}
            tabs={STATUS_TABS}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          />

          <div className="flex flex-wrap items-end gap-4">
            <label className="flex flex-col gap-1 text-xs text-white/60">
              Template ID
              <input
                type="text"
                value={templateId}
                placeholder="Filter by template ID"
                onChange={(e) => {
                  setTemplateId(e.target.value);
                  setPage(1);
                }}
                className="w-64 rounded border border-brown-border bg-brown-sidebar px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs text-white/60">
              From
              <input
                type="date"
                value={from}
                max={to || undefined}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setPage(1);
                }}
                className="rounded border border-brown-border bg-brown-sidebar px-3 py-2 text-sm text-white focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs text-white/60">
              To
              <input
                type="date"
                value={to}
                min={from || undefined}
                onChange={(e) => {
                  setTo(e.target.value);
                  setPage(1);
                }}
                className="rounded border border-brown-border bg-brown-sidebar px-3 py-2 text-sm text-white focus:outline-none"
              />
            </label>

            {(status || templateId || from || to) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setStatus("");
                  setTemplateId("");
                  setFrom("");
                  setTo("");
                  setPage(1);
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </div>
      )}

      {isLoading && <p className="text-white">Loading...</p>}

      {!isLoading && messages.length === 0 && (
        <p className="text-gray-400">No messages found</p>
      )}

      {!isLoading && messages.length > 0 && (
        <>
          <p className="text-white/60 text-sm">
            Showing page {page} of {totalPages} ({total} total)
          </p>

          {/* Table */}
          <div className="overflow-x-auto rounded border border-brown-border">
            <table className="w-full text-left text-sm text-white">
              <thead className="bg-brown-sidebar border-b border-brown-border">
                <tr>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  {direction === "outbound" ? (
                    <th className="px-4 py-3 font-medium">Template ID</th>
                  ) : (
                    <th className="px-4 py-3 font-medium">Message</th>
                  )}
                  {direction === "outbound" && (
                    <th className="px-4 py-3 font-medium">Failure</th>
                  )}
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((msg) => (
                  <tr
                    key={msg._id}
                    className="border-b border-brown-border hover:bg-brown-sidebar/50"
                  >
                    <td className="px-4 py-3 font-mono">{msg.phone}</td>
                    <td
                      className={`px-4 py-3 font-semibold ${statusColor[msg.status] ?? "text-white/60"}`}
                    >
                      {msg.status}
                    </td>
                    {direction === "outbound" ? (
                      <td className="px-4 py-3 font-mono text-xs max-w-[200px] truncate">
                        {msg.templateId || "—"}
                      </td>
                    ) : (
                      <td className="px-4 py-3 max-w-[300px] truncate">
                        {msg.text || "—"}
                      </td>
                    )}
                    {direction === "outbound" && (
                      <td
                        className="px-4 py-3 max-w-[320px] text-xs text-white/80"
                        title={msg.errorReason ?? ""}
                      >
                        {msg.status === "failed" ? (
                          <div className="flex flex-col gap-0.5">
                            {msg.errorCode && (
                              <span className="font-mono text-red-400">
                                #{msg.errorCode}
                              </span>
                            )}
                            <span className="text-white/60 truncate">
                              {msg.errorReason ?? "—"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-white/40">—</span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3 text-white/60">
                      {new Date(msg.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center gap-4 justify-end">
            <Button
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="text-white text-sm">
              {page} / {totalPages}
            </span>
            <Button
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default WhatsAppAdmin;
