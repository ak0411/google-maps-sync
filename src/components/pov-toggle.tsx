import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Toggle } from "./ui/toggle";
import { Eye, EyeOff } from "lucide-react";
import { twMerge } from "tailwind-merge";

type Props = {
  isFollowPov: boolean;
  setIsFollowPov: (value: boolean) => void;
  className?: string;
};

const PovToggle = ({ isFollowPov, setIsFollowPov, className }: Props) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle
          className={twMerge(
            "h-[40px] px-3 dark bg-[#444444] hover:bg-[#555555] shadow-lg text-gray-300 min-w-[120px] flex items-center gap-2",
            className
          )}
          pressed={isFollowPov}
          onPressedChange={setIsFollowPov}
        >
          {isFollowPov ? (
            <>
              <Eye size={16} />
              <span className="text-sm">View Synced</span>
            </>
          ) : (
            <>
              <EyeOff size={16} />
              <span className="text-sm">View Unsynced</span>
            </>
          )}
        </Toggle>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p>
          {isFollowPov
            ? "Street view is synced with other users"
            : "Street view is independent"}
        </p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export default PovToggle;
