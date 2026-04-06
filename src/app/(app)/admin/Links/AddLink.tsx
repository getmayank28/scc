"use client";

import Modal from "@/app/card/modal";
import Typography from "@/components/Typography/Typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateLinkMutation, useGetBanksQuery, useGetPartnersQuery } from "@/store/admin";
import SearchSelect from "@/components/SearchInput/SearchInput";


type CardType = {
  _id: string;
  name: string;
  bankName: string;
};

export interface BankProps {
  name:string;
slug:string;
website?:string;
_id:string;
}

const AddLink = ({
  open,
  onChange,
}: {
  open: boolean;
  onChange: () => void;
}) => {
  const [mode, setMode] = useState<"card" | "bank">("card");

  const [query, setQuery] = useState("");
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [bankId, setBankId] = useState("");
  const [partnerId, setPartnerId] = useState("");

  const [url, setUrl] = useState("");
  const [priority, setPriority] = useState("1");
  const [active, setActive] = useState("true");

  const [createLink, { isLoading }] = useCreateLinkMutation();
  const {data} = useGetBanksQuery({})
  const { data:partnersData } = useGetPartnersQuery();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url || !partnerId) {
      toast.error("Please fill required fields");
      return;
    }

    if (mode === "card" && !selectedCard?._id) {
      toast.error("Please select a card");
      return;
    }

    if (mode === "bank" && !bankId) {
      toast.error("Please select a bank");
      return;
    }

    const body:{
      partnerId: string;
      url: string;
      priority: number;
      active: boolean;
      cardId?: string;
      bankId?:string
  } = {
      partnerId,
      url,
      priority: Number(priority),
      active: active === "true",
    }

    if(mode === "card"){
      body.cardId = selectedCard?._id 
    }

    if(mode === "bank"){
      body.bankId = bankId
    }

    try {
      await createLink(body).unwrap();

      toast.success("Link added successfully");

      setQuery("");
      setSelectedCard(null);
      setBankId("");
      setPartnerId("");
      setUrl("");
      setPriority("1");
      setActive("true");

      onChange();
    } catch {
      toast.error("Failed to create link");
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onChange}
      className="m-10 p-10 h-fit min-h-[40vh] flex flex-col items-center justify-center max-md:min-h-[100vh] max-md:!rounded-[0px] max-md:p-4 max-md:w-full border-2 border-brown-border bg-brown-background w-[500px] max-w-[90vw]"
    >
      <Typography variant="caption" className="text-sm font-semibold mb-5">
        Add New Link
      </Typography>

      <form onSubmit={handleSubmit} className="w-full grid gap-4">
        {/* RADIO */}
        <div className="flex gap-6 text-white">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={mode === "card"}
              onChange={() => setMode("card")}
            />
            Card Specific
          </label>

          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={mode === "bank"}
              onChange={() => setMode("bank")}
            />
            Bank Specific
          </label>
        </div>

        {/* CARD SEARCH */}
        {mode === "card" && (
          <SearchSelect
            searchInputRef={searchInputRef}
            query={query}
            setQuery={setQuery}
            selected={selectedCard}
            setSelected={setSelectedCard}
            onClearInput={() => {
              setQuery("");
              setSelectedCard(null);
            }}
          />
        )}

        {/* BANK */}
        {mode === "bank" && (
          <Select value={bankId} onValueChange={setBankId}>
          <SelectTrigger className="!h-12 w-full border-primary-orange text-white">
              <SelectValue placeholder="Select Bank" />
            </SelectTrigger>
            <SelectContent className="relative z-[9999999999]">
              {data.map((bank:BankProps) => (
                <SelectItem key={bank._id} value={bank._id}>
                  {bank.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* PARTNER */}
        <Select value={partnerId} onValueChange={setPartnerId}>
        <SelectTrigger className="!h-12 w-full border-primary-orange text-white">
            <SelectValue placeholder="Select Partner" />
          </SelectTrigger>
          <SelectContent className="relative z-[9999999999]">
            {partnersData?.map((partner) => (
              <SelectItem key={partner._id} value={partner._id}>
                {partner.name}
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

        {/* PRIORITY */}
        <Select value={priority} onValueChange={setPriority}>
        <SelectTrigger className="!h-12 w-full border-primary-orange text-white">
            <SelectValue placeholder="Select Priority" />
          </SelectTrigger>
          <SelectContent className="relative z-[9999999999]">
            {Array.from({ length: 10 }).map((_, i) => (
              <SelectItem key={i} value={(i + 1).toString()}>
                {i + 1}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* STATUS */}
        <Select value={active} onValueChange={setActive}>
        <SelectTrigger className="!h-12 w-full border-primary-orange text-white">
            <SelectValue placeholder="Select Status" />
          </SelectTrigger>
          <SelectContent className="relative z-[9999999999]">
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {/* SUBMIT */}
        <Button
          type="submit"
          className="w-full h-12"
          disabled={isLoading}
        >
          {isLoading && (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          )}
          Create Link
        </Button>
      </form>
    </Modal>
  );
};

export default AddLink;