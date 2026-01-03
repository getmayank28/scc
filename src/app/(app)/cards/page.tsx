"use client";
import { CreditCard } from "@/components/CreditCard";
import HeaderText from "@/components/HeaderText/HeaderText";
import SearchSelect from "@/components/SearchInput/SearchInput";
// import Typography from "@/components/Typography/Typography";
import { Button } from "@/components/ui/button";
import useUserData from "@/lib/hooks/useUserData";
import {
  useAddCardMutation,
  useGetUserCardsQuery,
  useRemoveUserCardMutation,
} from "@/store/api";
// import { CirclePlus } from "lucide-react";
import { useRef, useState } from "react";

// const AddCardButton = ({ onClick }: { onClick: () => void }) => {
//   return (
//     <div
//       onClick={onClick}
//       className="flex flex-col cursor-pointer rounded-lg justify-center items-center w-[330px] h-[180px] border border-dashed border-white/60 hover:bg-secondary-orange/30 hover:border-primary-orange"
//     >
//       <CirclePlus className="text-[#A0A0A0] w-20 h-20" />
//       <Typography variant="caption">Add card</Typography>
//     </div>
//   );
// };

const items = [
  {
    bg: "linear-gradient(90deg, #454893 10%, #15162D 100%)",
  },
  {
    bg: "linear-gradient(90deg, #676767 10%, #CDCDCD 100%)",
  },
  {
    bg: "linear-gradient(90deg, #604652 10%, #85576C 100%)",
  },
  {
    bg: "linear-gradient(90deg, #AE1D1D 10%, #AC3B3B 100%)",
  },
  {
    bg: "linear-gradient(90deg, #010101 10%, #504848 100%)",
  },
  {
    bg: "linear-gradient(90deg, #F35A13 10%, #8D340B 100%)",
  },
];

// function getCardColor(cardIndex: number) {
//   const colorIndex = (cardIndex % 7) % items.length;
//   return items[colorIndex]?.bg;
// }

const Cards = () => {
  const [selected, setSelected] = useState<{
    _id: string;
    name: string;
    bankName: string;
  } | null>(null);
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const { userId, name } = useUserData();

  const [addCard] =
    useAddCardMutation();

  const { data: userCards } = useGetUserCardsQuery({ userId }, {
    skip:!userId
  });

  const [removeUserCard] = useRemoveUserCardMutation();

  const handleSubmit = async () => {
    const body = {
      userId,
      cardId: selected?._id,
    };
    await addCard(body);
    setSelected(null);
    setQuery("");
  };

  const handleCardRemove = async (cardId: string) => {
    await removeUserCard({
      userId,
      cardId,
    });
  };

  // const handleAddCard = () => {
  //   if (searchInputRef.current) searchInputRef.current.focus();
  // };

  return (
    <div className="flex flex-col p-20 h-screen">
      <HeaderText
        containerClassName="items-start"
        title="Your cards"
        titleVariant="h3"
        titleClassName="font-bold"
        contentVariant="caption"
        content="Stop overpaying, optimize the cards you already use"
      />
      <div className="flex gap-2 mt-4">
        <SearchSelect
          searchInputRef={searchInputRef}
          query={query}
          setQuery={setQuery}
          selected={selected}
          setSelected={setSelected}
        />
        <Button
          disabled={!selected?.name}
          className="rounded-lg h-12 px-8"
          onClick={handleSubmit}
        >
          Add Card
        </Button>
      </div>
      <div className="flex gap-5 flex-wrap py-6">
        {userCards?.map((card:{_id:string, cardId:{name:string, _id:string}}, index: number) => (
          <CreditCard
            key={card?._id}
            isCardSpotlightActive={false}
            background={"#111"}
            cardName={card?.cardId?.name}
            name={name || ""}
            onRemove={() => handleCardRemove(card?.cardId?._id)}
          />
        ))}
      </div>

      {/* <div className="flex flex-col items-center justify-center gap-4 mt-20">
        <HeaderText
          title="Oh no! No cards yet"
          titleVariant="h5"
          titleClassName="font-bold"
          contentVariant="caption"
          content="Add one so we can help you to get more from every swipe"
        />
        <AddCardButton onClick={handleAddCard} />
      </div> */}
    </div>
  );
  //
  //
};

export default Cards;
