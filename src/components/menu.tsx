import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

export default function Menu() {
  return (
    <div className="w-[400px] p-8 border space-y-4 flex flex-col">
      <h1 className="text-xl mb-2 uppercase">Getting Started</h1>
      <Input placeholder="Enter a room name" className="shadow-none" />
      <Button>Create a Room</Button>
      <div className="relative py-2">
        <div className="text-xs absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 bg-background p-1 border text-muted-foreground">
          or
        </div>
        <Separator />
      </div>
      <Button>Join a Room</Button>
    </div>
  );
}
