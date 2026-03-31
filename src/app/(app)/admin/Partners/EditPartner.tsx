"use client";

import Modal from "@/app/card/modal";
import Typography from "@/components/Typography/Typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUpdatePartnerMutation } from "@/store/admin";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PartnerType = "affiliate_network" | "bank" | "direct";

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");
};

const EditPartner = ({
  open,
  onChange,
  partner,
}: {
  partner: {
    id: string;
    name: string;
    type: PartnerType;
    baseUrl?: string;
    active: boolean;
  } | null;
  open: boolean;
  onChange: () => void;
}) => {
  const [name, setName] = useState("");
  const [type, setType] = useState<PartnerType>("direct");
  const [baseUrl, setBaseUrl] = useState("");
  const [active, setActive] = useState(true);

  const [updatePartner, { isLoading }] = useUpdatePartnerMutation();

  // ✅ preload existing data
  useEffect(() => {
    if (partner) {
      setName(partner.name);
      setType(partner.type);
      setBaseUrl(partner.baseUrl || "");
      setActive(partner.active);
    }
  }, [partner]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!partner?.id || !name.trim()) return;

    try {
      await updatePartner({
        id: partner.id,
        name,
        slug: generateSlug(name),
        type,
        baseUrl: baseUrl || undefined,
        active,
      }).unwrap();

      toast.success("Partner successfully updated");
      onChange?.();
    } catch {
      toast.error("Failed to update partner");
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onChange}
      allowOutsideClickClose={false}
      className="m-10 p-10 h-fit min-h-[40vh] flex flex-col items-center justify-center max-md:min-h-[100vh] max-md:!rounded-[0px] max-md:border-3 max-md:p-4 max-md:w-full max-md:min-w-full border-2 border-brown-border bg-brown-background w-[500px] min-w-[500px] max-w-[80vw]"
    >
      <Typography variant="body" className="opacity-100 text-sm font-semibold mb-5">
        Edit Partner: {partner?.name}
      </Typography>

      <form onSubmit={handleSubmit} className="w-full grid gap-4">
        {/* NAME */}
        <Input
          placeholder="Enter partner name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="text-white text-lg h-12 border-primary-orange"
        />

        {/* TYPE */}
        <Select
          value={type}
          onValueChange={(value: PartnerType) => setType(value)}
        >
          <SelectTrigger className="!h-12 w-full border-primary-orange text-white">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent className="relative z-[9999999999]">
            <SelectItem value="affiliate_network">
              Affiliate Network
            </SelectItem>
            <SelectItem value="bank">Bank</SelectItem>
            <SelectItem value="direct">Direct</SelectItem>
          </SelectContent>
        </Select>

        {/* BASE URL */}
        <Input
          placeholder="Base URL (optional)"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          className="text-white text-lg h-12 border-primary-orange"
        />

        {/* STATUS */}
        <Select
          value={active ? "active" : "inactive"}
          onValueChange={(val) => setActive(val === "active")}
        >
          <SelectTrigger className="!h-12 w-full border-primary-orange text-white">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent className="relative z-[9999999999]">
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {/* SUBMIT */}
        <Button
          type="submit"
          className="w-full h-12"
          disabled={!name || isLoading}
        >
          {isLoading && (
            <Loader2 className="h-5 w-5 animate-spin text-white mr-2" />
          )}
          Update Partner
        </Button>
      </form>
    </Modal>
  );
};

export default EditPartner;