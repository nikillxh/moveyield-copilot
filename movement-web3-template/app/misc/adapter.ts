// Simple Nightly wallet adapter using window.nightly
export interface NightlyWallet {
  connect: () => Promise<{ address: string; publicKey: string }>;
  disconnect: () => Promise<void>;
  isConnected: () => Promise<boolean>;
  account: () => Promise<{ address: string; publicKey: string } | null>;
  network: () => Promise<{ name: string; chainId: number }>;
  signAndSubmitTransaction: (payload: any) => Promise<{ hash: string }>;
  signTransaction: (payload: any) => Promise<any>;
  signMessage: (message: any) => Promise<any>;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback: (data: any) => void) => void;
}

export const getNightlyWallet = (): NightlyWallet | null => {
  if (typeof window === "undefined") return null;
  return (window as any).nightly?.aptos || null;
};

export const isNightlyInstalled = (): boolean => {
  return getNightlyWallet() !== null;
};
