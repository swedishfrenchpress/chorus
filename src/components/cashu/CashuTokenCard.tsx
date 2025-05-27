import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  QrCode,
  Scan,
  Loader2,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useCashuToken } from "@/hooks/useCashuToken";
import QRCode from "react-qr-code";
import { useCashuStore } from "@/stores/cashuStore";
import { useCashuHistory } from "@/hooks/useCashuHistory";
import { useTransactionHistoryStore } from "@/stores/transactionHistoryStore";
import { format } from "date-fns";
import { getEncodedTokenV4 } from "@cashu/cashu-ts";
import { useWalletUiStore } from "@/stores/walletUiStore";
import { formatBalance } from "@/lib/cashu";
import { useToast } from "@/hooks/useToast";
import { QRScanner } from "@/components/QRScanner";

export function CashuTokenCard() {
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
  const walletUiStore = useWalletUiStore();
  const isExpanded = walletUiStore.expandedCards.token;
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("receive");
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState("");
  const [generatedToken, setGeneratedToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

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

  const startQrScanner = () => {
    // This would typically invoke a QR scanner component
    // For now, we'll just show an alert
    alert("QR scanner not implemented in this example");
  };

  const handleQRScan = (scannedToken: string) => {
    setToken(scannedToken);
    setIsScanning(false);
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading wallet...</div>;
  }

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
      <Tabs value={activeTab} onValueChange={setActiveTab}>
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

        <TabsContent value="receive" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="token">Token</Label>
            <div className="relative">
              <Input
                id="token"
                placeholder="Paste your token here"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="pr-20"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
                onClick={() => setIsScanning(true)}
              >
                <Scan className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handleReceiveToken}
            disabled={isLoading || !token}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Receive Token"
            )}
          </Button>
        </TabsContent>

        <TabsContent value="send" className="space-y-4">
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
            disabled={isLoading || !amount}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Generate Token"
            )}
          </Button>

          {generatedToken && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-md flex items-center justify-center">
                <div className="border border-border w-48 h-48 flex items-center justify-center bg-white p-2 rounded-md">
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
                    onClick={() => {
                      navigator.clipboard.writeText(generatedToken);
                      toast({
                        title: "Token copied to clipboard",
                      });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mt-4">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <QRScanner
        isOpen={isScanning}
        onClose={() => setIsScanning(false)}
        onScan={handleQRScan}
        title="Scan Token"
        description="Position the token QR code within the frame"
      />
    </div>
  );
}
