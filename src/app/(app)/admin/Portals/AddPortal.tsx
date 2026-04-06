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

import { generateSlug } from "../Partners/AddPartner";
import { useCreatePortalMutation } from "@/store/admin";

const portalTypes = [
  "e-commerce",
  "food-and-delivery",
  "grocery",
  "travel",
  "fashion",
  "OTT/software",
  "education",
  "jewellery",
  "healthcare",
  "classifieds/auto",
  "others",
];

const AddPortal = ({
  open,
  onChange,
}: {
  open: boolean;
  onChange: () => void;
}) => {
  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [affiliateLink, setAffiliateLink] = useState("");
  const [portalType, setPortalType] = useState("others");
  const [status, setStatus] = useState("active");

  const [createPortal, { isLoading }] = useCreatePortalMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !websiteUrl) {
      toast.error("Name and Website URL are required");
      return;
    }

    const slug = generateSlug(name);

    try {
      await createPortal({
        name,
        slug,
        websiteUrl,
        affiliateLink: affiliateLink || null,
        portalType,
        status,
      }).unwrap();

      toast.success("Portal added successfully");

      // reset
      setName("");
      setWebsiteUrl("");
      setAffiliateLink("");
      setPortalType("others");
      setStatus("active");

      onChange();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create portal");
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onChange}
      className="m-10 p-10 w-[500px] max-w-[90vw] border-2 border-brown-border bg-brown-background"
    >
      <Typography variant="body" className="text-sm font-semibold mb-5">
        Add Portal
      </Typography>

      <form onSubmit={handleSubmit} className="grid gap-4">
        {/* NAME */}
        <Input
          placeholder="Enter Portal Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="text-white h-12 border-primary-orange"
        />

        {/* WEBSITE URL */}
        <Input
          placeholder="Enter Website URL"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          className="text-white h-12 border-primary-orange"
        />

        {/* AFFILIATE LINK */}
        <Input
          placeholder="Enter Affiliate Link (optional)"
          value={affiliateLink}
          onChange={(e) => setAffiliateLink(e.target.value)}
          className="text-white h-12 border-primary-orange"
        />

        {/* PORTAL TYPE */}
        <Select value={portalType} onValueChange={setPortalType}>
        <SelectTrigger className="!h-12 w-full border-primary-orange text-white">
            <SelectValue placeholder="Select Portal Type" />
          </SelectTrigger>
          <SelectContent className="relative z-[9999999999]">
            {portalTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* STATUS */}
        <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="!h-12 w-full border-primary-orange text-white">
            <SelectValue placeholder="Select Status" />
          </SelectTrigger>
          <SelectContent className="relative z-[9999999999]">
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {/* SUBMIT */}
        <Button type="submit" disabled={isLoading} className="h-12">
          {isLoading && (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          )}
          Add Portal
        </Button>
      </form>
    </Modal>
  );
};

export default AddPortal;