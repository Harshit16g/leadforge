"use client";

import React from "react";
import { StatefulButton } from "@/components/ui/stateful-button";

export default function StatefulButtonDemo() {
  // dummy API call
  const handleClick = () => {
    return new Promise((resolve) => {
      setTimeout(resolve, 4000);
    });
  };
  return (
    <div className="flex h-40 w-full items-center justify-center">
      <StatefulButton onClick={handleClick}>Send message</StatefulButton>
    </div>
  );
}
