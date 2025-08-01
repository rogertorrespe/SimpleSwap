const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Desplegando contratos con:", deployer.address);

  const Token = await ethers.getContractFactory("TestToken");
  const tokenA = await Token.deploy("Token A", "TKA");
  const tokenB = await Token.deploy("Token B", "TKB");
  await tokenA.waitForDeployment();
  await tokenB.waitForDeployment();

  const SimpleSwap = await ethers.getContractFactory("SimpleSwap");
  const simpleSwap = await SimpleSwap.deploy(tokenA.target, tokenB.target);
  await simpleSwap.waitForDeployment();

  console.log("Token A desplegado en:", tokenA.target);
  console.log("Token B desplegado en:", tokenB.target);
  console.log("SimpleSwap desplegado en:", simpleSwap.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});