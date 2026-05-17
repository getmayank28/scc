"use client";
import { motion } from "motion/react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
} from "recharts";
import { Activity, Gauge, PieChart as PieIcon } from "lucide-react";
import { GlassCard } from "./GlassCard";
import type { CalculatorResult } from "../types";
import { formatINR } from "../logic";
import { cn } from "@/lib/utils";

type Props = { result: CalculatorResult };

const COLORS = ["#f35a13", "#ff9d5c", "#3ad8a4", "#5da8ff"];

export function VisualCharts({ result }: Props) {
  const pieData = [
    { name: "Rewards", value: Math.max(result.rewardsValue, 0) },
    { name: "Lounge", value: Math.max(result.loungeValue, 0) },
    { name: "Milestone", value: Math.max(result.milestoneValue, 0) },
    { name: "Fee impact", value: Math.max(result.annualFee, 0) },
  ].filter((d) => d.value > 0);

  const barData = [
    {
      label: "Rewards + Benefits",
      value: result.rewardsValue + result.loungeValue + result.milestoneValue,
      fill: "#f35a13",
    },
    {
      label: "Annual Fee",
      value: result.annualFee,
      fill: "#ef4444",
    },
  ];

  const efficiency = Math.max(
    0,
    Math.min(100, Math.round((result.effectiveReturnPct + 2) * 18))
  );

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <GlassCard className="p-5 md:p-6">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-primary-orange">
          <PieIcon className="size-3.5" /> Yearly value mix
        </div>
        <h3 className="mt-2 text-base font-semibold text-white">
          Where your value comes from
        </h3>

        <div className="mt-4 h-48 w-full">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={pieData}
                innerRadius={48}
                outerRadius={72}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <RTooltip
                contentStyle={{
                  background: "rgba(20,20,20,0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                  color: "#fff",
                }}
                formatter={(v: number) => formatINR(v)}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
          {pieData.map((d, i) => (
            <div
              key={d.name}
              className="flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="size-2 rounded-full"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                <span className="text-white/65">{d.name}</span>
              </div>
              <span className="font-medium text-white/85">
                {formatINR(d.value)}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-5 md:p-6">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-primary-orange">
          <Activity className="size-3.5" /> Rewards vs fees
        </div>
        <h3 className="mt-2 text-base font-semibold text-white">
          Net upside check
        </h3>

        <div className="mt-4 h-48 w-full">
          <ResponsiveContainer>
            <BarChart data={barData} barCategoryGap={32}>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }}
              />
              <YAxis hide />
              <RTooltip
                cursor={{ fill: "rgba(255,255,255,0.05)" }}
                contentStyle={{
                  background: "rgba(20,20,20,0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                  color: "#fff",
                }}
                formatter={(v: number) => formatINR(v)}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {barData.map((d, i) => (
                  <Cell key={i} fill={d.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/65">
          You earn{" "}
          <span className="font-semibold text-emerald-300">
            {formatINR(barData[0].value)}
          </span>{" "}
          and pay{" "}
          <span className="font-semibold text-rose-300">
            {formatINR(barData[1].value)}
          </span>{" "}
          in fees.
        </div>
      </GlassCard>

      <GlassCard className="p-5 md:p-6">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-primary-orange">
          <Gauge className="size-3.5" /> Spend efficiency
        </div>
        <h3 className="mt-2 text-base font-semibold text-white">
          How well your spend converts
        </h3>

        <div className="mt-4">
          <SpendMeter value={efficiency} />
          <div className="mt-4 flex items-center justify-between text-xs text-white/55">
            <span>Effective return</span>
            <span
              className={cn(
                "text-base font-bold",
                result.effectiveReturnPct >= 0
                  ? "text-emerald-300"
                  : "text-rose-300"
              )}
            >
              {result.effectiveReturnPct.toFixed(2)}%
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px] uppercase tracking-wider text-white/40">
            <div>Low</div>
            <div>Good</div>
            <div>Elite</div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

function SpendMeter({ value }: { value: number }) {
  return (
    <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/10">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400"
        style={{
          boxShadow: "0 0 20px rgba(243,90,19,0.45)",
        }}
      />
    </div>
  );
}
