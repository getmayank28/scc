"use client";

import dayjs from "dayjs";
import { useGetCampaignUsersQuery } from "@/store/admin";
import type { CampaignRange, FestiveUserRow } from "@/types/rewards";
import { CsvButton, Empty, Section, type Col } from "../Affiliate/ReportSections";

/** Users who came through the festive page: Apply clicks there, or signups that landed on it. */

const cols: Col<FestiveUserRow>[] = [
  { label: "Phone", value: (r) => r.phone },
  { label: "Name", value: (r) => r.name },
  { label: "Employment type", value: (r) => r.employmentType },
  { label: "Salary range", value: (r) => r.salaryRange },
  { label: "First seen", value: (r) => r.firstSeenAt },
];

export default function CampaignUsers({ range }: { range: CampaignRange }) {
  const { data, isLoading, isError } = useGetCampaignUsersQuery(range);

  if (isLoading) return <div className="h-40 animate-pulse rounded-2xl bg-white/[0.04]" />;
  if (isError || !data) return <Empty>Couldn&apos;t load festive users.</Empty>;

  return (
    <Section
      title={`Users (${data.length})`}
      hint="Clicked Apply on /credit-card-offers/festive, or signed up after landing on it. Newest first."
      action={<CsvButton name="festive-users" cols={cols} rows={data} />}
    >
      {!data.length ? (
        <Empty>No festive users in this range.</Empty>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/50">
                <th className="py-1.5 pr-4 font-medium">Phone</th>
                <th className="py-1.5 pr-4 font-medium">Name</th>
                <th className="py-1.5 pr-4 font-medium">Employment type</th>
                <th className="py-1.5 pr-4 font-medium">Salary range</th>
                <th className="py-1.5 pr-4 font-medium">First seen</th>
              </tr>
            </thead>
            <tbody>
              {data.map((u) => (
                <tr key={u.id} className="border-t border-white/5 text-white/85">
                  <td className="py-1.5 pr-4 tabular-nums">{u.phone ?? "—"}</td>
                  <td className="py-1.5 pr-4">{u.name ?? "—"}</td>
                  <td className="py-1.5 pr-4">{u.employmentType ?? "—"}</td>
                  <td className="py-1.5 pr-4">{u.salaryRange ?? "—"}</td>
                  <td className="py-1.5 pr-4 text-white/60">{dayjs(u.firstSeenAt).format("D MMM, HH:mm")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}
