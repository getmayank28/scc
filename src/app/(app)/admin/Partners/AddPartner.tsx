"use client";

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
import { Loader2 } from "lucide-react";
import { useCreatePartnerMutation } from "@/store/admin";

// helper: generate slug
export const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // spaces → dash
    .replace(/[^\w-]+/g, ""); // remove special chars
};

const AddPartner = ({
  open,
  onChange,
}: {
  open: boolean;
  onChange: () => void;
}) => {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [baseUrl, setBaseUrl] = useState("");

  const [createPartner, { isLoading }] = useCreatePartnerMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !type) return;

    const slug = generateSlug(name);

    try {
      await createPartner({
        name,
        slug,
        // @ts-expect-error this will work
        type,
        baseUrl: baseUrl || undefined,
        active: true,
      }).unwrap();

      toast.success("Partner successfully added");

      // reset
      setName("");
      setType("");
      setBaseUrl("");

      onChange?.();
    } catch {
      toast.error("Failed to add partner");
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onChange}
      className="m-10 p-10 h-fit min-h-[40vh] flex flex-col items-center justify-center max-md:min-h-[100vh] max-md:!rounded-[0px] max-md:border-3 max-md:p-4 max-md:w-full max-md:min-w-full border-2 border-brown-border bg-brown-background w-[500px] min-w-[500px] max-w-[80vw]"
    >
      <Typography
        variant="caption"
        className="text-sm font-semibold opacity-100 mb-5"
      >
        Add a new partner
      </Typography>

      <form
        onSubmit={handleSubmit}
        className="w-full grid grid-cols-1 gap-4"
      >
        {/* NAME */}
        <Input
          placeholder="Enter partner name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="text-white text-lg h-12 border-primary-orange"
        />

        {/* TYPE */}
        <Select value={type} onValueChange={(value) => setType(value as string)}>
          <SelectTrigger className="!h-12 w-full border-primary-orange text-white">
            <SelectValue placeholder="Select partner type" />
          </SelectTrigger>
          <SelectContent className="relative z-[9999999999]">
            <SelectItem value="affiliate_network">
              Affiliate Network
            </SelectItem>
            <SelectItem value="bank">Bank</SelectItem>
            <SelectItem value="direct">Direct</SelectItem>
          </SelectContent>
        </Select>

        {/* BASE URL (optional) */}
        <Input
          placeholder="Base URL (optional)"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          className="text-white text-lg h-12 border-primary-orange"
        />

        {/* SUBMIT */}
        <Button
          type="submit"
          className="w-full h-12"
          disabled={!name || !type|| isLoading}
        >
          {isLoading && (
            <Loader2 className="h-5 w-5 animate-spin text-white mr-2" />
          )}
          Add Partner
        </Button>
      </form>
    </Modal>
  );
};

export default AddPartner;