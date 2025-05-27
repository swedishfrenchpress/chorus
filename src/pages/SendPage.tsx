import { CashuWalletLightningCard } from "@/components/cashu/CashuWalletLightningCard";
import { CashuTokenCard } from "@/components/cashu/CashuTokenCard";
import Header from "@/components/ui/Header";
import { Separator } from "@/components/ui/separator";
import { Section } from "@/components/ui/section";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

export function SendPage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-1 px-3 sm:px-4">
      <Header />
      <Separator className="my-2" />

      <div className="space-y-8 max-w-md mx-auto">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/wallet")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold">Send</h1>
          </div>
          <p className="text-muted-foreground">Send ecash to anyone</p>
        </div>

        <Section title="Bitcoin Lightning">
          <CashuWalletLightningCard defaultTab="send" hideTabs={true} />
        </Section>

        <Section title="Ecash">
          <CashuTokenCard defaultTab="send" hideTabs={true} />
        </Section>
      </div>
    </div>
  );
}

export default SendPage; 