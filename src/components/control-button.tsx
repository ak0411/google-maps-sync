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
        `h-[40px] text-lg font-normal ${inPano && "dark text-white"}`,
        className
      )}
      variant={inControl ? "destructive" : "outline"}
      onClick={onControlClick}
      disabled={isControlled && !inControl}
    >
      {inControl ? "Give Control" : "Take Control"}
    </Button>
  );
}

export default ControlButton;
