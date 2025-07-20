// frontend/src/components/LiquidityPanel.js
import { useState } from "react";
import { ethers } from "ethers";
import { config } from "../config";
import SimpleSwapABI from "../abis/contracts/SimpleSwap.sol/SimpleSwap.json";
import TestTokenABI from "../abis/contracts/TestToken.sol/TestToken.json";

export default function LiquidityPanel({ provider, signer, account }) {
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [liquidity, setLiquidity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const simpleSwapContract = new ethers.Contract(
    config.contracts.simpleSwap,
    SimpleSwapABI.abi,
    signer
  );
  const tokenAContract = new ethers.Contract(
    config.contracts.tokenA,
    TestTokenABI.abi,
    signer
  );
  const tokenBContract = new ethers.Contract(
    config.contracts.tokenB,
    TestTokenABI.abi,
    signer
  );

  const approveTokens = async () => {
    setError("");
    setSuccess("");
    try {
      const amountAWei = ethers.parseUnits(amountA, 18);
      const amountBWei = ethers.parseUnits(amountB, 18);

      setLoading(true);
      const txA = await tokenAContract.approve(config.contracts.simpleSwap, amountAWei);
      await txA.wait();
      const txB = await tokenBContract.approve(config.contracts.simpleSwap, amountBWei);
      await txB.wait();
      setLoading(false);
      setSuccess("Aprobación de tokens exitosa.");
      return true;
    } catch (err) {
      setLoading(false);
      setError("Error al aprobar tokens: " + err.message);
      return false;
    }
  };

  const handleAddLiquidity = async () => {
    setError("");
    setSuccess("");
    try {
      const approved = await approveTokens();
      if (!approved) return;

      const amountAWei = ethers.parseUnits(amountA, 18);
      const amountBWei = ethers.parseUnits(amountB, 18);
      const amountAMin = amountAWei.mul(95).div(100); // 5% slippage
      const amountBMin = amountBWei.mul(95).div(100); // 5% slippage
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

      setLoading(true);
      const tx = await simpleSwapContract.addLiquidity(
        config.contracts.tokenA,
        config.contracts.tokenB,
        amountAWei,
        amountBWei,
        amountAMin,
        amountBMin,
        account,
        deadline
      );
      await tx.wait();
      setLoading(false);
      setSuccess("Liquidez añadida con éxito!");
    } catch (err) {
      setLoading(false);
      //setError("Error al añadir liquidez: " + err.message);
    }
  };

  const handleRemoveLiquidity = async () => {
    setError("");
    setSuccess("");
    try {
      const liquidityWei = ethers.parseUnits(liquidity, 18);
      const amountAMin = 0; // Mínimo aceptable
      const amountBMin = 0; // Mínimo aceptable
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

      setLoading(true);
      const tx = await simpleSwapContract.removeLiquidity(
        config.contracts.tokenA,
        config.contracts.tokenB,
        liquidityWei,
        amountAMin,
        amountBMin,
        account,
        deadline
      );
      await tx.wait();
      setLoading(false);
      setSuccess("Liquidez retirada con éxito!");
    } catch (err) {
      setLoading(false);
      setError("Error al retirar liquidez: " + err.message);
    }
  };

  return (
    <div className="p-6 bg-gray-100 rounded-lg shadow-md">
      <h2 className="text-2xl mb-4">Gestionar Liquidez</h2>
      <div className="mb-4">
        <h3>Añadir Liquidez</h3>
        <input
          type="number"
          value={amountA}
          onChange={(e) => setAmountA(e.target.value)}
          placeholder="Cantidad de NTA"
          className="border p-2 rounded w-full mt-2"
        />
        <input
          type="number"
          value={amountB}
          onChange={(e) => setAmountB(e.target.value)}
          placeholder="Cantidad de NTB"
          className="border p-2 rounded w-full mt-2"
        />
        <button
          onClick={handleAddLiquidity}
          disabled={loading || !amountA || !amountB}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400 mt-2"
        >
          {loading ? "Procesando..." : "Añadir Liquidez"}
        </button>
      </div>
      <div className="mb-4">
        <h3>Retirar Liquidez</h3>
        <input
          type="number"
          value={liquidity}
          onChange={(e) => setLiquidity(e.target.value)}
          placeholder="Cantidad de liquidez"
          className="border p-2 rounded w-full mt-2"
        />
        <button
          onClick={handleRemoveLiquidity}
          disabled={loading || !liquidity}
          className="bg-red-500 text-white px-4 py-2 rounded disabled:bg-gray-400 mt-2"
        >
          {loading ? "Procesando..." : "Retirar Liquidez"}
        </button>
      </div>
      {success && <p className="text-green-500 mt-2">{success}</p>}
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}