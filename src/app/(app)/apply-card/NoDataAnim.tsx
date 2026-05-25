import { CreditCard, Search } from "lucide-react";

export default function NoCardData() {
  return (
    <main className="flex flex-col items-center justify-center px-8 py-16 max-md:py-10 grow">
      <div className="relative">
        <div className="absolute inset-0 bg-primary-orange rounded-full blur-3xl opacity-30 animate-pulse" />
        <div className="relative w-44 h-44 max-md:w-28 max-md:h-28 bg-white/10 rounded-full flex items-center justify-center border-4 border-secondary-orange">
          <Search
            className="w-20 h-20 text-primary-orange max-md:w-10 max-md:h-10"
            strokeWidth={2.5}
          />
        </div>
      </div>

      <p className="text-lg max-md:text-sm opacity-70 text-white font-semibold text-center mt-10 max-w-xl">
        Search a card to see its annual fee, welcome benefits, rewards & redemption options — then apply in one click.
      </p>

      <div className="mt-8 grid grid-cols-3 gap-3 max-md:gap-2 max-w-xl w-full">
        {[
          { label: "Fees & charges" },
          { label: "Rewards & perks" },
          { label: "Apply link" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2 justify-center bg-brown-sidebar/60 border border-secondary-orange/40 rounded-lg p-3 max-md:p-2"
          >
            <CreditCard className="w-4 h-4 text-primary-orange shrink-0" />
            <span className="text-white/80 text-sm max-md:text-[11px] font-medium text-center">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}
