// frontend/src/config.js
export const config = {
  network: {
    name: "sepolia",
    chainId: 11155111,
    rpcUrl: "https://rpc.sepolia.org", // O usa tu propio nodo (Infura/Alchemy)
  },
  contracts: {
    simpleSwap: "0x651bA2cF45eC284b6cFFB88b60D50d87573e6151",
    tokenA: "0x41eDC1589e1F83fbb5E91260975f47EE38F2d7dD",
    tokenB: "0x873f9FebC0B9960F2a808a88491233f20128481e",
  },
};