import Modal from "@/app/card/modal"
import Typography from "@/components/Typography/Typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUpdateCardMutation } from "@/store/admin";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

const EditCard = ({ open, onChange, card }: {
  card: { id: string; name: string }|null
  open: boolean;
  onChange: () => void;
}) => {
  const [cardName, setCardName] = useState("")
  const [updateCard, {isLoading}] = useUpdateCardMutation();

  const handleNewCardRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!cardName.trim()) return

    try {
        await updateCard({
          id: card?.id,
          name: cardName,
        }).unwrap()
      toast.success('Card successfully updated')
    } catch {
      toast.success('Failed to record, please try again later')
    }
    setCardName("")
    onChange?.()
  }
  return (
    <Modal
      isOpen={open}
      onClose={onChange}
      allowOutsideClickClose={false}
      className="m-10 p-10 h-fit min-h-[40vh] flex flex-col items-center justify-center max-md:min-h-[100vh] max-md:!rounded-[0px] max-md:border-3 max-md:p-4 max-md:w-full max-md:min-w-full border-2 border-brown-border  bg-brown-background w-[500px] min-w-[500px] max-w-[80vw]"
    >
      <Typography variant="caption" className="text-sm font-semibold opacity-100 mb-5">Current name: {card?.name}</Typography>
      <form onSubmit={handleNewCardRequestSubmit} className="w-full grid grid-cols-1 gap-4">
        <Input
          // disabled={disabled}
          // ref={searchInputRef}
          placeholder="Enter card name..."
          value={cardName}
          onChange={(e) => {
            setCardName(e.target.value);
          }}
          className={`text-white text-lg h-12 max-md:text-xs border-primary-orange`}
        />
        <Button type="submit" className={`w-full h-12`}
          disabled={!cardName}
        >
          {isLoading && (
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                )}
          Submit
        </Button>
      </form>
    </Modal>
  )
}

export default EditCard