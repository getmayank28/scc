import Modal from "@/app/card/modal";
import Typography from "@/components/Typography/Typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CardCategories } from "@/lib/data/cards";
import { useCreateCardMutation, useGetBanksQuery } from "@/store/admin";
import { Loader2 } from "lucide-react";
import { BankProps } from "../Links/AddLink";

const AddCard = ({
  open,
  onChange,
}: {
  open: boolean;
  onChange: () => void;
}) => {
  const [cardName, setCardName] = useState("");
  const [bankName, setBankName] = useState("");
  const [cardCategory, setCardCategory] = useState("");
  const [createCard, { isLoading }] = useCreateCardMutation();
  const { data } = useGetBanksQuery({});

  const generateSlug = (cardName: string, bankName: string) => {
    const a = cardName
      ?.split(" ")
      ?.map((ele) => ele?.toLowerCase())
      ?.join("-");
    const b = bankName?.split("-")?.at(1)
      ?.split(" ")
      ?.map((ele) => ele?.toLowerCase())
      ?.join("-");

    return a + "-" + b;
  };

  const handleNewCardRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cardName.trim() || !bankName.trim() || !cardCategory.trim()) return;

    try {
      await createCard({
        name: cardName,
        bankId: bankName?.split("-")?.at(0),
        bankName:bankName?.split("-")?.at(1),
        category: cardCategory,
        slug: generateSlug(cardName, bankName),
      }).unwrap();
      toast.success("Card successfully added");
    } catch {
      toast.error("Failed to record, please try again later");
    }
    setCardName("");
    onChange?.();
  };
  return (
    <Modal
      isOpen={open}
      onClose={onChange}
      className="m-10 p-10 h-fit min-h-[40vh] flex flex-col items-center justify-center max-md:min-h-[100vh] max-md:!rounded-[0px] max-md:border-3 max-md:p-4 max-md:w-full max-md:min-w-full border-2 border-brown-border  bg-brown-background w-[500px] min-w-[500px] max-w-[80vw]"
    >
      <Typography
        variant="caption"
        className="text-sm font-semibold opacity-100 mb-5"
      >
        Add a new card
      </Typography>
      <form
        onSubmit={handleNewCardRequestSubmit}
        className="w-full grid grid-cols-1 gap-4"
      >
        <Input
          placeholder="Enter card name..."
          value={cardName}
          onChange={(e) => {
            setCardName(e.target.value);
          }}
          className={`text-white text-lg h-12 max-md:text-xs border-primary-orange`}
        />
        <Select value={bankName} onValueChange={(value) => setBankName(value)}>
          <SelectTrigger
            id="paymentMethod"
            className={`!h-12 w-full border-primary-orange text-white`}
          >
            <SelectValue placeholder="Select bank" />
          </SelectTrigger>
          <SelectContent
            className="!max-h-[300px] !max-w-[430px] relative z-[2147483642]"
            position="popper"
            sideOffset={4}
          >
            {data?.map((bank: BankProps) => {
              return (
                <SelectItem key={bank._id} value={bank._id + "-"+bank.name}>
                  {bank.name}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <Select
          value={cardCategory}
          onValueChange={(value) => setCardCategory(value)}
        >
          <SelectTrigger
            id="paymentMethod"
            className={`!h-12 w-full border-primary-orange text-white`}
          >
            <SelectValue placeholder="Select card category" />
          </SelectTrigger>
          <SelectContent
            className="!max-h-[300px] !max-w-[430px] relative z-[2147483642]"
            position="popper"
            sideOffset={4}
          >
            {Object.values(CardCategories)?.map((bank) => {
              return (
                <SelectItem key={bank} value={bank}>
                  <div className="flex items-center gap-2">
                    <span>{bank}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <Button
          type="submit"
          className={`w-full h-12`}
          disabled={!cardName || !cardCategory || !bankName}
        >
          {isLoading && <Loader2 className="h-6 w-6 animate-spin text-white" />}
          Submit
        </Button>
      </form>
    </Modal>
  );
};

export default AddCard;
