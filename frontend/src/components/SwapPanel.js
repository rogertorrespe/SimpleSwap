import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { config } from "../config";
import SimpleSwapABI from "../abis/contracts/SimpleSwap.sol/SimpleSwap.json";
import TestTokenABI from "../abis/contracts/TestToken.sol/TestToken.json";

export default function SwapPanel({ signer, account }) {
  const [amountIn, setAmountIn] = useState("");
  const [amountOut, setAmountOut] = useState("");
  const [tokenIn, setTokenIn] = useState(config.contracts.tokenA);
  const [tokenOut, setTokenOut] = useState(config.contracts.tokenB);
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

  const calculateAmountOut = useCallback(async () => {
    if (!amountIn || !signer) return;
    try {
      const reserveA = await simpleSwapContract.reserveA();
      const reserveB = await simpleSwapContract.reserveB();
      const reserveIn = tokenIn === config.contracts.tokenA ? reserveA : reserveB;
      const reserveOut = tokenIn === config.contracts.tokenA ? reserveB : reserveA;
      const amountInWei = ethers.parseUnits(amountIn, 18);
      const amountOutWei = await simpleSwapContract.getAmountOut(amountInWei, reserveIn, reserveOut);
      setAmountOut(ethers.formatUnits(amountOutWei, 18));
    } catch (err) {
      setError("Error al calcular el monto de salida: " + err.message);
    }
  }, [amountIn, tokenIn, signer, simpleSwapContract, config.contracts.tokenA, config.contracts.tokenB]);

  const approveToken = async () => {
    setError("");
    setSuccess("");
    try {
      const tokenContract = tokenIn === config.contracts.tokenA ? tokenAContract : tokenBContract;
      const amountInWei = ethers.parseUnits(amountIn, 18);
      const tx = await tokenContract.approve(config.contracts.simpleSwap, amountInWei);
      setLoading(true);
      await tx.wait();
      setLoading(false);
      setSuccess("Aprobación exitosa.");
      return true;
    } catch (err) {
      setLoading(false);
      setError("Error al aprobar tokens: " + err.message);
      return false;
    }
  };

  const handleSwap = async () => {
    setError("");
    setSuccess("");
    try {
      const approved = await approveToken();
      if (!approved) return;

      const amountInWei = ethers.parseUnits(amountIn, 18);
      const amountOutMin = ethers.parseUnits(amountOut, 18).mul(95).div(100);
      const path = [tokenIn, tokenOut];
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

      setLoading(true);
      const tx = await simpleSwapContract.swapExactTokensForTokens(
        amountInWei,
        amountOutMin,
        path,
        account,
        deadline
      );
      await tx.wait();
      setLoading(false);
      setSuccess("Swap realizado con éxito!");
    } catch (err) {
      setLoading(false);
      setError("Error al realizar el swap: " + err.message);
    }
  };

  useEffect(() => {
    calculateAmountOut();
  }, [amountIn, tokenIn, tokenOut, calculateAmountOut]);

  const switchTokens = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountIn("");
    setAmountOut("");
  };

  return (
    <div className="p-6 bg-gray-100 rounded-lg shadow-md">
      <h2 className="text-2xl mb-4">Intercambiar Tokens</h2>
      <div className="mb-4">
        <label>Token de Entrada:</label>
        <select
          value={tokenIn}
          onChange={(e) => setTokenIn(e.target.value)}
          className="border p-2 rounded"
        >
          <option value={config.contracts.tokenA}>NTA</option>
          <option value={config.contracts.tokenB}>NTB</option>
        </select>
        <input
          type="number"
          value={amountIn}
          onChange={(e) => setAmountIn(e.target.value)}
          placeholder="Cantidad"
          className="border p-2 rounded w-full mt-2"
        />
      </div>
      <button onClick={switchTokens} className="bg-gray-300 p-2 rounded mb-4">
        ⇅ Cambiar
      </button>
      <div className="mb-4">
        <label>Token de Salida:</label>
        <select
          value={tokenOut}
          onChange={(e) => setTokenOut(e.target.value)}
          className="border p-2 rounded"
        >
          <option value={config.contracts.tokenA}>NTA</option>
          <option value={config.contracts.tokenB}>NTB</option>
        </select>
        <input
          type="number"
          value={amountOut}
          readOnly
          placeholder="Cantidad estimada"
          className="border p-2 rounded w-full mt-2"
        />
      </div>
      <button
        onClick={handleSwap}
        disabled={loading || !amountIn}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
      >
        {loading ? "Procesando..." : "Intercambiar"}
      </button>
      {success && <p className="text-green-500 mt-2">{success}</p>}
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}