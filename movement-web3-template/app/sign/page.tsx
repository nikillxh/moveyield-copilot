"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, Suspense } from "react";
import { toast, Toaster } from "sonner";
import { getAdapter } from "../misc/adapter";
import {
  AccountInfo,
  UserResponseStatus,
} from "@aptos-labs/wallet-standard";
import Background from "../components/Background";

const NETWORK_MAP: Record<string, { name: string; url: string; chainId: number }> = {
  "126": {
    name: "Movement Testnet",
    url: "https://testnet.movementnetwork.xyz/v1",
    chainId: 126,
  },
};

const REQUESTED_NETWORK = NETWORK_MAP["126"];

function SignPageContent() {
  const searchParams = useSearchParams();
  const [userAccount, setUserAccount] = useState<AccountInfo>();
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const action = searchParams.get("action");
  const amount = searchParams.get("amount");
  const vault = searchParams.get("vault");

  const connectWallet = useCallback(async () => {
    const adapter = await getAdapter();
    try {
      const response = await adapter.connect(undefined, REQUESTED_NETWORK);
      if (response.status === UserResponseStatus.APPROVED) {
        setUserAccount(response.args);
        toast.success("Wallet connected!");
      } else {
        toast.error("Connection rejected");
      }
    } catch (error) {
      toast.error("Failed to connect wallet");
      console.error(error);
    }
  }, []);

  const signAndSubmit = useCallback(async () => {
    if (!userAccount || !vault || !amount) return;

    setLoading(true);
    const signingToast = toast.info("Signing transaction...");

    try {
      const adapter = await getAdapter();

      // Ensure we're on the right network
      const network = await adapter.network();
      if (network.chainId !== REQUESTED_NETWORK.chainId) {
        const changeRes = await adapter.changeNetwork(REQUESTED_NETWORK);
        if (changeRes?.status !== UserResponseStatus.APPROVED) {
          toast.dismiss(signingToast);
          toast.error("Network change rejected");
          setLoading(false);
          return;
        }
      }

      let payload: any;

      if (action === "deposit") {
        payload = {
          function: `${vault}::vault::deposit`,
          typeArguments: ["0x1::aptos_coin::AptosCoin"],
          functionArguments: [amount],
        };
      } else if (action === "withdraw") {
        payload = {
          function: `${vault}::vault::withdraw`,
          typeArguments: ["0x1::aptos_coin::AptosCoin"],
          functionArguments: [amount],
        };
      } else {
        toast.dismiss(signingToast);
        toast.error("Unknown action");
        setLoading(false);
        return;
      }

      const signedTx = await adapter.signAndSubmitTransaction({ payload });

      toast.dismiss(signingToast);

      if (signedTx.status !== UserResponseStatus.APPROVED) {
        toast.error("Transaction rejected");
        setLoading(false);
        return;
      }

      setTxHash(signedTx.args.hash);
      toast.success("Transaction submitted!", {
        action: {
          label: "View on Explorer",
          onClick: () => {
            window.open(
              `https://explorer.movementnetwork.xyz/txn/${signedTx.args.hash}?network=testnet`,
              "_blank"
            );
          },
        },
      });
    } catch (error) {
      toast.dismiss(signingToast);
      toast.error("Transaction failed");
      console.error(error);
    }
    setLoading(false);
  }, [userAccount, vault, amount, action]);

  useEffect(() => {
    // Auto-connect if possible
    const init = async () => {
      const adapter = await getAdapter();
      if (await adapter.canEagerConnect()) {
        try {
          const response = await adapter.connect();
          if (response.status === UserResponseStatus.APPROVED) {
            setUserAccount(response.args);
          }
        } catch (error) {
          console.log(error);
        }
      }

      adapter.on("connect", (accInfo) => {
        if (accInfo && "address" in accInfo) {
          setUserAccount(accInfo);
        }
      });

      adapter.on("disconnect", () => {
        setUserAccount(undefined);
      });
    };
    init();
  }, []);

  const actionLabel = action === "deposit" ? "Deposit" : action === "withdraw" ? "Withdraw" : "Transaction";

  return (
    <>
      <Background />
      <Toaster position="bottom-center" richColors />
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-black/60 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full border border-white/10">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">
            🚀 MoveYield Copilot
          </h1>

          {txHash ? (
            <div className="text-center">
              <div className="text-green-400 text-6xl mb-4">✅</div>
              <h2 className="text-xl text-white mb-2">Transaction Submitted!</h2>
              <p className="text-gray-400 text-sm mb-4 break-all">
                {txHash}
              </p>
              <a
                href={`https://explorer.movementnetwork.xyz/txn/${txHash}?network=testnet`}
                target="_blank"
                rel="noreferrer"
                className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition"
              >
                View on Explorer →
              </a>
              <p className="text-gray-500 text-sm mt-4">
                You can close this window and return to Telegram.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white/5 rounded-lg p-4 mb-6">
                <h2 className="text-lg font-semibold text-white mb-3">
                  📋 {actionLabel} Summary
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount:</span>
                    <span className="text-white font-mono">{amount} MOVE</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Action:</span>
                    <span className="text-white capitalize">{action}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Network:</span>
                    <span className="text-white">Movement Testnet</span>
                  </div>
                </div>
              </div>

              {!userAccount ? (
                <button
                  onClick={connectWallet}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 px-6 rounded-lg transition text-lg"
                >
                  🔗 Connect Wallet
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <p className="text-green-400 text-sm">
                      ✅ Connected: {userAccount.address.toString().slice(0, 8)}...
                      {userAccount.address.toString().slice(-6)}
                    </p>
                  </div>
                  <button
                    onClick={signAndSubmit}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition text-lg"
                  >
                    {loading ? "⏳ Signing..." : `✍️ Sign & Submit ${actionLabel}`}
                  </button>
                </div>
              )}

              <p className="text-gray-500 text-xs mt-4 text-center">
                The bot never holds or signs your keys.
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function SignPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <SignPageContent />
    </Suspense>
  );
}
