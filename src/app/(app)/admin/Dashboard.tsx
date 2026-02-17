"use client";
import TabBar from "@/components/Tab/Tab";
import AdminCardModule from "./cards";
import { useState } from "react";
import RaisedTickets from "./Tickets";

const tabs = [
  {
    label: "Added cards",
    value: "added-cards",
  },
  {
    label: "Raised tickets",
    value: "raised-tickets",
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
    </div>
  );
};

export default AdminDashboard;
