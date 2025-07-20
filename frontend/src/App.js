// frontend/src/App.js
import { useState } from "react";
import WalletConnector from "./components/WalletConnector";
import SwapPanel from "./components/SwapPanel";
import LiquidityPanel from "./components/LiquidityPanel";
import PriceDisplay from "./components/PriceDisplay";
import "./App.css";

export default function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">SimpleSwap DApp</h1>
      <WalletConnector setProvider={setProvider} setSigner={setSigner} setAccount={setAccount} />
      {provider && signer && account && (
        <>
          <PriceDisplay provider={provider} />
          <SwapPanel provider={provider} signer={signer} account={account} />
          <LiquidityPanel provider={provider} signer={signer} account={account} />
        </>
      )}
    </div>
  );
}