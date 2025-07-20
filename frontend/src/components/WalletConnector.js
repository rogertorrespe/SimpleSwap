// frontend/src/components/WalletConnector.js
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { config } from "../config";

export default function WalletConnector({ setProvider, setSigner, setAccount }) {
  const [connected, setConnected] = useState(false);
  const [account, setLocalAccount] = useState(""); // Local state for account
  const [error, setError] = useState("");

  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const accountAddress = await signer.getAddress();
        const network = await provider.getNetwork();

        if (Number(network.chainId) !== config.network.chainId) {
          try {
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: `0x${config.network.chainId.toString(16)}` }],
            });
          } catch (switchError) {
            setError("Por favor, cambia a la red Sepolia en MetaMask.");
            return;
          }
        }

        setProvider(provider);
        setSigner(signer);
        setAccount(accountAddress); // Update parent state
        setLocalAccount(accountAddress); // Update local state
        setConnected(true);
        setError("");
      } else {
        setError("Por favor, instala MetaMask.");
      }
    } catch (err) {
      setError("Error al conectar la billetera: " + err.message);
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", () => window.location.reload());
      window.ethereum.on("chainChanged", () => window.location.reload());
    }
  }, []);

  return (
    <div className="p-4">
      {connected ? (
        <p className="text-green-500">Conectado: {account}</p>
      ) : (
        <button
          onClick={connectWallet}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Conectar MetaMask
        </button>
      )}
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}