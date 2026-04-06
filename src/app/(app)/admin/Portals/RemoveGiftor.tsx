"use client";

import Modal from "@/app/card/modal";
import Typography from "@/components/Typography/Typography";
import { Button } from "@/components/ui/button";
import { useDeletePortalMutation } from "@/store/admin";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const RemovePortal = ({
  open,
  onChange,
  portal,
}: {
  portal: { id: string; name: string } | null;
  open: boolean;
  onChange: () => void;
}) => {
  const [deletePortal, { isLoading }] = useDeletePortalMutation();

  const handleRemovePortal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!portal?.id) return;

    try {
      await deletePortal(portal.id).unwrap();
      toast.success("Portal successfully deleted");
    } catch {
      toast.error("Failed to delete portal, please try again later");
    }

    onChange?.();
  };

  return (
    <Modal
      isOpen={open}
      onClose={onChange}
      allowOutsideClickClose={false}
      className="m-10 p-10 h-fit min-h-[40vh] flex flex-col items-center justify-center max-md:min-h-[100vh] max-md:!rounded-[0px] max-md:border-3 max-md:p-4 max-md:w-full max-md:min-w-full border-2 border-brown-border bg-brown-background w-[500px] min-w-[500px] max-w-[80vw]"
    >
      <Typography className="opacity-100 text-sm font-semibold mb-5">
        Are you sure you want to remove{" "}
        <span className="text-red-400">{portal?.name}</span>?
      </Typography>

      <div className="grid grid-cols-1 w-full gap-4">
        {/* CANCEL */}
        <Button
          onClick={onChange}
          variant="outline"
          className="w-full h-12 border-primary-orange"
        >
          Cancel
        </Button>

        {/* DELETE */}
        <Button
          className="w-full h-12 bg-destructive hover:bg-destructive/70"
          disabled={!portal?.id || isLoading}
          onClick={handleRemovePortal}
        >
          {isLoading && (
            <Loader2 className="h-5 w-5 animate-spin text-white mr-2" />
          )}
          Remove Portal
        </Button>
      </div>
    </Modal>
  );
};

export default RemovePortal;