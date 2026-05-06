"use client";

import { useState } from "react";
import { useGetWhatsAppMessagesQuery } from "@/store/admin";
import Typography from "@/components/Typography/Typography";
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

const WhatsAppAdmin = () => {
  const [direction, setDirection] = useState<"outbound" | "inbound">(
    "outbound",
  );
  const [page, setPage] = useState(1);

  const { data, isLoading } = useGetWhatsAppMessagesQuery({
    direction,
    page,
  });

  const messages: Message[] = data?.data ?? [];
  const totalPages: number = data?.totalPages ?? 1;
  const total: number = data?.total ?? 0;

  return (
    <div className="flex flex-col gap-4 p-10">
      <Typography variant="h4">WhatsApp Messages</Typography>

      <TabBar
        value={direction}
        tabs={subtabs}
        onChange={(v) => {
          setDirection(v as "outbound" | "inbound");
          setPage(1);
        }}
      />

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
