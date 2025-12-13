import HeaderText from "@/components/HeaderText/HeaderText";
import Typography from "@/components/Typography/Typography";
import { CirclePlus } from "lucide-react";

const AddCardButton = () => {
    return (
        <div className="flex flex-col cursor-pointer rounded-lg justify-center items-center w-[330px] h-[180px] border border-dashed border-white/60 hover:bg-secondary-orange/30 hover:border-primary-orange">
        <CirclePlus className="text-[#A0A0A0] w-20 h-20" />
        <Typography variant="caption">Add card</Typography>
      </div>
    )
}
const Cards = () => {
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
       <div className="flex flex-col items-center justify-center gap-4 mt-20">
       <HeaderText
        title="Oh no! No cards yet"
        titleVariant="h5"
        titleClassName="font-bold"
        contentVariant="caption"
        content="Add one so we can help you to get more from every swipe"
      />
      <AddCardButton/>
       </div>

    </div>
  );
//   
//   
};

export default Cards;
