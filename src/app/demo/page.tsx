"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  recommendTravelCard,
  recommendTravelCardAdvanced,
  type CardTravelReturn,
  type CategoryReturn,
  type SegmentReturn,
  type TravelEngineAdvancedResult,
  type TravelEngineResult,
} from "@/lib/logic/advisor/engine";
import type {
  TravelMix,
  TravelPriority,
} from "@/lib/logic/advisor/travel";

const TRAVEL_MIX_OPTIONS: { label: string; value: TravelMix }[] = [
  { label: "Only domestic", value: "only_domestic" },
  { label: "Mostly domestic (70/30)", value: "mostly_domestic" },
  { label: "Balanced (50/50)", value: "balanced" },
  { label: "Mostly international (30/70)", value: "mostly_international" },
];

const TRAVEL_PRIORITY_OPTIONS: { label: string; value: TravelPriority }[] = [
  { label: "Maximum rewards", value: "maximumRewards" },
  { label: "Low forex", value: "lowForex" },
  { label: "Lounge access", value: "loungeAccess" },
];

const inr = (value: number) =>
  `₹${Math.round(value).toLocaleString("en-IN")}`;

const pct = (value: number) => `${value.toFixed(2)}%`;

function CategoryRow({ row }: { row: CategoryReturn }) {
  return (
    <div className="flex justify-between items-start gap-4 py-1 text-sm">
      <div className="capitalize">{row.category}</div>
      <div className="text-right">
        <div>
          {inr(row.spend)} @ {pct(row.effectivePercentage)}{" "}
          <span className="text-muted-foreground">
            ({row.source}
            {row.merchant ? ` · ${row.merchant}` : ""})
          </span>
        </div>
        {row.capNote && (
          <div className="text-xs text-muted-foreground">cap: {row.capNote}</div>
        )}
        <div className="font-semibold text-green-500">
          +{inr(row.returnInr)}
        </div>
      </div>
    </div>
  );
}

function SegmentBlock({
  title,
  segment,
}: {
  title: string;
  segment: SegmentReturn;
}) {
  return (
    <div className="rounded-lg border border-white/10 p-4">
      <div className="flex justify-between text-sm font-semibold mb-2">
        <span>{title}</span>
        <span>{inr(segment.totalSpend)}</span>
      </div>
      <CategoryRow row={segment.flights} />
      <CategoryRow row={segment.hotels} />
      <CategoryRow row={segment.other} />
      <div className="flex justify-between text-sm mt-2 pt-2 border-t border-white/10">
        <span>Subtotal return</span>
        <span className="font-semibold text-green-500">
          +{inr(segment.totalReturnInr)}
        </span>
      </div>
    </div>
  );
}

function CardResultCard({
  result,
  rank,
}: {
  result: CardTravelReturn;
  rank: number;
}) {
  const showExtra =
    result.extraFlights !== null && result.extraFlights.totalSpend > 0;
  return (
    <div className="rounded-xl border border-white/15 p-5 text-white space-y-4">
      <div className="flex justify-between items-baseline">
        <div>
          <div className="text-xs text-muted-foreground">#{rank + 1}</div>
          <h3 className="text-lg font-semibold">{result.cardName}</h3>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Net return</div>
          <div className="text-xl font-bold text-green-500">
            {inr(result.netReturnInr)}
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <SegmentBlock title="Domestic" segment={result.domestic} />
        <SegmentBlock title="International" segment={result.international} />
        {showExtra && result.extraFlights && (
          <SegmentBlock
            title="Additional flights"
            segment={result.extraFlights}
          />
        )}
      </div>

      <div className="rounded-lg border border-white/10 p-4 text-sm space-y-1">
        <div className="font-semibold">Forex impact</div>
        <div className="flex justify-between">
          <span>Applicable spend</span>
          <span>{inr(result.forex.applicableSpend)}</span>
        </div>
        <div className="flex justify-between">
          <span>
            Markup {pct(result.forex.markupPercentage)} + GST{" "}
            {pct(result.forex.gstPercentage)}
          </span>
          <span className="text-red-400">
            −{inr(result.forex.totalCostInr)}
          </span>
        </div>
      </div>

      <div className="flex justify-between text-sm pt-2 border-t border-white/10">
        <span>Gross return</span>
        <span>{inr(result.grossReturnInr)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Forex cost</span>
        <span className="text-red-400">
          −{inr(result.forex.totalCostInr)}
        </span>
      </div>
      <div className="flex justify-between text-base font-semibold">
        <span>Net</span>
        <span className="text-green-500">{inr(result.netReturnInr)}</span>
      </div>
    </div>
  );
}

function InitialTravelForm() {
  const [tripsPerYear, setTripsPerYear] = useState("4");
  const [avgSpendPerTrip, setAvgSpendPerTrip] = useState("400000");
  const [travelMix, setTravelMix] = useState<TravelMix>("mostly_domestic");
  const [result, setResult] = useState<TravelEngineResult | null>(null);

  const onCalculate = () => {
    const trips = Number(tripsPerYear);
    const spend = Number(avgSpendPerTrip);
    if (!Number.isFinite(trips) || trips <= 0) return;
    if (!Number.isFinite(spend) || spend <= 0) return;

    setResult(
      recommendTravelCard({
        tripsPerYear: trips,
        avgSpendPerTrip: spend,
        travelMix,
      }),
    );
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label className="text-white font-semibold">Trips per year</Label>
          <Input
            type="number"
            min={1}
            value={tripsPerYear}
            className="text-white"
            onChange={(e) => setTripsPerYear(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white font-semibold">
            Avg spend per trip (₹)
          </Label>
          <Input
            type="number"
            min={0}
            value={avgSpendPerTrip}
            className="text-white"
            onChange={(e) => setAvgSpendPerTrip(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white font-semibold">Travel mix</Label>
          <Select
            value={travelMix}
            onValueChange={(v) => setTravelMix(v as TravelMix)}
          >
            <SelectTrigger className="h-12 text-white">
              <SelectValue placeholder="Select travel mix" />
            </SelectTrigger>
            <SelectContent>
              {TRAVEL_MIX_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={onCalculate} className="w-full md:w-auto">
        Recommend best travel card
      </Button>

      {result && (
        <div className="space-y-6">
          <div className="rounded-xl border border-white/15 p-5 text-white space-y-2">
            <h2 className="text-lg font-semibold">Travel spend breakdown</h2>
            <div className="grid gap-2 md:grid-cols-2 text-sm">
              <div>
                Annual travel spend: {inr(result.travel.annualTravelSpend)}
              </div>
              <div>
                Forex applicable spend:{" "}
                {inr(result.travel.forex.applicableSpend)}
              </div>
              <div>
                Domestic ({result.travel.split.domesticPercentage}%):{" "}
                {inr(result.travel.split.domestic)}
              </div>
              <div>
                International ({result.travel.split.internationalPercentage}%):{" "}
                {inr(result.travel.split.international)}
              </div>
            </div>
          </div>

          {result.best && (
            <div className="rounded-xl border border-green-500/40 bg-green-500/5 p-5 text-white">
              <div className="text-xs uppercase text-green-400">
                Best card for this profile
              </div>
              <div className="text-2xl font-bold">{result.best.cardName}</div>
              <div className="text-sm text-muted-foreground">
                Net annual return:{" "}
                <span className="text-green-500 font-semibold">
                  {inr(result.best.netReturnInr)}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {result.byCard.map((row, idx) => (
              <CardResultCard key={row.cardId} result={row} rank={idx} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AdvancedTravelForm() {
  const [tripsPerYear, setTripsPerYear] = useState("6");
  const [avgSpendPerTrip, setAvgSpendPerTrip] = useState("400000");
  const [totalInternationalTrip, setTotalInternationalTrip] = useState("2");
  const [avgInternationalSpendPerTrip, setAvgInternationalSpendPerTrip] =
    useState("250000");
  const [additionalFlightSpend, setAdditionalFlightSpend] = useState("90000");
  const [priorities, setPriorities] = useState<TravelPriority[]>([
    "maximumRewards",
  ]);
  const [result, setResult] = useState<TravelEngineAdvancedResult | null>(null);

  const togglePriority = (p: TravelPriority, checked: boolean) => {
    setPriorities((prev) =>
      checked ? [...prev, p] : prev.filter((x) => x !== p),
    );
  };

  const onCalculate = () => {
    const trips = Number(tripsPerYear);
    const spend = Number(avgSpendPerTrip);
    const intlTrips = Number(totalInternationalTrip);
    const intlSpend = Number(avgInternationalSpendPerTrip);
    const extra = Number(additionalFlightSpend);

    if (!Number.isFinite(trips) || trips <= 0) return;
    if (!Number.isFinite(spend) || spend < 0) return;
    if (!Number.isFinite(intlTrips) || intlTrips < 0) return;
    if (!Number.isFinite(intlSpend) || intlSpend < 0) return;
    if (!Number.isFinite(extra) || extra < 0) return;

    setResult(
      recommendTravelCardAdvanced({
        tripsPerYear: trips,
        avgSpendPerTrip: spend,
        totalInternationalTrip: intlTrips,
        avgInternationalSpendPerTrip: intlSpend,
        additionalFlightSpend: extra,
        travelPriority: priorities,
      }),
    );
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label className="text-white font-semibold">Trips per year</Label>
          <Input
            type="number"
            min={1}
            value={tripsPerYear}
            className="text-white"
            onChange={(e) => setTripsPerYear(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white font-semibold">
            Avg spend per trip (₹)
          </Label>
          <Input
            type="number"
            min={0}
            value={avgSpendPerTrip}
            className="text-white"
            onChange={(e) => setAvgSpendPerTrip(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white font-semibold">
            International trips
          </Label>
          <Input
            type="number"
            min={0}
            value={totalInternationalTrip}
            className="text-white"
            onChange={(e) => setTotalInternationalTrip(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white font-semibold">
            Avg intl spend / trip (₹)
          </Label>
          <Input
            type="number"
            min={0}
            value={avgInternationalSpendPerTrip}
            className="text-white"
            onChange={(e) => setAvgInternationalSpendPerTrip(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white font-semibold">
            Additional flight spend (₹)
          </Label>
          <Input
            type="number"
            min={0}
            value={additionalFlightSpend}
            className="text-white"
            onChange={(e) => setAdditionalFlightSpend(e.target.value)}
          />
        </div>

        <div className="space-y-2 md:col-span-3">
          <Label className="text-white font-semibold">Travel priorities</Label>
          <div className="flex flex-wrap gap-4">
            {TRAVEL_PRIORITY_OPTIONS.map((o) => {
              const checked = priorities.includes(o.value);
              return (
                <label
                  key={o.value}
                  className="flex items-center gap-2 text-sm text-white"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(v) =>
                      togglePriority(o.value, v === true)
                    }
                  />
                  {o.label}
                </label>
              );
            })}
          </div>
        </div>
      </div>

      <Button onClick={onCalculate} className="w-full md:w-auto">
        Recommend best travel card
      </Button>

      {result && (
        <div className="space-y-6">
          <div className="rounded-xl border border-white/15 p-5 text-white space-y-2">
            <h2 className="text-lg font-semibold">Travel spend breakdown</h2>
            <div className="grid gap-2 md:grid-cols-2 text-sm">
              <div>
                Annual travel spend: {inr(result.travel.annualTravelSpend)}
              </div>
              <div>
                Forex applicable spend:{" "}
                {inr(result.travel.forex.applicableSpend)}
              </div>
              <div>
                Domestic ({result.travel.split.domesticPercentage.toFixed(0)}
                %): {inr(result.travel.split.domestic)}
              </div>
              <div>
                International (
                {result.travel.split.internationalPercentage.toFixed(0)}%):{" "}
                {inr(result.travel.split.international)}
              </div>
              {result.travel.additionalFlightSpend > 0 && (
                <>
                  <div>
                    Additional flights:{" "}
                    {inr(result.travel.additionalFlightSpend)}
                  </div>
                  <div>
                    Spread across{" "}
                    {result.travel.bookings.extraFlightsSpreadMonths} month(s)
                  </div>
                </>
              )}
              <div>
                Cards considered: {result.filteredCardCount} /{" "}
                {result.totalCardCount}
              </div>
            </div>
          </div>

          {result.best ? (
            <div className="rounded-xl border border-green-500/40 bg-green-500/5 p-5 text-white">
              <div className="text-xs uppercase text-green-400">
                Best card for this profile
              </div>
              <div className="text-2xl font-bold">{result.best.cardName}</div>
              <div className="text-sm text-muted-foreground">
                Net annual return:{" "}
                <span className="text-green-500 font-semibold">
                  {inr(result.best.netReturnInr)}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/5 p-5 text-white text-sm">
              No card matches the selected priorities. Try relaxing filters.
            </div>
          )}

          <div className="space-y-4">
            {result.byCard.map((row, idx) => (
              <CardResultCard key={row.cardId} result={row} rank={idx} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Demo9Page() {
  return (
    <div className="min-h-screen p-6 mt-10 md:p-12 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Travel Card Advisor</h1>
        <p className="text-sm text-muted-foreground">
          Compare the initial and advanced travel-card recommendation flows.
        </p>
      </div>

      <Tabs defaultValue="initial" className="w-full">
        <TabsList>
          <TabsTrigger value="initial">Initial travel journey</TabsTrigger>
          <TabsTrigger value="advanced">Full travel journey</TabsTrigger>
        </TabsList>
        <TabsContent value="initial" className="mt-6">
          <InitialTravelForm />
        </TabsContent>
        <TabsContent value="advanced" className="mt-6">
          <AdvancedTravelForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
