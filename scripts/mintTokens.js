// /var/www/SimpleSwap/scripts/mintTokens.js
import { ethers } from "hardhat";

async function main() {
  const [signer] = await ethers.getSigners();
  const tokenA = await ethers.getContractAt("TestToken", "0x41eDC1589e1F83fbb5E91260975f47EE38F2d7dD", signer);
  const tokenB = await ethers.getContractAt("TestToken", "0x873f9FebC0B9960F2a808a88491233f20128481e", signer);
  await tokenA.mint(signer.address, ethers.parseUnits("10000", 18));
  await tokenB.mint(signer.address, ethers.parseUnits("10000", 18));
  console.log("Tokens minted!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});