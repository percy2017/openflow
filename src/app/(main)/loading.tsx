import { Loader2 } from "lucide-react";

export default function MainLoading() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center h-full">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  );
}
