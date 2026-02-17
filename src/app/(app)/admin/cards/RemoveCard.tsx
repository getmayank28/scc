import Modal from "@/app/card/modal"
import Typography from "@/components/Typography/Typography";
import { Button } from "@/components/ui/button";
import { useDeleteCardMutation } from "@/store/admin";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const RemoveCard = ({ open, onChange, card }: {
    card: { id: string; name: string } | null
    open: boolean;
    onChange: () => void;
}) => {
    const [deleteCard, { isLoading }] = useDeleteCardMutation();

    const handleRemoveCardRequestSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!card?.id?.trim()) return

        try {
            await deleteCard(card?.id).unwrap()
            toast.success('Card successfully deleted')
        } catch {
            toast.success('Failed to record, please try again later')
        }
        onChange?.()
    }
    return (
        <Modal
            isOpen={open}
            onClose={onChange}
            allowOutsideClickClose={false}
            className="m-10 p-10 h-fit min-h-[40vh] flex flex-col items-center justify-center max-md:min-h-[100vh] max-md:!rounded-[0px] max-md:border-3 max-md:p-4 max-md:w-full max-md:min-w-full border-2 border-brown-border  bg-brown-background w-[500px] min-w-[500px] max-w-[80vw]"
        >
            <Typography variant="caption" className="text-sm font-semibold opacity-100 mb-5">Are you sure, you want to remove this card?</Typography>
            <div className="grid grid-cols-1 w-full gap-4">
                <Button onClick={onChange} variant={'outline'} type="submit" className={`w-full h-12 border-primary-orange`}
                    disabled={!card?.id}
                >
                    Cancel
                </Button>
                <Button type="submit" className={`text-sm w-full h-12 bg-destructive hover:bg-destructive/70`}
                    disabled={!card?.id}
                    onClick={handleRemoveCardRequestSubmit}
                >
                    {isLoading && (
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                    )}
                    Remove Card
                </Button>
            </div>
        </Modal>
    )
}

export default RemoveCard