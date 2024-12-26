import React from "react";
import { Button } from "./ui/button";
import { twMerge } from "tailwind-merge";

type Props = {
  inControl: boolean;
  isControlled: boolean;
  inPano: boolean;
  onControlClick: () => void;
  className?: string;
};

function ControlButton({
  inControl,
  isControlled,
  inPano,
  onControlClick,
  className,
}: Props) {
  return (
    <Button
      className={twMerge(
        `h-[40px] text-lg font-light bg-background shadow text-[#565656] hover:bg-[#e5e7eb] hover:text-black ${
          inPano && "dark bg-[#444444] text-white"
        } ${
          inControl && "bg-red-500 text-white hover:bg-red-600 hover:text-white"
        }`,
        className
      )}
      onClick={onControlClick}
      disabled={isControlled}
    >
      {inControl ? "Give Control" : "Take Control"}
    </Button>
  );
}

export default ControlButton;
