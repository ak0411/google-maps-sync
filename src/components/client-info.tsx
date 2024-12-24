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

function extractColorFromName(name: string): string {
  const validColors = [
    "slate",
    "gray",
    "zinc",
    "neutral",
    "stone",
    "red",
    "orange",
    "amber",
    "yellow",
    "lime",
    "green",
    "emerald",
    "teal",
    "cyan",
    "sky",
    "blue",
    "indigo",
    "violet",
    "purple",
    "fuchsia",
    "pink",
    "rose",
  ];

  const color = name.split(" ")[0].toLowerCase();
  console.log(name, color);
  return validColors.includes(color) ? color : "gray";
}

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
        <DropdownMenuContent
          className={`${inPano && "dark"}`}
          align="end"
          alignOffset={0.5}
        >
          <DropdownMenuLabel>Users</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="space-y-2 px-2 py-1 min-w-[250px]">
            <DropdownMenuItem
              disabled
              className="flex gap-2 items-center font-bold"
            >
              <CircleUserRound
                className={twMerge(
                  `bg-${extractColorFromName(
                    connectedClients[currentSocketId]
                  )}-500`,
                  "rounded-full"
                )}
              />
              {connectedClients[currentSocketId]} (Me)
              {currentSocketId === currentController && (
                <DropdownMenuShortcut className="text-yellow-500 opacity-100">
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
                  <CircleUserRound
                    className={twMerge(
                      `bg-${extractColorFromName(client)}-500`,
                      "rounded-full"
                    )}
                  />{" "}
                  {client}
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
