"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { getNightlyWallet, isNightlyInstalled } from "../misc/adapter";

const StickyHeader: React.FC = () => {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const connectWallet = async () => {
    if (!isNightlyInstalled()) {
      toast.error("Please install Nightly wallet");
      window.open("https://nightly.app", "_blank");
      return;
    }

    setConnecting(true);
    try {
      const wallet = getNightlyWallet();
      if (!wallet) throw new Error("Wallet not found");
      
      const account = await wallet.connect();
      setAddress(account.address);
      toast.success("Wallet connected!");
    } catch (error: any) {
      toast.error(error?.message || "Connection failed");
    }
    setConnecting(false);
  };

  const disconnectWallet = async () => {
    try {
      const wallet = getNightlyWallet();
      if (wallet) await wallet.disconnect();
      setAddress(null);
      toast.info("Wallet disconnected");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full bg-black/50 backdrop-blur p-4 z-10">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <h1 className="text-white font-bold text-xl">🚀 MoveYield</h1>
        
        <div className="flex items-center gap-4">
          {address ? (
            <>
              <span className="text-white/70 text-sm font-mono">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
              <button
                onClick={disconnectWallet}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={connectWallet}
              disabled={connecting}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm transition"
            >
              {connecting ? "Connecting..." : "Connect Wallet"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default StickyHeader;
