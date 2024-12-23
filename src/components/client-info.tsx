import React from "react";
import { Button } from "./ui/button";
import { CircleUserRound, Users } from "lucide-react";
import { twMerge } from "tailwind-merge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { DropdownMenuItem } from "@radix-ui/react-dropdown-menu";

type Props = {
  currentClient: string;
  clients: string[];
  inPano: boolean;
  className?: string;
};

function ClientInfo({ currentClient, clients, inPano, className }: Props) {
  return (
    <div className={twMerge("shadow-md flex", className)}>
      <Button
        variant="secondary"
        className={`h-[40px] text-lg ${inPano && "dark opacity-85"}`}
      >
        {clients.length}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={`h-[40px] ${inPano && "dark text-white opacity-85"}`}
          >
            <Users />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[250px]">
          <DropdownMenuLabel>Users</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="space-y-2 font-mono">
            <DropdownMenuItem
              disabled
              className="flex gap-2 items-center font-bold"
            >
              <CircleUserRound />
              {currentClient}
              <DropdownMenuShortcut>Me</DropdownMenuShortcut>
            </DropdownMenuItem>
            {clients.map((client, i) => {
              if (client === currentClient) return;
              return (
                <DropdownMenuItem
                  key={i}
                  disabled
                  className="flex gap-2 items-center"
                >
                  <CircleUserRound /> {client}
                </DropdownMenuItem>
              );
            })}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default ClientInfo;
