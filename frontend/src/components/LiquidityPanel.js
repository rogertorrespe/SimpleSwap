import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { config } from "../config";
import SimpleSwapABI from "../abis/contracts/SimpleSwap.sol/SimpleSwap.json";
import TestTokenABI from "../abis/contracts/TestToken.sol/TestToken.json";

export default function LiquidityPanel({ signer, account }) {
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
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
      const txA = await tokenAContract.approve(config.contracts.simpleSwap, amountAWei);
      const txB = await tokenBContract.approve(config.contracts.simpleSwap, amountBWei);
      setLoading(true);
      await Promise.all([txA.wait(), txB.wait()]);
      setLoading(false);
      setSuccess("Aprobación exitosa.");
      return true;
    } catch (err) {
      setLoading(false);
      setError("Error al aprobar tokens: " + err.message);
      return false;
    }
  };

  const addLiquidity = async () => {
    setError("");
    setSuccess("");
    try {
      const approved = await approveTokens();
      if (!approved) return;

      const amountAWei = ethers.parseUnits(amountA, 18);
      const amountBWei = ethers.parseUnits(amountB, 18);
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

      setLoading(true);
      const tx = await simpleSwapContract.addLiquidity(
        config.contracts.tokenA,
        config.contracts.tokenB,
        amountAWei,
        amountBWei,
        0,
        0,
        account,
        deadline
      );
      await tx.wait();
      setLoading(false);
      setSuccess("Liquidez añadida con éxito!");
    } catch (err) {
      setLoading(false);
      setError("Error al añadir liquidez: " + err.message);
    }
  };

  return (
    <div className="p-6 bg-gray-100 rounded-lg shadow-md">
      <h2 className="text-2xl mb-4">Añadir Liquidez</h2>
      <div className="mb-4">
        <label>Token A (NTA):</label>
        <input
          type="number"
          value={amountA}
          onChange={(e) => setAmountA(e.target.value)}
          placeholder="Cantidad"
          className="border p-2 rounded w-full mt-2"
        />
      </div>
      <div className="mb-4">
        <label>Token B (NTB):</label>
        <input
          type="number"
          value={amountB}
          onChange={(e) => setAmountB(e.target.value)}
          placeholder="Cantidad"
          className="border p-2 rounded w-full mt-2"
        />
      </div>
      <button
        onClick={addLiquidity}
        disabled={loading || !amountA || !amountB}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
      >
        {loading ? "Procesando..." : "Añadir Liquidez"}
      </button>
      {success && <p className="text-green-500 mt-2">{success}</p>}
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}