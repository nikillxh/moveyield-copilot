"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, Suspense } from "react";
import { toast, Toaster } from "sonner";
import { getAdapter } from "../misc/adapter";
import { NETWORK_MAP } from "../misc/utils";
import {
  AccountInfo,
  UserResponseStatus,
} from "@aptos-labs/wallet-standard";

// Movement Testnet - chainId 127
const REQUESTED_NETWORK = NETWORK_MAP["127"];

function SignPageContent() {
  const searchParams = useSearchParams();
  const [userAccount, setUserAccount] = useState<AccountInfo>();
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoConnecting, setAutoConnecting] = useState(true);

  const action = searchParams.get("action");
  const amount = searchParams.get("amount");
  const vault = searchParams.get("vault");

  const signAndSubmit = useCallback(async (account: AccountInfo) => {
    if (!vault || !amount) return;

    setLoading(true);
    setError(null);

    try {
      const adapter = await getAdapter();

      // Ensure we're on the right network
      const network = await adapter.network();
      if (network.chainId !== REQUESTED_NETWORK.chainId) {
        const changeRes = await adapter.changeNetwork(REQUESTED_NETWORK);
        if (changeRes?.status !== UserResponseStatus.APPROVED) {
          setError("Please switch to Movement Testnet");
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
        setError("Unknown action");
        setLoading(false);
        return;
      }

      const signedTx = await adapter.signAndSubmitTransaction({ payload });

      if (signedTx.status !== UserResponseStatus.APPROVED) {
        setError("Transaction rejected");
        setLoading(false);
        return;
      }

      setTxHash(signedTx.args.hash);
      toast.success("Transaction submitted!");
      
      // Close Telegram Web App after success (if running in Telegram)
      if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
        setTimeout(() => {
          (window as any).Telegram.WebApp.close();
        }, 2000);
      }
    } catch (err: any) {
      setError(err?.message || "Transaction failed");
      console.error(err);
    }
    setLoading(false);
  }, [vault, amount, action]);

  const connectAndSign = useCallback(async () => {
    setAutoConnecting(true);
    setError(null);
    
    try {
      const adapter = await getAdapter();
      
      // Try to connect
      const response = await adapter.connect(undefined, REQUESTED_NETWORK);
      if (response.status === UserResponseStatus.APPROVED) {
        setUserAccount(response.args);
        // Auto-submit transaction after connecting
        await signAndSubmit(response.args);
      } else {
        setError("Connection rejected");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to connect wallet");
      console.error(err);
    }
    setAutoConnecting(false);
  }, [signAndSubmit]);

  useEffect(() => {
    // Initialize Telegram Web App if available
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      (window as any).Telegram.WebApp.ready();
      (window as any).Telegram.WebApp.expand();
    }
    
    // Auto-connect on page load
    const init = async () => {
      const adapter = await getAdapter();
      
      // Check if already connected
      if (await adapter.canEagerConnect()) {
        try {
          const response = await adapter.connect();
          if (response.status === UserResponseStatus.APPROVED) {
            setUserAccount(response.args);
            setAutoConnecting(false);
            // Auto-submit if already connected
            await signAndSubmit(response.args);
            return;
          }
        } catch (error) {
          console.log(error);
        }
      }
      
      // If not already connected, prompt connection
      await connectAndSign();
    };
    
    init();
  }, [connectAndSign, signAndSubmit]);

  const actionLabel = action === "deposit" ? "Deposit" : action === "withdraw" ? "Withdraw" : "Transaction";

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
        <div className="bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 max-w-sm w-full border border-gray-700">
          
          {txHash ? (
            <div className="text-center py-4">
              <div className="text-green-400 text-5xl mb-3">✅</div>
              <h2 className="text-lg text-white font-semibold mb-2">Success!</h2>
              <p className="text-gray-400 text-xs mb-4 break-all font-mono">
                {txHash.slice(0, 20)}...{txHash.slice(-10)}
              </p>
              <a
                href={`https://explorer.movementnetwork.xyz/txn/${txHash}?network=testnet`}
                target="_blank"
                rel="noreferrer"
                className="inline-block bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-lg transition"
              >
                View on Explorer →
              </a>
              <p className="text-gray-500 text-xs mt-3">
                Closing in 2 seconds...
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <div className="text-red-400 text-5xl mb-3">❌</div>
              <h2 className="text-lg text-white font-semibold mb-2">Error</h2>
              <p className="text-red-400 text-sm mb-4">{error}</p>
              <button
                onClick={connectAndSign}
                className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-6 py-3 rounded-lg transition"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="animate-spin text-4xl mb-4">⏳</div>
              <h2 className="text-lg text-white font-semibold mb-2">
                {autoConnecting ? "Connecting Wallet..." : loading ? "Signing..." : "Processing..."}
              </h2>
              <p className="text-gray-400 text-sm">
                {actionLabel} {amount} MOVE
              </p>
              <p className="text-gray-500 text-xs mt-4">
                Please approve in your wallet
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function SignPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <SignPageContent />
    </Suspense>
  );
}
