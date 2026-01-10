"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

// Movement Testnet config
const MOVEMENT_TESTNET = {
  name: "Movement Testnet",
  chainId: 177,
  url: "https://testnet.movementnetwork.xyz/v1",
};

function SignPageContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"ready" | "connecting" | "signing" | "success" | "error">("ready");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const action = searchParams.get("action");
  const amount = searchParams.get("amount");
  const vault = searchParams.get("vault");

  // Initialize Telegram WebApp
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
      (window as any).Telegram.WebApp.ready();
      (window as any).Telegram.WebApp.expand();
    }
  }, []);

  const connectAndSign = async () => {
    if (!vault || !amount || !action) {
      setError("Missing parameters");
      setStatus("error");
      return;
    }

    try {
      // Check for Nightly wallet
      const nightly = (window as any).nightly?.aptos;
      if (!nightly) {
        setError("Nightly wallet not found. Please install Nightly wallet extension.");
        setStatus("error");
        return;
      }

      // Connect wallet
      setStatus("connecting");
      const account = await nightly.connect();
      setWalletAddress(account.address);

      // Try to switch to Movement Testnet
      try {
        const currentNetwork = await nightly.network();
        if (currentNetwork?.chainId !== MOVEMENT_TESTNET.chainId) {
          await nightly.changeNetwork(MOVEMENT_TESTNET);
        }
      } catch (networkErr) {
        console.log("Network switch not supported or failed, continuing...", networkErr);
      }

      // Build transaction payload - use correct format for Nightly
      setStatus("signing");
      
      const payload = {
        function: `${vault}::vault::${action}`,
        typeArguments: ["0x1::aptos_coin::AptosCoin"],
        functionArguments: [amount],
      };

      // Sign and submit transaction
      const pendingTx = await nightly.signAndSubmitTransaction({
        payload,
      });

      setTxHash(pendingTx.hash);
      setStatus("success");

      // Close Telegram WebApp after success
      if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
        setTimeout(() => {
          (window as any).Telegram.WebApp.close();
        }, 3000);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Transaction failed");
      setStatus("error");
    }
  };

  const actionLabel = action === "deposit" ? "Deposit" : action === "withdraw" ? "Withdraw" : "Transaction";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
      <div className="bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 max-w-sm w-full border border-gray-700 shadow-xl">
        
        {status === "success" && txHash ? (
          <div className="text-center py-4">
            <div className="text-green-400 text-5xl mb-4">✅</div>
            <h2 className="text-xl text-white font-bold mb-2">Success!</h2>
            <p className="text-gray-400 text-xs mb-4 break-all font-mono bg-gray-900 p-2 rounded">
              {txHash.slice(0, 20)}...{txHash.slice(-10)}
            </p>
            <a
              href={`https://explorer.movementnetwork.xyz/txn/${txHash}?network=testnet`}
              target="_blank"
              rel="noreferrer"
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white text-sm px-5 py-2.5 rounded-lg transition font-medium"
            >
              View on Explorer →
            </a>
            <p className="text-gray-500 text-xs mt-4">
              Closing automatically...
            </p>
          </div>
        ) : status === "error" ? (
          <div className="text-center py-4">
            <div className="text-red-400 text-5xl mb-4">❌</div>
            <h2 className="text-xl text-white font-bold mb-2">Error</h2>
            <p className="text-red-400 text-sm mb-4 bg-red-900/20 p-3 rounded">{error}</p>
            <button
              onClick={() => { setStatus("ready"); setError(null); }}
              className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-6 py-3 rounded-lg transition font-medium"
            >
              Try Again
            </button>
          </div>
        ) : status === "connecting" || status === "signing" ? (
          <div className="text-center py-8">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <h2 className="text-lg text-white font-semibold mb-2">
              {status === "connecting" ? "Connecting Wallet..." : "Signing Transaction..."}
            </h2>
            <p className="text-gray-400 text-sm">
              {actionLabel} {amount} MOVE
            </p>
            <p className="text-gray-500 text-xs mt-4">
              Please approve in your Nightly wallet
            </p>
          </div>
        ) : (
          <div className="text-center py-4">
            <h1 className="text-2xl font-bold text-white mb-6">🚀 MoveYield</h1>
            
            <div className="bg-gray-900/50 rounded-xl p-4 mb-6 text-left">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400 text-sm">Action</span>
                <span className="text-white font-medium capitalize">{action}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400 text-sm">Amount</span>
                <span className="text-white font-mono">{amount} MOVE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Network</span>
                <span className="text-white">Movement Testnet</span>
              </div>
            </div>

            <button
              onClick={connectAndSign}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 px-6 rounded-xl transition text-lg shadow-lg"
            >
              🔗 Connect & Sign
            </button>

            <p className="text-gray-500 text-xs mt-4">
              Non-custodial • Your keys, your crypto
            </p>
          </div>
        )}
      </div>
    </div>
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
