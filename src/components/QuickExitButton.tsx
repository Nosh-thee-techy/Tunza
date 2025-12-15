import { X } from "lucide-react";
import { Button } from "./ui/button";

const QuickExitButton = () => {
  const handleQuickExit = () => {
    // Navigate to a neutral website immediately
    window.location.replace("https://www.google.com");
  };

  return (
    <Button
      variant="exit"
      size="icon"
      onClick={handleQuickExit}
      aria-label="Quick exit - leaves this site immediately"
      title="Quick exit"
    >
      <X className="h-5 w-5" />
    </Button>
  );
};

export default QuickExitButton;
