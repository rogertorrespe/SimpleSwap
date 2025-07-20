// frontend/src/components/PriceDisplay.js
import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { config } from "../config";
import SimpleSwapABI from "../abis/contracts/SimpleSwap.sol/SimpleSwap.json";

export default function PriceDisplay({ provider }) {
  const [price, setPrice] = useState({ ntaToNtb: 0, ntbToNta: 0 });
  const [error, setError] = useState("");

  const simpleSwapContract = new ethers.Contract(
    config.contracts.simpleSwap,
    SimpleSwapABI.abi,
    provider
  );

  const fetchPrice = useCallback(async () => {
    try {
      const ntaToNtb = await simpleSwapContract.getPrice(
        config.contracts.tokenA,
        config.contracts.tokenB
      );
      const ntbToNta = await simpleSwapContract.getPrice(
        config.contracts.tokenB,
        config.contracts.tokenA
      );
      setPrice({
        ntaToNtb: ethers.formatUnits(ntaToNtb, 18),
        ntbToNta: ethers.formatUnits(ntbToNta, 18),
      });
    } catch (err) {
      //setError("Error al obtener precios: " + err.message);
    }
  }, [simpleSwapContract, config.contracts.tokenA, config.contracts.tokenB]);

  useEffect(() => {
    if (provider) {
      fetchPrice();
      const interval = setInterval(fetchPrice, 30000); // Actualizar cada 30 segundos
      return () => clearInterval(interval);
    }
  }, [provider, fetchPrice]);

  return (
    <div className="p-6 bg-gray-100 rounded-lg shadow-md">
      <h2 className="text-2xl mb-4">Precios en Tiempo Real</h2>
      <p>1 NTA = {price.ntaToNtb} NTB</p>
      <p>1 NTB = {price.ntbToNta} NTA</p>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}