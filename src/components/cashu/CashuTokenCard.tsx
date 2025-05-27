import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCashuWallet } from "@/hooks/useCashuWallet";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  Loader2,
  Scan,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useCashuToken } from "@/hooks/useCashuToken";
import QRCode from "react-qr-code";
import { useCashuStore } from "@/stores/cashuStore";
import { useCashuHistory } from "@/hooks/useCashuHistory";
import { useTransactionHistoryStore } from "@/stores/transactionHistoryStore";
import { format } from "date-fns";
import { getEncodedTokenV4 } from "@cashu/cashu-ts";
import { formatBalance } from "@/lib/cashu";
import { QRScanner } from "@/components/QRScanner";

interface CashuTokenCardProps {
  defaultTab?: "send" | "receive";
  hideTabs?: boolean;
}

export function CashuTokenCard({ defaultTab = "send", hideTabs = false }: CashuTokenCardProps) {
  const { user } = useCurrentUser();
  const { wallet } = useCashuWallet();
  const cashuStore = useCashuStore();
  const {
    history,
    isLoading: historyLoading,
    createHistory,
  } = useCashuHistory();
  const transactionHistoryStore = useTransactionHistoryStore();
  const {
    sendToken,
    receiveToken,
    isLoading,
    error: hookError,
  } = useCashuToken();

  const [activeTab] = useState(defaultTab);
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState("");
  const [generatedToken, setGeneratedToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Get recent transactions (last 3)
  const recentTransactions = transactionHistoryStore
    .getHistoryEntries()
    .slice(0, 3);

  const handlesendToken = async () => {
    if (!cashuStore.activeMintUrl) {
      setError(
        "No active mint selected. Please select a mint in your wallet settings."
      );
      return;
    }

    if (!amount || isNaN(parseInt(amount))) {
      setError("Please enter a valid amount");
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      setGeneratedToken("");

      const amountValue = parseInt(amount);
      const proofs = await sendToken(cashuStore.activeMintUrl, amountValue);
      const token = getEncodedTokenV4({
        mint: cashuStore.activeMintUrl,
        proofs: proofs.map((p) => ({
          id: p.id || "",
          amount: p.amount,
          secret: p.secret || "",
          C: p.C || "",
        })),
      });

      setGeneratedToken(token as string);
      setSuccess(`Token generated for ${formatBalance(amountValue)}`);
    } catch (error) {
      console.error("Error generating token:", error);
      setError(error instanceof Error ? error.message : String(error));
    }
  };

  const handleReceiveToken = async () => {
    if (!token) {
      setError("Please enter a token");
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      const proofs = await receiveToken(token);

      const totalAmount = proofs.reduce((sum, p) => sum + p.amount, 0);

      setSuccess(`Received ${formatBalance(totalAmount)} successfully!`);
      setToken("");
    } catch (error) {
      console.error("Error receiving token:", error);
      setError(error instanceof Error ? error.message : String(error));
    }
  };

  const copyTokenToClipboard = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken);
      setSuccess("Token copied to clipboard");
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleQRScan = async (data: string) => {
    // Check if it's a Cashu token (starts with 'cashu:')
    let cleanedData = data.replace(/^cashu:/i, "");

    // Basic validation for Cashu token format
    if (cleanedData.toLowerCase().startsWith("cashu")) {
      cleanedData = cleanedData.toLowerCase();
      setToken(cleanedData);
      setIsScannerOpen(false);
    } else {
      setError(
        "Invalid Cashu token. Please scan a valid Cashu token QR code."
      );
      setTimeout(() => setError(null), 3000);
    }
  };

  if (!wallet) {
    return (
      <div>
        {!user && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You need to log in to use tokens
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  return (
    <div>
      <Tabs value={activeTab}>
        {!hideTabs && (
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="receive">
              <ArrowDownLeft className="h-4 w-4 mr-2" />
              Receive
            </TabsTrigger>
            <TabsTrigger value="send">
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Send
            </TabsTrigger>
          </TabsList>
        )}

        {hideTabs ? (
          activeTab === "receive" ? (
            <TabsContent value="receive" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="token">Token</Label>
                <div className="relative">
                  <Input
                    id="token"
                    placeholder="cashuB..."
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0"
                    onClick={() => setIsScannerOpen(true)}
                  >
                    <Scan className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleReceiveToken}
                disabled={!token || !user || isLoading}
              >
                {isLoading ? "Processing..." : "Redeem Token"}
              </Button>
            </TabsContent>
          ) : (
            <TabsContent value="send" className="space-y-4 mt-4">
              {!generatedToken ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (sats)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="100"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>

                  <Button
                    className="w-full"
                    onClick={handlesendToken}
                    disabled={
                      !cashuStore.activeMintUrl || !amount || !user || isLoading
                    }
                  >
                    {isLoading ? "Generating..." : "Generate Token"}
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-md flex items-center justify-center">
                    <div className="border border-border p-2 bg-white">
                      <QRCode value={generatedToken} size={180} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Token</Label>
                    <div className="relative">
                      <Input
                        readOnly
                        value={generatedToken}
                        className="pr-10 font-mono text-xs break-all"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0"
                        onClick={copyTokenToClipboard}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setGeneratedToken("");
                      setAmount("");
                    }}
                  >
                    Generate Another Token
                  </Button>
                </div>
              )}
            </TabsContent>
          )
        ) : (
          <>
            <TabsContent value="receive" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="token">Token</Label>
                <div className="relative">
                  <Input
                    id="token"
                    placeholder="cashuB..."
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0"
                    onClick={() => setIsScannerOpen(true)}
                  >
                    <Scan className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleReceiveToken}
                disabled={!token || !user || isLoading}
              >
                {isLoading ? "Processing..." : "Redeem Token"}
              </Button>
            </TabsContent>
            <TabsContent value="send" className="space-y-4 mt-4">
              {!generatedToken ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (sats)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="100"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>

                  <Button
                    className="w-full"
                    onClick={handlesendToken}
                    disabled={
                      !cashuStore.activeMintUrl || !amount || !user || isLoading
                    }
                  >
                    {isLoading ? "Generating..." : "Generate Token"}
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-md flex items-center justify-center">
                    <div className="border border-border p-2 bg-white">
                      <QRCode value={generatedToken} size={180} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Token</Label>
                    <div className="relative">
                      <Input
                        readOnly
                        value={generatedToken}
                        className="pr-10 font-mono text-xs break-all"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0"
                        onClick={copyTokenToClipboard}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setGeneratedToken("");
                      setAmount("");
                    }}
                  >
                    Generate Another Token
                  </Button>
                </div>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>

      {(error || hookError) && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || hookError}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mt-4">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <QRScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleQRScan}
        title="Scan Cashu Token"
        description="Position the Cashu token QR code within the frame"
      />
    </div>
  );
}
