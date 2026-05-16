"use client";

import { useState } from "react";
import { useGetEmailMessagesQuery } from "@/store/admin";
import TabBar from "@/components/Tab/Tab";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type EmailRow = {
  _id: string;
  recipient: string;
  subject: string;
  status: string;
  templateId: string;
  providerId: string;
  errorCode?: string;
  errorReason?: string;
  createdAt: string;
  providerTimestamp?: string;
};

const statusColor: Record<string, string> = {
  enqueued: "text-yellow-400",
  sent: "text-blue-400",
  delivered: "text-green-400",
  opened: "text-emerald-300",
  clicked: "text-cyan-300",
  bounced: "text-orange-400",
  complained: "text-pink-400",
  failed: "text-red-400",
  other: "text-white/60",
};

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Sent", value: "sent" },
  { label: "Delivered", value: "delivered" },
  { label: "Opened", value: "opened" },
  { label: "Clicked", value: "clicked" },
  { label: "Bounced", value: "bounced" },
  { label: "Failed", value: "failed" },
];

const EmailAdmin = () => {
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useGetEmailMessagesQuery({
    page,
    status: status || undefined,
  });

  const messages: EmailRow[] = data?.data ?? [];
  const totalPages: number = data?.totalPages ?? 1;
  const total: number = data?.total ?? 0;

  return (
    <div className="flex flex-col gap-4 p-10">
      <TabBar
        value={status}
        tabs={STATUS_TABS}
        onChange={(v) => {
          setStatus(v);
          setPage(1);
        }}
      />

      {isLoading && <p className="text-white">Loading...</p>}

      {!isLoading && messages.length === 0 && (
        <p className="text-gray-400">No emails found</p>
      )}

      {!isLoading && messages.length > 0 && (
        <>
          <p className="text-white/60 text-sm">
            Showing page {page} of {totalPages} ({total} total)
          </p>

          <div className="overflow-x-auto rounded border border-brown-border">
            <table className="w-full text-left text-sm text-white">
              <thead className="bg-brown-sidebar border-b border-brown-border">
                <tr>
                  <th className="px-4 py-3 font-medium">Recipient</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Template</th>
                  <th className="px-4 py-3 font-medium">Subject</th>
                  <th className="px-4 py-3 font-medium">Failure</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((msg) => (
                  <tr
                    key={msg._id}
                    className="border-b border-brown-border hover:bg-brown-sidebar/50"
                  >
                    <td className="px-4 py-3 font-mono max-w-[240px] truncate">
                      {msg.recipient}
                    </td>
                    <td
                      className={`px-4 py-3 font-semibold ${statusColor[msg.status] ?? "text-white/60"}`}
                    >
                      {msg.status}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs max-w-[200px] truncate">
                      {msg.templateId || "—"}
                    </td>
                    <td className="px-4 py-3 max-w-[280px] truncate">
                      {msg.subject || "—"}
                    </td>
                    <td
                      className="px-4 py-3 max-w-[260px] text-xs text-white/80"
                      title={msg.errorReason ?? ""}
                    >
                      {msg.status === "failed" || msg.status === "bounced" ? (
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
                    <td className="px-4 py-3 text-white/60">
                      {new Date(
                        msg.providerTimestamp ?? msg.createdAt,
                      ).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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

export default EmailAdmin;
