// /var/www/SimpleSwap/scripts/listNetworks.js
const hre = require("hardhat");
async function main() {
  console.log("Available networks in Hardhat configuration:");
  console.log(hre.config.networks);
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });