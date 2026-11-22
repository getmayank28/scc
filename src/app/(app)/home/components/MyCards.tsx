import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { useAnalytics } from "@/lib/analytics/hooks/useAnalytics";
import { EventName } from "@/lib/analytics/types";
import { useAddCardModal } from "@/contexts/AddCardContext";
import { ROUTES } from "@/lib/constants/routes";
import { bankIcon } from "@/lib/data/banks";
import type { CheatSheetCard } from "@/lib/advisor/walletCheatSheet";
import Slider from "./Slider";

/**
 * The cards in the user's wallet, as card faces. Users without cards get
 * nothing here — the hero already asks them to add some.
 */
const MyCards = ({ cards }: { cards: CheatSheetCard[] }) => {
  const { track } = useAnalytics();
  const { openAddCard } = useAddCardModal();

  if (cards.length === 0) return null;

  return (
    <section>
      <div className="hm-section-head">
        <div>
          <h2 className="hm-h2">My cards</h2>
          <p className="hm-lede">
            {cards.length === 1 ? "The card in your wallet." : `The ${cards.length} cards in your wallet.`}
          </p>
        </div>
        <Link href={ROUTES.PROFILE} className="hm-link">
          Manage <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      <Slider className="hm-mycards" count={cards.length + 1} label="My cards">
        {cards.map((c) => (
          <div key={c.slug} className="hm-cc">
            <span className="hm-cc-bank">
              <Image
                src={`/icons/banks/${bankIcon?.[c.bankName] ?? bankIcon?.default}`}
                alt=""
                width={22}
                height={22}
              />
            </span>
            <span className="hm-cc-name">{c.name}</span>
          </div>
        ))}
        <button
          type="button"
          className="hm-cc hm-cc-add"
          onClick={() => {
            track(EventName.HOME_ADD_CARDS_CLICKED, {});
            openAddCard("home_my_cards");
          }}
        >
          <Plus className="h-5 w-5" aria-hidden />
          Add a card
        </button>
      </Slider>
    </section>
  );
};

export default MyCards;
