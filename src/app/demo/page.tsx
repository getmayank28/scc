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
import {
  ALL_ROUNDER_CATEGORIES,
  recommendAllRounderCardPhaseOne,
  recommendAllRounderCardPhaseTwo,
  type AllRounderBucket,
  type AllRounderCategory,
  type AllRounderEnginePhaseTwoResult,
  type AllRounderEngineResult,
  type BucketReturn,
  type CardAllRounderReturn,
  type SubBucketReturn,
} from "@/lib/logic/advisor/allrounderEngine";
import {
  recommendFoodCardPhaseOne,
  recommendFoodCardPhaseTwo,
  type CardFoodReturn,
  type FoodCardEngineResult,
  type FoodCardEngineResultTwo,
  type FoodDeliveryPlatformPreferenceTwo,
  type FoodDiningPlatformPreference,
  type FoodPlatformPreference,
  type FoodStreamReturn,
  type FoodSubReturn,
} from "@/lib/logic/advisor/foodCardEngine";
import {
  recommendShoppingCardPhaseOne,
  recommendShoppingCardPhaseTwo,
  type CardShoppingReturn,
  type CardShoppingReturnTwo,
  type ShoppingCardEngineResult,
  type ShoppingCardEngineResultTwo,
  type ShoppingOnlinePlatform,
  type ShoppingPreference,
  type ShoppingStreamReturn,
  type ShoppingSubReturn,
} from "@/lib/logic/advisor/shoppingCardEngine";

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
                    Spread across {result.travel.bookings.extraFlightsTrips}{" "}
                    trip(s)
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

const ALL_ROUNDER_CATEGORY_LABELS: Record<AllRounderCategory, string> = {
  travel: "Travel",
  foodAndDining: "Food & Dining",
  onlineShopping: "Online Shopping",
  utilityBills: "Utility Bills",
  fuel: "Fuel",
  rentInsuranceFees: "Rent / Insurance / Fees",
};

const ALL_ROUNDER_BUCKET_LABELS: Record<AllRounderBucket, string> = {
  ...ALL_ROUNDER_CATEGORY_LABELS,
  others: "Others",
};

function SubBucketRow({ sub }: { sub: SubBucketReturn }) {
  return (
    <div className="flex justify-between items-start gap-4 py-1 text-sm">
      <div>
        <div>{sub.label}</div>
        <div className="text-xs text-muted-foreground">
          {inr(sub.spend)} @ {pct(sub.effectivePercentage)} ({sub.source}
          {sub.merchant ? ` · ${sub.merchant}` : ""})
        </div>
      </div>
      <div className="text-right font-semibold text-green-500">
        +{inr(sub.returnInr)}
      </div>
    </div>
  );
}

function BucketBlock({ bucket }: { bucket: BucketReturn }) {
  const hasOnline = bucket.online.subs.length > 0;
  const hasOffline = bucket.offline.subs.length > 0;
  if (bucket.annualSpend <= 0) return null;
  return (
    <div className="rounded-lg border border-white/10 p-4">
      <div className="flex justify-between text-sm font-semibold mb-2">
        <span>{ALL_ROUNDER_BUCKET_LABELS[bucket.bucket]}</span>
        <span>{inr(bucket.annualSpend)}/yr</span>
      </div>
      {hasOnline && (
        <div className="mb-2">
          <div className="text-xs uppercase text-muted-foreground mb-1">
            Online {inr(bucket.online.pot)}
          </div>
          {bucket.online.subs.map((s, i) => (
            <SubBucketRow key={`on-${i}`} sub={s} />
          ))}
        </div>
      )}
      {hasOffline && (
        <div>
          <div className="text-xs uppercase text-muted-foreground mb-1">
            Offline {inr(bucket.offline.pot)}
          </div>
          {bucket.offline.subs.map((s, i) => (
            <SubBucketRow key={`off-${i}`} sub={s} />
          ))}
        </div>
      )}
      <div className="flex justify-between text-sm mt-2 pt-2 border-t border-white/10">
        <span>Bucket return</span>
        <span className="font-semibold text-green-500">
          +{inr(bucket.totalReturnInr)}
        </span>
      </div>
    </div>
  );
}

function AllRounderCardResult({
  result,
  rank,
}: {
  result: CardAllRounderReturn;
  rank: number;
}) {
  return (
    <div className="rounded-xl border border-white/15 p-5 text-white space-y-4">
      <div className="flex justify-between items-baseline">
        <div>
          <div className="text-xs text-muted-foreground">#{rank + 1}</div>
          <h3 className="text-lg font-semibold">{result.cardName}</h3>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Annual return</div>
          <div className="text-xl font-bold text-green-500">
            {inr(result.annualReturnInr)}
          </div>
          <div className="text-xs text-muted-foreground">
            {pct(result.effectiveRatePercentage)} effective
          </div>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {Object.values(result.buckets).map((b) => (
          <BucketBlock key={b.bucket} bucket={b} />
        ))}
      </div>
    </div>
  );
}

function AllRounderPhaseOneForm() {
  const [monthlyTotal, setMonthlyTotal] = useState("50000");
  const [monthlyOnline, setMonthlyOnline] = useState("30000");
  const [selected, setSelected] = useState<AllRounderCategory[]>([
    "foodAndDining",
    "onlineShopping",
  ]);
  const [result, setResult] = useState<AllRounderEngineResult | null>(null);

  const toggleCategory = (cat: AllRounderCategory, checked: boolean) => {
    setSelected((prev) => {
      if (checked) {
        if (prev.includes(cat)) return prev;
        return [...prev, cat].slice(-2);
      }
      return prev.filter((x) => x !== cat);
    });
  };

  const onCalculate = () => {
    const T = Number(monthlyTotal);
    const O = Number(monthlyOnline);
    if (!Number.isFinite(T) || T <= 0) return;
    if (!Number.isFinite(O) || O < 0) return;

    setResult(
      recommendAllRounderCardPhaseOne({
        averageTotalMonthlySpend: T,
        averageOnlineMonthlySpend: O,
        mostSpendCategory: selected,
      }),
    );
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-white font-semibold">
            Average total monthly spend (₹)
          </Label>
          <Input
            type="number"
            min={0}
            value={monthlyTotal}
            className="text-white"
            onChange={(e) => setMonthlyTotal(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-white font-semibold">
            Average online monthly spend (₹)
          </Label>
          <Input
            type="number"
            min={0}
            value={monthlyOnline}
            className="text-white"
            onChange={(e) => setMonthlyOnline(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-white font-semibold">
          Most spend categories (pick 1 or 2)
        </Label>
        <div className="flex flex-wrap gap-4">
          {ALL_ROUNDER_CATEGORIES.map((cat) => {
            const checked = selected.includes(cat);
            const disabled = !checked && selected.length >= 2;
            return (
              <label
                key={cat}
                className={`flex items-center gap-2 text-sm text-white ${
                  disabled ? "opacity-50" : ""
                }`}
              >
                <Checkbox
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={(v) => toggleCategory(cat, v === true)}
                />
                {ALL_ROUNDER_CATEGORY_LABELS[cat]}
              </label>
            );
          })}
        </div>
      </div>

      <Button onClick={onCalculate} className="w-full md:w-auto">
        Recommend all-rounder card
      </Button>

      {result && (
        <div className="space-y-6">
          <div className="rounded-xl border border-white/15 p-5 text-white space-y-3">
            <h2 className="text-lg font-semibold">
              Phase 1 — calibrated spend distribution
            </h2>
            <div className="grid gap-2 md:grid-cols-2 text-sm">
              <div>Monthly total: {inr(result.phaseOne.monthlyTotal)}</div>
              <div>
                Monthly online: {inr(result.phaseOne.monthlyOnline)} (target{" "}
                {inr(result.input.averageOnlineMonthlySpend)})
              </div>
              <div>Annual total: {inr(result.annualTotal)}</div>
              <div>Annual online: {inr(result.annualOnline)}</div>
            </div>

            <div className="rounded-lg border border-white/10 p-3 text-sm">
              <div className="grid grid-cols-4 font-semibold text-xs text-muted-foreground pb-2 border-b border-white/10">
                <span>Category</span>
                <span className="text-right">Total /mo</span>
                <span className="text-right">Online</span>
                <span className="text-right">Offline</span>
              </div>
              {(
                Object.entries(result.phaseOne.categories) as [
                  AllRounderBucket,
                  { total: number; online: number; offline: number },
                ][]
              )
                .filter(([, v]) => v.total > 0)
                .map(([k, v]) => (
                  <div key={k} className="grid grid-cols-4 py-1 text-sm">
                    <span>{ALL_ROUNDER_BUCKET_LABELS[k]}</span>
                    <span className="text-right">{inr(v.total)}</span>
                    <span className="text-right">{inr(v.online)}</span>
                    <span className="text-right">{inr(v.offline)}</span>
                  </div>
                ))}
            </div>
          </div>

          {result.best && (
            <div className="rounded-xl border border-green-500/40 bg-green-500/5 p-5 text-white">
              <div className="text-xs uppercase text-green-400">
                Best card for this profile
              </div>
              <div className="text-2xl font-bold">{result.best.cardName}</div>
              <div className="text-sm text-muted-foreground">
                Annual return:{" "}
                <span className="text-green-500 font-semibold">
                  {inr(result.best.annualReturnInr)}
                </span>{" "}
                ({pct(result.best.effectiveRatePercentage)} effective)
              </div>
            </div>
          )}

          <div className="space-y-4">
            {result.byCard.map((row, idx) => (
              <AllRounderCardResult
                key={row.cardId}
                result={row}
                rank={idx}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface PhaseTwoField {
  key:
    | "annualTravelSpend"
    | "monthlyDining"
    | "monthlyBills"
    | "monthlyOnlineShopping"
    | "monthlyFuel"
    | "monthlyRentInsuranceFees";
  label: string;
}

const PHASE_TWO_FIELDS: PhaseTwoField[] = [
  { key: "annualTravelSpend", label: "Annual travel spend (₹)" },
  { key: "monthlyDining", label: "Monthly food delivery & dining (₹)" },
  { key: "monthlyBills", label: "Monthly bill payments (₹)" },
  { key: "monthlyOnlineShopping", label: "Monthly online shopping (₹)" },
  { key: "monthlyFuel", label: "Monthly fuel (₹)" },
  {
    key: "monthlyRentInsuranceFees",
    label: "Monthly rent / insurance / taxes (₹)",
  },
];

function AllRounderPhaseTwoForm() {
  const [monthlyTotal, setMonthlyTotal] = useState("50000");
  const [monthlyOnline, setMonthlyOnline] = useState("30000");
  const [declared, setDeclared] = useState<
    Record<PhaseTwoField["key"], string>
  >({
    annualTravelSpend: "240000",
    monthlyDining: "15000",
    monthlyBills: "10000",
    monthlyOnlineShopping: "18000",
    monthlyFuel: "8000",
    monthlyRentInsuranceFees: "12000",
  });
  const [result, setResult] = useState<AllRounderEnginePhaseTwoResult | null>(
    null,
  );

  const setField = (key: PhaseTwoField["key"], value: string) =>
    setDeclared((prev) => ({ ...prev, [key]: value }));

  const onCalculate = () => {
    const T = Number(monthlyTotal);
    const O = Number(monthlyOnline);
    if (!Number.isFinite(T) || T <= 0) return;
    if (!Number.isFinite(O) || O < 0) return;

    const numericDeclared = PHASE_TWO_FIELDS.reduce<
      Record<PhaseTwoField["key"], number>
    >((acc, f) => {
      const n = Number(declared[f.key]);
      acc[f.key] = Number.isFinite(n) && n > 0 ? n : 0;
      return acc;
    }, {} as Record<PhaseTwoField["key"], number>);

    setResult(
      recommendAllRounderCardPhaseTwo({
        averageTotalMonthlySpend: T,
        averageOnlineMonthlySpend: O,
        ...numericDeclared,
      }),
    );
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-white font-semibold">
            Average total monthly spend (₹)
          </Label>
          <Input
            type="number"
            min={0}
            value={monthlyTotal}
            className="text-white"
            onChange={(e) => setMonthlyTotal(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-white font-semibold">
            Average online monthly spend (₹)
          </Label>
          <Input
            type="number"
            min={0}
            value={monthlyOnline}
            className="text-white"
            onChange={(e) => setMonthlyOnline(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {PHASE_TWO_FIELDS.map((f) => (
          <div key={f.key} className="space-y-2">
            <Label className="text-white font-semibold">{f.label}</Label>
            <Input
              type="number"
              min={0}
              value={declared[f.key]}
              className="text-white"
              onChange={(e) => setField(f.key, e.target.value)}
            />
          </div>
        ))}
      </div>

      <Button onClick={onCalculate} className="w-full md:w-auto">
        Recommend all-rounder card
      </Button>

      {result && (
        <div className="space-y-6">
          <div className="rounded-xl border border-white/15 p-5 text-white space-y-3">
            <h2 className="text-lg font-semibold">
              Phase 2 — declared spend distribution
            </h2>
            <div className="grid gap-2 md:grid-cols-2 text-sm">
              <div>Monthly total: {inr(result.phaseTwo.monthlyTotal)}</div>
              <div>
                Monthly online: {inr(result.phaseTwo.monthlyOnline)} (target{" "}
                {inr(result.input.averageOnlineMonthlySpend)})
              </div>
              <div>Annual total: {inr(result.annualTotal)}</div>
              <div>Annual online: {inr(result.annualOnline)}</div>
            </div>

            <div className="rounded-lg border border-white/10 p-3 text-sm">
              <div className="grid grid-cols-4 font-semibold text-xs text-muted-foreground pb-2 border-b border-white/10">
                <span>Category</span>
                <span className="text-right">Total /mo</span>
                <span className="text-right">Online</span>
                <span className="text-right">Offline</span>
              </div>
              {(
                Object.entries(result.phaseTwo.categories) as [
                  AllRounderBucket,
                  { total: number; online: number; offline: number },
                ][]
              )
                .filter(([, v]) => v.total > 0)
                .map(([k, v]) => (
                  <div key={k} className="grid grid-cols-4 py-1 text-sm">
                    <span>{ALL_ROUNDER_BUCKET_LABELS[k]}</span>
                    <span className="text-right">{inr(v.total)}</span>
                    <span className="text-right">{inr(v.online)}</span>
                    <span className="text-right">{inr(v.offline)}</span>
                  </div>
                ))}
            </div>
          </div>

          {result.best && (
            <div className="rounded-xl border border-green-500/40 bg-green-500/5 p-5 text-white">
              <div className="text-xs uppercase text-green-400">
                Best card for this profile
              </div>
              <div className="text-2xl font-bold">{result.best.cardName}</div>
              <div className="text-sm text-muted-foreground">
                Annual return:{" "}
                <span className="text-green-500 font-semibold">
                  {inr(result.best.annualReturnInr)}
                </span>{" "}
                ({pct(result.best.effectiveRatePercentage)} effective)
              </div>
            </div>
          )}

          <div className="space-y-4">
            {result.byCard.map((row, idx) => (
              <AllRounderCardResult
                key={row.cardId}
                result={row}
                rank={idx}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const FOOD_DELIVERY_FREQ_OPTIONS: { label: string; value: number }[] = [
  { label: "Rarely or never", value: 1 },
  { label: "1–2 times a week", value: 6 },
  { label: "3–5 times a week", value: 16 },
  { label: "6+ times a week", value: 25 },
];

const DINING_FREQ_OPTIONS: { label: string; value: number }[] = [
  { label: "1–2 times a month", value: 2 },
  { label: "3–5 times a month", value: 4 },
  { label: "1–2 times a week", value: 6 },
  { label: "3+ times a week", value: 14 },
];
const FOOD_PLATFORM_OPTIONS: { label: string; value: FoodPlatformPreference }[] =
  [
    { label: "Swiggy", value: "swiggy" },
    { label: "Zomato", value: "zomato" },
    { label: "Both", value: "both" },
    { label: "None", value: "none" },
  ];

function FoodSubRow({ sub }: { sub: FoodSubReturn }) {
  return (
    <div className="flex justify-between items-start gap-4 py-1 text-sm">
      <div>
        <div>{sub.label}</div>
        <div className="text-xs text-muted-foreground">
          {inr(sub.spend)} @ {pct(sub.effectivePercentage)} ({sub.source}
          {sub.merchant ? ` · ${sub.merchant}` : ""})
        </div>
      </div>
      <div className="text-right font-semibold text-green-500">
        +{inr(sub.returnInr)}
      </div>
    </div>
  );
}

function FoodStreamBlock({
  title,
  stream,
}: {
  title: string;
  stream: FoodStreamReturn;
}) {
  if (stream.spend <= 0) return null;
  return (
    <div className="rounded-lg border border-white/10 p-4">
      <div className="flex justify-between text-sm font-semibold mb-2">
        <span>{title}</span>
        <span>{inr(stream.spend)}/yr</span>
      </div>
      {stream.subs.map((s, i) => (
        <FoodSubRow key={i} sub={s} />
      ))}
      <div className="flex justify-between text-sm mt-2 pt-2 border-t border-white/10">
        <span>Stream return</span>
        <span className="font-semibold text-green-500">
          +{inr(stream.returnInr)}
        </span>
      </div>
    </div>
  );
}

function FoodCardResult({
  result,
  rank,
}: {
  result: CardFoodReturn;
  rank: number;
}) {
  return (
    <div className="rounded-xl border border-white/15 p-5 text-white space-y-4">
      <div className="flex justify-between items-baseline">
        <div>
          <div className="text-xs text-muted-foreground">#{rank + 1}</div>
          <h3 className="text-lg font-semibold">{result.cardName}</h3>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Annual return</div>
          <div className="text-xl font-bold text-green-500">
            {inr(result.annualReturnInr)}
          </div>
          <div className="text-xs text-muted-foreground">
            {pct(result.effectiveRatePercentage)} effective
          </div>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <FoodStreamBlock title="Online delivery" stream={result.delivery} />
        <FoodStreamBlock title="Offline dining" stream={result.dining} />
      </div>
    </div>
  );
}

function FoodCardPhaseOneForm() {
  const [deliveryFreq, setDeliveryFreq] = useState("6");
  const [diningFreq, setDiningFreq] = useState("4");
  const [platform, setPlatform] = useState<FoodPlatformPreference>("both");
  const [result, setResult] = useState<FoodCardEngineResult | null>(null);

  const onCalculate = () => {
    const d = Number(deliveryFreq);
    const o = Number(diningFreq);
    if (!Number.isFinite(d) || d < 0) return;
    if (!Number.isFinite(o) || o < 0) return;

    setResult(
      recommendFoodCardPhaseOne({
        onlineFoodDeliveryFrequency: d,
        diningOutFrequency: o,
        foodDeliveryPlatformPreference: platform,
      }),
    );
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label className="text-white font-semibold">
            Online food delivery / month
          </Label>
          <Select value={deliveryFreq} onValueChange={setDeliveryFreq}>
            <SelectTrigger className="h-12 text-white">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              {FOOD_DELIVERY_FREQ_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={String(o.value)}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-white font-semibold">
            Dining out / month
          </Label>
          <Select value={diningFreq} onValueChange={setDiningFreq}>
            <SelectTrigger className="h-12 text-white">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              {DINING_FREQ_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={String(o.value)}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-white font-semibold">
            Delivery platform preference
          </Label>
          <Select
            value={platform}
            onValueChange={(v) => setPlatform(v as FoodPlatformPreference)}
          >
            <SelectTrigger className="h-12 text-white">
              <SelectValue placeholder="Select platform" />
            </SelectTrigger>
            <SelectContent>
              {FOOD_PLATFORM_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={onCalculate} className="w-full md:w-auto">
        Recommend food card
      </Button>

      {result && (
        <div className="space-y-6">
          <div className="rounded-xl border border-white/15 p-5 text-white space-y-3">
            <h2 className="text-lg font-semibold">
              Phase 1 — food spend breakdown
            </h2>
            <div className="grid gap-2 md:grid-cols-2 text-sm">
              <div>
                Annual delivery spend:{" "}
                {inr(result.spend.annualDeliverySpend)}
              </div>
              <div>
                Annual dining-out spend:{" "}
                {inr(result.spend.annualDiningSpend)}
              </div>
              <div>Annual total: {inr(result.spend.annualTotal)}</div>
            </div>

            <div className="rounded-lg border border-white/10 p-3 text-sm">
              <div className="grid grid-cols-2 font-semibold text-xs text-muted-foreground pb-2 border-b border-white/10">
                <span>Allocation</span>
                <span className="text-right">Annual spend</span>
              </div>
              <div className="grid grid-cols-2 py-1">
                <span>Swiggy delivery</span>
                <span className="text-right">
                  {inr(result.spend.deliveryAllocation.swiggy)}
                </span>
              </div>
              <div className="grid grid-cols-2 py-1">
                <span>Zomato delivery</span>
                <span className="text-right">
                  {inr(result.spend.deliveryAllocation.zomato)}
                </span>
              </div>
              <div className="grid grid-cols-2 py-1">
                <span>Other delivery</span>
                <span className="text-right">
                  {inr(result.spend.deliveryAllocation.other)}
                </span>
              </div>
              <div className="grid grid-cols-2 py-1">
                <span>Swiggy dining</span>
                <span className="text-right">
                  {inr(result.spend.diningAllocation.swiggy)}
                </span>
              </div>
              <div className="grid grid-cols-2 py-1">
                <span>Zomato dining</span>
                <span className="text-right">
                  {inr(result.spend.diningAllocation.zomato)}
                </span>
              </div>
              <div className="grid grid-cols-2 py-1">
                <span>Offline dining</span>
                <span className="text-right">
                  {inr(result.spend.diningAllocation.other)}
                </span>
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
                Annual return:{" "}
                <span className="text-green-500 font-semibold">
                  {inr(result.best.annualReturnInr)}
                </span>{" "}
                ({pct(result.best.effectiveRatePercentage)} effective)
              </div>
            </div>
          )}

          <div className="space-y-4">
            {result.byCard.map((row, idx) => (
              <FoodCardResult key={row.cardId} result={row} rank={idx} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const FOOD_DELIVERY_PLATFORM_OPTIONS_TWO: {
  label: string;
  value: FoodDeliveryPlatformPreferenceTwo;
}[] = [
  { label: "Swiggy", value: "swiggy" },
  { label: "Zomato", value: "zomato" },
  { label: "Others", value: "others" },
];

const FOOD_DINING_PLATFORM_OPTIONS: {
  label: string;
  value: FoodDiningPlatformPreference;
}[] = [
  { label: "Swiggy Dineout", value: "swiggy_dineout" },
  { label: "Zomato District", value: "zomato_district" },
  { label: "EazyDiner", value: "eazydiner" },
  { label: "Direct restaurant payment", value: "others" },
];

function FoodCardPhaseTwoForm() {
  const [deliveryFreq, setDeliveryFreq] = useState("6");
  const [diningFreq, setDiningFreq] = useState("4");
  const [deliveryAvg, setDeliveryAvg] = useState("700");
  const [diningAvg, setDiningAvg] = useState("2000");
  const [deliveryPlatform, setDeliveryPlatform] =
    useState<FoodDeliveryPlatformPreferenceTwo>("swiggy");
  const [diningPlatform, setDiningPlatform] =
    useState<FoodDiningPlatformPreference>("swiggy_dineout");
  const [result, setResult] = useState<FoodCardEngineResultTwo | null>(null);

  const onCalculate = () => {
    const d = Number(deliveryFreq);
    const o = Number(diningFreq);
    const dAvg = Number(deliveryAvg);
    const oAvg = Number(diningAvg);
    if (!Number.isFinite(d) || d < 0) return;
    if (!Number.isFinite(o) || o < 0) return;
    if (!Number.isFinite(dAvg) || dAvg < 0) return;
    if (!Number.isFinite(oAvg) || oAvg < 0) return;

    setResult(
      recommendFoodCardPhaseTwo({
        onlineFoodDeliveryFrequency: d,
        diningOutFrequency: o,
        onlineFoodDeliveryAverageSpend: dAvg,
        diningOutAverageSpend: oAvg,
        foodDeliveryPlatformPreference: deliveryPlatform,
        diningOutPlatformPreference: diningPlatform,
      }),
    );
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label className="text-white font-semibold">
            Online food delivery / month
          </Label>
          <Select value={deliveryFreq} onValueChange={setDeliveryFreq}>
            <SelectTrigger className="h-12 text-white">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              {FOOD_DELIVERY_FREQ_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={String(o.value)}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-white font-semibold">
            Dining out / month
          </Label>
          <Select value={diningFreq} onValueChange={setDiningFreq}>
            <SelectTrigger className="h-12 text-white">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              {DINING_FREQ_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={String(o.value)}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-white font-semibold">
            Avg delivery order (₹)
          </Label>
          <Input
            type="number"
            min={0}
            value={deliveryAvg}
            className="text-white"
            onChange={(e) => setDeliveryAvg(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white font-semibold">
            Avg dining bill (₹)
          </Label>
          <Input
            type="number"
            min={0}
            value={diningAvg}
            className="text-white"
            onChange={(e) => setDiningAvg(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white font-semibold">
            Delivery platform preference
          </Label>
          <Select
            value={deliveryPlatform}
            onValueChange={(v) =>
              setDeliveryPlatform(v as FoodDeliveryPlatformPreferenceTwo)
            }
          >
            <SelectTrigger className="h-12 text-white">
              <SelectValue placeholder="Select platform" />
            </SelectTrigger>
            <SelectContent>
              {FOOD_DELIVERY_PLATFORM_OPTIONS_TWO.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-white font-semibold">
            Dining payment route
          </Label>
          <Select
            value={diningPlatform}
            onValueChange={(v) =>
              setDiningPlatform(v as FoodDiningPlatformPreference)
            }
          >
            <SelectTrigger className="h-12 text-white">
              <SelectValue placeholder="Select payment route" />
            </SelectTrigger>
            <SelectContent>
              {FOOD_DINING_PLATFORM_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={onCalculate} className="w-full md:w-auto">
        Recommend food card
      </Button>

      {result && (
        <div className="space-y-6">
          <div className="rounded-xl border border-white/15 p-5 text-white space-y-3">
            <h2 className="text-lg font-semibold">
              Phase 2 — food spend breakdown
            </h2>
            <div className="grid gap-2 md:grid-cols-2 text-sm">
              <div>
                Annual delivery spend:{" "}
                {inr(result.spend.annualDeliverySpend)}
              </div>
              <div>
                Annual dining-out spend:{" "}
                {inr(result.spend.annualDiningSpend)}
              </div>
              <div>Annual total: {inr(result.spend.annualTotal)}</div>
            </div>

            <div className="rounded-lg border border-white/10 p-3 text-sm">
              <div className="grid grid-cols-2 font-semibold text-xs text-muted-foreground pb-2 border-b border-white/10">
                <span>Delivery allocation</span>
                <span className="text-right">Annual spend</span>
              </div>
              <div className="grid grid-cols-2 py-1">
                <span>Swiggy</span>
                <span className="text-right">
                  {inr(result.spend.deliveryAllocation.swiggy)}
                </span>
              </div>
              <div className="grid grid-cols-2 py-1">
                <span>Zomato</span>
                <span className="text-right">
                  {inr(result.spend.deliveryAllocation.zomato)}
                </span>
              </div>
              <div className="grid grid-cols-2 py-1">
                <span>Other delivery</span>
                <span className="text-right">
                  {inr(result.spend.deliveryAllocation.other)}
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 p-3 text-sm">
              <div className="grid grid-cols-2 font-semibold text-xs text-muted-foreground pb-2 border-b border-white/10">
                <span>Dining allocation</span>
                <span className="text-right">Annual spend</span>
              </div>
              <div className="grid grid-cols-2 py-1">
                <span>Swiggy Dineout</span>
                <span className="text-right">
                  {inr(result.spend.diningAllocation.swiggyDineout)}
                </span>
              </div>
              <div className="grid grid-cols-2 py-1">
                <span>Zomato District</span>
                <span className="text-right">
                  {inr(result.spend.diningAllocation.zomatoDistrict)}
                </span>
              </div>
              <div className="grid grid-cols-2 py-1">
                <span>EazyDiner</span>
                <span className="text-right">
                  {inr(result.spend.diningAllocation.eazyDiner)}
                </span>
              </div>
              <div className="grid grid-cols-2 py-1">
                <span>Direct restaurant payment</span>
                <span className="text-right">
                  {inr(result.spend.diningAllocation.other)}
                </span>
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
                Annual return:{" "}
                <span className="text-green-500 font-semibold">
                  {inr(result.best.annualReturnInr)}
                </span>{" "}
                ({pct(result.best.effectiveRatePercentage)} effective)
              </div>
            </div>
          )}

          <div className="space-y-4">
            {result.byCard.map((row, idx) => (
              <FoodCardResult key={row.cardId} result={row} rank={idx} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const SHOPPING_PREFERENCE_OPTIONS: { label: string; value: ShoppingPreference }[] =
  [
    { label: "Mostly online (75/25)", value: "online" },
    { label: "Equal mix (50/50)", value: "equal" },
    { label: "Mostly offline (25/75)", value: "offline" },
  ];

const SHOPPING_PLATFORM_OPTIONS: {
  label: string;
  value: ShoppingOnlinePlatform;
}[] = [
  { label: "Amazon", value: "amazon" },
  { label: "Flipkart", value: "flipkart" },
  { label: "Myntra", value: "myntra" },
  { label: "Ajio", value: "ajio" },
  { label: "Nykaa", value: "nykaa" },
  { label: "Tata Neu / Tata CliQ", value: "tata_neu_cliq" },
  { label: "I shop across many platforms", value: "multiple_platform" },
];

function ShoppingSubRow({ sub }: { sub: ShoppingSubReturn }) {
  return (
    <div className="flex justify-between items-start gap-4 py-1 text-sm">
      <div>
        <div>{sub.label}</div>
        <div className="text-xs text-muted-foreground">
          {inr(sub.spend)} @ {pct(sub.effectivePercentage)} ({sub.source}
          {sub.merchant ? ` · ${sub.merchant}` : ""})
        </div>
      </div>
      <div className="text-right font-semibold text-green-500">
        +{inr(sub.returnInr)}
      </div>
    </div>
  );
}

function ShoppingStreamBlock({
  title,
  stream,
}: {
  title: string;
  stream: ShoppingStreamReturn;
}) {
  if (stream.spend <= 0) return null;
  return (
    <div className="rounded-lg border border-white/10 p-4">
      <div className="flex justify-between text-sm font-semibold mb-2">
        <span>{title}</span>
        <span>{inr(stream.spend)}/yr</span>
      </div>
      {stream.subs.map((s, i) => (
        <ShoppingSubRow key={i} sub={s} />
      ))}
      <div className="flex justify-between text-sm mt-2 pt-2 border-t border-white/10">
        <span>Stream return</span>
        <span className="font-semibold text-green-500">
          +{inr(stream.returnInr)}
        </span>
      </div>
    </div>
  );
}

function ShoppingCardResult({
  result,
  rank,
}: {
  result: CardShoppingReturn;
  rank: number;
}) {
  return (
    <div className="rounded-xl border border-white/15 p-5 text-white space-y-4">
      <div className="flex justify-between items-baseline">
        <div>
          <div className="text-xs text-muted-foreground">#{rank + 1}</div>
          <h3 className="text-lg font-semibold">{result.cardName}</h3>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Annual return</div>
          <div className="text-xl font-bold text-green-500">
            {inr(result.annualReturnInr)}
          </div>
          <div className="text-xs text-muted-foreground">
            {pct(result.effectiveRatePercentage)} effective
          </div>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <ShoppingStreamBlock title="Online shopping" stream={result.online} />
        <ShoppingStreamBlock title="Offline shopping" stream={result.offline} />
      </div>
    </div>
  );
}

function ShoppingCardPhaseOneForm() {
  const [monthlySpend, setMonthlySpend] = useState("40000");
  const [preference, setPreference] = useState<ShoppingPreference>("online");
  const [platforms, setPlatforms] = useState<ShoppingOnlinePlatform[]>([
    "amazon",
  ]);
  const [result, setResult] = useState<ShoppingCardEngineResult | null>(null);

  const togglePlatform = (p: ShoppingOnlinePlatform, checked: boolean) => {
    setPlatforms((prev) =>
      checked ? [...prev, p] : prev.filter((x) => x !== p),
    );
  };

  const onCalculate = () => {
    const monthly = Number(monthlySpend);
    if (!Number.isFinite(monthly) || monthly < 0) return;

    setResult(
      recommendShoppingCardPhaseOne({
        monthlySpend: monthly,
        shoppingPreference: preference,
        preferredOnlinePlatform: platforms,
      }),
    );
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-white font-semibold">
            Monthly shopping spend (₹)
          </Label>
          <Input
            type="number"
            min={0}
            value={monthlySpend}
            className="text-white"
            onChange={(e) => setMonthlySpend(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white font-semibold">Channel preference</Label>
          <Select
            value={preference}
            onValueChange={(v) => setPreference(v as ShoppingPreference)}
          >
            <SelectTrigger className="h-12 text-white">
              <SelectValue placeholder="Select preference" />
            </SelectTrigger>
            <SelectContent>
              {SHOPPING_PREFERENCE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-white font-semibold">
          Preferred online platforms (pick one or more)
        </Label>
        <div className="flex flex-wrap gap-4">
          {SHOPPING_PLATFORM_OPTIONS.map((o) => {
            const checked = platforms.includes(o.value);
            return (
              <label
                key={o.value}
                className="flex items-center gap-2 text-sm text-white"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(v) => togglePlatform(o.value, v === true)}
                />
                {o.label}
              </label>
            );
          })}
        </div>
      </div>

      <Button onClick={onCalculate} className="w-full md:w-auto">
        Recommend shopping card
      </Button>

      {result && (
        <div className="space-y-6">
          <div className="rounded-xl border border-white/15 p-5 text-white space-y-3">
            <h2 className="text-lg font-semibold">
              Phase 1 — shopping spend breakdown
            </h2>
            <div className="grid gap-2 md:grid-cols-2 text-sm">
              <div>Annual total: {inr(result.spend.annualTotal)}</div>
              <div>Annual online: {inr(result.spend.annualOnline)}</div>
              <div>Annual offline: {inr(result.spend.annualOffline)}</div>
            </div>

            <div className="rounded-lg border border-white/10 p-3 text-sm">
              <div className="grid grid-cols-2 font-semibold text-xs text-muted-foreground pb-2 border-b border-white/10">
                <span>Online allocation</span>
                <span className="text-right">Annual spend</span>
              </div>
              {result.spend.onlineAllocation.map((a, i) => (
                <div key={i} className="grid grid-cols-2 py-1">
                  <span>{a.label}</span>
                  <span className="text-right">{inr(a.spend)}</span>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-white/10 p-3 text-sm">
              <div className="grid grid-cols-2 font-semibold text-xs text-muted-foreground pb-2 border-b border-white/10">
                <span>Offline allocation</span>
                <span className="text-right">Annual spend</span>
              </div>
              <div className="grid grid-cols-2 py-1">
                <span>{result.spend.offlineAllocation.label}</span>
                <span className="text-right">
                  {inr(result.spend.offlineAllocation.spend)}
                </span>
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
                Annual return:{" "}
                <span className="text-green-500 font-semibold">
                  {inr(result.best.annualReturnInr)}
                </span>{" "}
                ({pct(result.best.effectiveRatePercentage)} effective)
              </div>
            </div>
          )}

          <div className="space-y-4">
            {result.byCard.map((row, idx) => (
              <ShoppingCardResult key={row.cardId} result={row} rank={idx} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ShoppingCardPhaseTwoResult({
  result,
  rank,
}: {
  result: CardShoppingReturnTwo;
  rank: number;
}) {
  return (
    <div className="rounded-xl border border-white/15 p-5 text-white space-y-4">
      <div className="flex justify-between items-baseline">
        <div>
          <div className="text-xs text-muted-foreground">#{rank + 1}</div>
          <h3 className="text-lg font-semibold">{result.cardName}</h3>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Annual return</div>
          <div className="text-xl font-bold text-green-500">
            {inr(result.annualReturnInr)}
          </div>
          <div className="text-xs text-muted-foreground">
            {pct(result.effectiveRatePercentage)} effective
          </div>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <ShoppingStreamBlock title="Online shopping" stream={result.online} />
        <ShoppingStreamBlock title="Offline shopping" stream={result.offline} />
        {result.utility && (
          <ShoppingStreamBlock title="Utility bills" stream={result.utility} />
        )}
      </div>
    </div>
  );
}

function ShoppingCardPhaseTwoForm() {
  const [monthlySpend, setMonthlySpend] = useState("40000");
  const [onlineShoppingSpend, setOnlineShoppingSpend] = useState("28000");
  const [platforms, setPlatforms] = useState<ShoppingOnlinePlatform[]>([
    "amazon",
  ]);
  const [hasUtility, setHasUtility] = useState(true);
  const [utilitySpend, setUtilitySpend] = useState("6000");
  const [result, setResult] = useState<ShoppingCardEngineResultTwo | null>(
    null,
  );

  const togglePlatform = (p: ShoppingOnlinePlatform, checked: boolean) => {
    setPlatforms((prev) =>
      checked ? [...prev, p] : prev.filter((x) => x !== p),
    );
  };

  const onCalculate = () => {
    const monthly = Number(monthlySpend);
    const online = Number(onlineShoppingSpend);
    const utility = Number(utilitySpend);
    if (!Number.isFinite(monthly) || monthly <= 0) return;
    if (!Number.isFinite(online) || online < 0) return;
    if (hasUtility && (!Number.isFinite(utility) || utility < 0)) return;

    setResult(
      recommendShoppingCardPhaseTwo({
        monthlySpend: monthly,
        preferredOnlinePlatform: platforms,
        totalOnlineShoppingMonthlySpend: online,
        additionalUtilityBills: hasUtility,
        additionalUtilityBillsMonthlySpend: hasUtility ? utility : 0,
      }),
    );
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-white font-semibold">
            Monthly shopping spend (₹)
          </Label>
          <Input
            type="number"
            min={0}
            value={monthlySpend}
            className="text-white"
            onChange={(e) => setMonthlySpend(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white font-semibold">
            Monthly online shopping spend (₹)
          </Label>
          <Input
            type="number"
            min={0}
            value={onlineShoppingSpend}
            className="text-white"
            onChange={(e) => setOnlineShoppingSpend(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-white font-semibold">
          Preferred online platforms (pick one or more)
        </Label>
        <div className="flex flex-wrap gap-4">
          {SHOPPING_PLATFORM_OPTIONS.map((o) => {
            const checked = platforms.includes(o.value);
            return (
              <label
                key={o.value}
                className="flex items-center gap-2 text-sm text-white"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(v) => togglePlatform(o.value, v === true)}
                />
                {o.label}
              </label>
            );
          })}
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-white/10 p-4">
        <label className="flex items-center gap-2 text-sm text-white">
          <Checkbox
            checked={hasUtility}
            onCheckedChange={(v) => setHasUtility(v === true)}
          />
          I also pay utility bills on this card
        </label>
        {hasUtility && (
          <div className="space-y-2">
            <Label className="text-white font-semibold">
              Monthly utility bills (₹)
            </Label>
            <Input
              type="number"
              min={0}
              value={utilitySpend}
              className="text-white"
              onChange={(e) => setUtilitySpend(e.target.value)}
            />
          </div>
        )}
      </div>

      <Button onClick={onCalculate} className="w-full md:w-auto">
        Recommend shopping card
      </Button>

      {result && (
        <div className="space-y-6">
          <div className="rounded-xl border border-white/15 p-5 text-white space-y-3">
            <h2 className="text-lg font-semibold">
              Phase 2 — shopping spend breakdown
            </h2>
            <div className="grid gap-2 md:grid-cols-2 text-sm">
              <div>Annual total: {inr(result.spend.annualTotal)}</div>
              <div>
                Online {result.spend.onlineSharePercentage.toFixed(1)}%:{" "}
                {inr(result.spend.annualOnline)}
              </div>
              <div>
                Offline {result.spend.offlineSharePercentage.toFixed(1)}%:{" "}
                {inr(result.spend.annualOffline)}
              </div>
              {result.spend.utility && (
                <div>
                  Annual utility bills: {inr(result.spend.utility.annualTotal)}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-white/10 p-3 text-sm">
              <div className="grid grid-cols-2 font-semibold text-xs text-muted-foreground pb-2 border-b border-white/10">
                <span>Online allocation</span>
                <span className="text-right">Annual spend</span>
              </div>
              {result.spend.onlineAllocation.map((a, i) => (
                <div key={i} className="grid grid-cols-2 py-1">
                  <span>{a.label}</span>
                  <span className="text-right">{inr(a.spend)}</span>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-white/10 p-3 text-sm">
              <div className="grid grid-cols-2 font-semibold text-xs text-muted-foreground pb-2 border-b border-white/10">
                <span>Offline allocation</span>
                <span className="text-right">Annual spend</span>
              </div>
              <div className="grid grid-cols-2 py-1">
                <span>{result.spend.offlineAllocation.label}</span>
                <span className="text-right">
                  {inr(result.spend.offlineAllocation.spend)}
                </span>
              </div>
            </div>

            {result.spend.utility && (
              <div className="rounded-lg border border-white/10 p-3 text-sm">
                <div className="grid grid-cols-2 font-semibold text-xs text-muted-foreground pb-2 border-b border-white/10">
                  <span>Utility allocation (90/10)</span>
                  <span className="text-right">Annual spend</span>
                </div>
                <div className="grid grid-cols-2 py-1">
                  <span>Utilities online</span>
                  <span className="text-right">
                    {inr(result.spend.utility.annualOnline)}
                  </span>
                </div>
                <div className="grid grid-cols-2 py-1">
                  <span>Utility offline (fallback)</span>
                  <span className="text-right">
                    {inr(result.spend.utility.annualOffline)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {result.best && (
            <div className="rounded-xl border border-green-500/40 bg-green-500/5 p-5 text-white">
              <div className="text-xs uppercase text-green-400">
                Best card for this profile
              </div>
              <div className="text-2xl font-bold">{result.best.cardName}</div>
              <div className="text-sm text-muted-foreground">
                Annual return:{" "}
                <span className="text-green-500 font-semibold">
                  {inr(result.best.annualReturnInr)}
                </span>{" "}
                ({pct(result.best.effectiveRatePercentage)} effective)
              </div>
            </div>
          )}

          <div className="space-y-4">
            {result.byCard.map((row, idx) => (
              <ShoppingCardPhaseTwoResult
                key={row.cardId}
                result={row}
                rank={idx}
              />
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
        <h1 className="text-2xl font-bold text-white">Card Advisor</h1>
        <p className="text-sm text-muted-foreground">
          Compare travel-card flows and the all-rounder recommendations.
        </p>
      </div>

      <Tabs defaultValue="initial" className="w-full">
        <TabsList>
          <TabsTrigger value="initial">Travel 1</TabsTrigger>
          <TabsTrigger value="advanced">Travel 2</TabsTrigger>
          <TabsTrigger value="all-rounder">Rounder 1</TabsTrigger>
          <TabsTrigger value="all-rounder-two">
          Rounder 2
          </TabsTrigger>
          <TabsTrigger value="food-one">Food 1</TabsTrigger>
          <TabsTrigger value="food-two">Food 2</TabsTrigger>
          <TabsTrigger value="shopping-one">
            Shopping 1
          </TabsTrigger>
          <TabsTrigger value="shopping-two">
            Shopping 2
          </TabsTrigger>
        </TabsList>
        <TabsContent value="initial" className="mt-6">
          <InitialTravelForm />
        </TabsContent>
        <TabsContent value="advanced" className="mt-6">
          <AdvancedTravelForm />
        </TabsContent>
        <TabsContent value="all-rounder" className="mt-6">
          <AllRounderPhaseOneForm />
        </TabsContent>
        <TabsContent value="all-rounder-two" className="mt-6">
          <AllRounderPhaseTwoForm />
        </TabsContent>
        <TabsContent value="food-one" className="mt-6">
          <FoodCardPhaseOneForm />
        </TabsContent>
        <TabsContent value="food-two" className="mt-6">
          <FoodCardPhaseTwoForm />
        </TabsContent>
        <TabsContent value="shopping-one" className="mt-6">
          <ShoppingCardPhaseOneForm />
        </TabsContent>
        <TabsContent value="shopping-two" className="mt-6">
          <ShoppingCardPhaseTwoForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
