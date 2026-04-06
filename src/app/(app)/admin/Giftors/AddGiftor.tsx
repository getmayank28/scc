"use client";

import Modal from "@/app/card/modal";
import Typography from "@/components/Typography/Typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useCreateGiftorMutation, useGetBanksQuery } from "@/store/admin";
import { generateSlug } from "../Partners/AddPartner";

export interface BankProps {
  _id: string;
  name: string;
}

const AddGiftor = ({
  open,
  onChange,
}: {
  open: boolean;
  onChange: () => void;
}) => {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [bankId, setBankId] = useState("");

  const { data: banks = [] } = useGetBanksQuery({});
  const [createGiftor, { isLoading }] = useCreateGiftorMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !url || !bankId) {
      toast.error("All fields are required");
      return;
    }

    const slug = generateSlug(name)

    try {
      await createGiftor({
        name,
        slug,
        url,
        bankId,
      }).unwrap();

      toast.success("Giftor added successfully");

      // reset
      setName("");
      setUrl("");
      setBankId("");

      onChange();
    } catch {
      toast.error("Failed to create giftor");
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onChange}
      className="m-10 p-10 w-[500px] max-w-[90vw] border-2 border-brown-border bg-brown-background"
    >
      <Typography variant="body" className="text-sm font-semibold mb-5">
        Add Giftor
      </Typography>

      <form onSubmit={handleSubmit} className="grid gap-4">
        {/* NAME */}
        <Input
          placeholder="Enter Giftor Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="text-white h-12 border-primary-orange"
        />

        {/* BANK */}
        <Select value={bankId} onValueChange={setBankId}>
        <SelectTrigger className="!h-12 w-full border-primary-orange text-white">
            <SelectValue placeholder="Select Bank" />
          </SelectTrigger>

          <SelectContent className="relative z-[9999999999]">
            {banks.map((bank: BankProps) => (
              <SelectItem key={bank._id} value={bank._id}>
                {bank.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* URL */}
        <Input
          placeholder="Enter URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="text-white h-12 border-primary-orange"
        />

        {/* SUBMIT */}
        <Button type="submit" disabled={isLoading} className="h-12">
          {isLoading && (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          )}
          Add Giftor
        </Button>
      </form>
    </Modal>
  );
};

export default AddGiftor;