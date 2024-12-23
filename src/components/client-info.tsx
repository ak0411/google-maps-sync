import React from "react";
import { Button } from "./ui/button";
import { CircleUserRound, Crown, Users } from "lucide-react";
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
  currentController: string | null;
  currentSocketId: string;
  connectedClients: Record<string, string>;
  inPano: boolean;
  className?: string;
};

function ClientInfo({
  currentController,
  currentSocketId,
  connectedClients,
  inPano,
  className,
}: Props) {
  return (
    <div className={twMerge("shadow-md flex", className)}>
      <Button
        variant="secondary"
        className={`h-[40px] text-lg ${inPano && "dark opacity-85"}`}
      >
        {Object.keys(connectedClients).length}
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
              {connectedClients[currentSocketId]} (Me)
              {currentSocketId === currentController && (
                <DropdownMenuShortcut>
                  <Crown />
                </DropdownMenuShortcut>
              )}
            </DropdownMenuItem>
            {Object.entries(connectedClients).map(([key, client]) => {
              if (key === currentSocketId) return null;
              return (
                <DropdownMenuItem
                  key={key}
                  disabled
                  className="flex gap-2 items-center"
                >
                  <CircleUserRound /> {client}
                  {key === currentController && (
                    <DropdownMenuShortcut>
                      <Crown />
                    </DropdownMenuShortcut>
                  )}
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
