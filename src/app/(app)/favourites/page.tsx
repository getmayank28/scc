import HeaderText from "@/components/HeaderText/HeaderText";
import { Button } from "@/components/ui/button";

const FavoriteCard = () => {
  return (
    <div className="flex flex-col p-20 h-screen">
      <HeaderText
        containerClassName="items-start"
        title="Saved cards"
        titleVariant="h3"
        titleClassName="font-bold"
        contentVariant="caption"
        content="Easily manage and review your preferred cards at one place"
      />
       <div className="flex flex-col items-center justify-center gap-4 mt-20">
       <HeaderText
        title="Oh no! No cards yet"
        titleVariant="h5"
        titleClassName="font-bold"
        contentVariant="caption"
        content="Add cards to favourites to start seeing them here"
      />
    <Button variant='outline' size='xl' className="border-primary-orange rounded-full">Add Card</Button>
       </div>

    </div>
  ); 
};

export default FavoriteCard;

