"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

function SignPageContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"ready" | "connecting" | "signing" | "success" | "error">("ready");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const action = searchParams.get("action");
  const amount = searchParams.get("amount");
  const vault = searchParams.get("vault");

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
      const nightly = (window as any).nightly?.aptos;
      if (!nightly) {
        setError("Nightly wallet not found");
        setStatus("error");
        return;
      }

      setStatus("connecting");
      await nightly.connect();

      // NO network switch - user must be on Movement Testnet already

      setStatus("signing");
      
      const response = await nightly.signAndSubmitTransaction({
        payload: {
          function: `${vault}::vault::${action}`,
          typeArguments: ["0x1::aptos_coin::AptosCoin"],
          functionArguments: [amount],
        }
      });

      if (response?.status === "Rejected") {
        throw new Error("Transaction rejected");
      }
      
      const hash = response?.args?.hash || response?.hash || response;
      if (!hash || typeof hash === "object") {
        throw new Error("Failed: " + JSON.stringify(response));
      }

      setTxHash(String(hash));
      setStatus("success");

      if ((window as any).Telegram?.WebApp) {
        setTimeout(() => (window as any).Telegram.WebApp.close(), 3000);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Transaction failed");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
      <div className="bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 max-w-sm w-full border border-gray-700 shadow-xl">
        {status === "success" && txHash ? (
          <div className="text-center py-4">
            <div className="text-green-400 text-5xl mb-4">✅</div>
            <h2 className="text-xl text-white font-bold mb-2">Success!</h2>
            <p className="text-gray-400 text-xs mb-4 break-all font-mono bg-gray-900 p-2 rounded">{txHash.slice(0,20)}...{txHash.slice(-10)}</p>
            <a href={`https://explorer.movementnetwork.xyz/txn/${txHash}?network=bardock+testnet`} target="_blank" className="inline-block bg-purple-600 text-white text-sm px-5 py-2.5 rounded-lg">View on Explorer →</a>
          </div>
        ) : status === "error" ? (
          <div className="text-center py-4">
            <div className="text-red-400 text-5xl mb-4">❌</div>
            <h2 className="text-xl text-white font-bold mb-2">Error</h2>
            <p className="text-red-400 text-sm mb-4 bg-red-900/20 p-3 rounded break-all">{error}</p>
            <button onClick={() => { setStatus("ready"); setError(null); }} className="bg-gray-700 text-white text-sm px-6 py-3 rounded-lg">Try Again</button>
          </div>
        ) : status !== "ready" ? (
          <div className="text-center py-8">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <h2 className="text-lg text-white font-semibold">{status === "connecting" ? "Connecting..." : "Signing..."}</h2>
          </div>
        ) : (
          <div className="text-center py-4">
            <h1 className="text-2xl font-bold text-white mb-6">🚀 MoveYield</h1>
            <div className="bg-gray-900/50 rounded-xl p-4 mb-6 text-left">
              <div className="flex justify-between mb-2"><span className="text-gray-400 text-sm">Action</span><span className="text-white capitalize">{action}</span></div>
              <div className="flex justify-between mb-2"><span className="text-gray-400 text-sm">Amount</span><span className="text-white font-mono">{amount} MOVE</span></div>
              <div className="flex justify-between"><span className="text-gray-400 text-sm">Network</span><span className="text-purple-400">Movement Testnet</span></div>
            </div>
            <button onClick={connectAndSign} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 rounded-xl text-lg">🔗 Connect & Sign</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SignPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
      <SignPageContent />
    </Suspense>
  );
}
