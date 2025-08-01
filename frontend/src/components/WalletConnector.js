import { useState } from "react";
import { ethers } from "ethers";

export default function WalletConnector({ setProvider, setSigner, setAccount }) {
  const [account, setLocalAccount] = useState(null);
  const [error, setError] = useState("");

  const connectWallet = async () => {
    setError("");
    try {
      if (!window.ethereum) {
        setError("Por favor, instala MetaMask.");
        return;
      }
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await web3Provider.send("eth_requestAccounts", []);
      const signer = await web3Provider.getSigner();
      setProvider(web3Provider);
      setSigner(signer);
      setAccount(accounts[0]);
      setLocalAccount(accounts[0]);
    } catch (err) {
      setError("Error al conectar la billetera: " + err.message);
    }
  };

  return (
    <div className="p-4">
      <button
        onClick={connectWallet}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {account ? `Conectado: ${account.slice(0, 6)}...${account.slice(-4)}` : "Conectar Billetera"}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}