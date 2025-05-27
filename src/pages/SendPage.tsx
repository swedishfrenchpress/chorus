import { CashuWalletLightningCard } from "@/components/cashu/CashuWalletLightningCard";
import { CashuTokenCard } from "@/components/cashu/CashuTokenCard";
import Header from "@/components/ui/Header";
import { Separator } from "@/components/ui/separator";
import { Section } from "@/components/ui/section";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function SendPage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-1 px-3 sm:px-4">
      <Header />
      <Separator className="my-2" />

      <div className="space-y-8 max-w-md mx-auto">
        <div className="flex justify-start">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/wallet")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to wallet
          </Button>
        </div>

        <Section title="Lightning Network">
          <CashuWalletLightningCard />
        </Section>

        <Section title="Cashu Tokens">
          <CashuTokenCard />
        </Section>
      </div>
    </div>
  );
}

export default SendPage; 