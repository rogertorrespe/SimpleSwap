import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import PriceDisplay from "./components/PriceDisplay";
import SwapPanel from "./components/SwapPanel";
import WalletConnector from "./components/WalletConnector";
import "./App.css";

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);

  useEffect(() => {
    const connectProvider = async () => {
      if (window.ethereum) {
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(web3Provider);
        try {
          const accounts = await web3Provider.send("eth_accounts", []);
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setSigner(await web3Provider.getSigner());
          }
        } catch (error) {
          console.error("Error connecting to wallet:", error);
        }
      }
    };
    connectProvider();
  }, []);

  return (
    <div className="App">
      <h1>SimpleSwap</h1>
      <WalletConnector setProvider={setProvider} setSigner={setSigner} setAccount={setAccount} />
      <PriceDisplay provider={provider} />
      <SwapPanel provider={provider} signer={signer} account={account} />
    </div>
  );
}

export default App;