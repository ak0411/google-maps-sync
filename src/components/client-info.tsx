import React from "react";
import { Button } from "./ui/button";
import { Users } from "lucide-react";
import { twMerge } from "tailwind-merge";

type Props = {
  count: number;
  inPano: boolean;
  className?: string;
};

function ClientInfo({ count, inPano, className }: Props) {
  return (
    <div className={twMerge("shadow-md flex", className)}>
      <Button
        variant="secondary"
        className={`h-[40px] text-lg ${inPano && "dark opacity-85"}`}
      >
        {count}
      </Button>
      <Button
        variant="outline"
        className={`h-[40px] ${inPano && "dark text-white opacity-85"}`}
      >
        <Users />
      </Button>
    </div>
  );
}

export default ClientInfo;
