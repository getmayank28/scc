"use client";
import TabBar from "@/components/Tab/Tab";
import AdminCardModule from "./cards";
import { useState } from "react";
import RaisedTickets from "./Tickets";
import AdminLinks from "./Links";
import Partners from "./Partners/page";
import Giftors from "./Giftors/page";
import Portals from "./Portals/page";

const tabs = [
  {
    label: "Added cards",
    value: "added-cards",
  },
  {
    label: "Raised tickets",
    value: "raised-tickets",
  },
  {
    label: "Partners",
    value: "partners",
  },
  {
    label: "Affiliate links",
    value: "affiliate-links",
  },
  {
    label: "Giftors",
    value: "giftors",
  },
  {
    label: "Portals",
    value: "portals",
  },
];

const AdminDashboard = () => {
  const [selectedValue, setSelectedValue] = useState("added-cards");

  return (
    <div className="flex flex-col gap-2 flex-wrap p-10">
      <TabBar
        value={selectedValue}
        tabs={tabs}
        onChange={(value) => setSelectedValue(value)}
      />
      {
        selectedValue === "added-cards" && <AdminCardModule />
      }
      {
        selectedValue === "raised-tickets" && <RaisedTickets />
      }
      {
        selectedValue === "partners" && <Partners />
      }
      {
        selectedValue === "affiliate-links" && <AdminLinks />
      }
      {
        selectedValue === "giftors"&& <Giftors/>
      }
      {
        selectedValue === "portals"&& <Portals/>
      }
    </div>
  );
};

export default AdminDashboard;
