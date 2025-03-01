import React, { useState } from "react";
import { twMerge } from "tailwind-merge";
import { Avatar, AvatarImage } from "./ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Button } from "./ui/button";
import { ArrowRightToLine } from "lucide-react";

type Props = {
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
  return validColors.includes(color) ? color : "gray";
}

function extractAnimalFromName(name: string): string {
  const parts = name.split(" ");
  if (parts.length < 2 || name.startsWith("Guest#")) {
    return "cat";
  }
  return parts[1].toLowerCase();
}

export function ClientAvatar({
  name,
  me = false,
  side = "bottom",
}: {
  name: string;
  me?: boolean;
  side?: "bottom" | "top" | "right" | "left" | undefined;
}) {
  const color = extractColorFromName(name);
  const animal = extractAnimalFromName(name);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`p-1 rounded-full bg-${color}-500 shadow cursor-pointer`}
          >
            <Avatar>
              <AvatarImage src={`/images/${animal}.png`} alt={name} />
            </Avatar>
          </div>
        </TooltipTrigger>
        <TooltipContent side={side}>
          <p>
            {name} {me && "(Me)"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ClientInfo({
  currentSocketId,
  connectedClients,
  inPano,
  className,
}: Props) {
  const SHOW_MAX_CLIENTS = 3;
  const [isExpanded, setIsExpanded] = useState(false);

  const allClients = [
    [currentSocketId, connectedClients[currentSocketId]],
    ...Object.entries(connectedClients).filter(
      ([key]) => key !== currentSocketId
    ),
  ];

  const visibleClients = isExpanded
    ? allClients
    : allClients.slice(0, SHOW_MAX_CLIENTS);

  return (
    <div className={twMerge(`flex gap-8 ${inPano && "dark"}`, className)}>
      <div
        className={`flex ${
          isExpanded ? "space-x-1" : "-space-x-2"
        } relative transition-all duration-200 ease-in-out`}
      >
        {visibleClients.map(([key, client], index) => (
          <div
            key={key}
            className="relative"
            style={{ zIndex: allClients.length - index }}
          >
            <ClientAvatar name={client} me={key === currentSocketId} />
          </div>
        ))}
        {allClients.length > SHOW_MAX_CLIENTS && (
          <Button
            variant="secondary"
            onClick={() => setIsExpanded(!isExpanded)}
            className="relative flex items-center justify-center size-12 rounded-full shadow transition-colors cursor-pointer"
          >
            <span className="text-sm font-medium">
              {isExpanded ? (
                <ArrowRightToLine />
              ) : (
                `+${allClients.length - SHOW_MAX_CLIENTS}`
              )}
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}

export default ClientInfo;
