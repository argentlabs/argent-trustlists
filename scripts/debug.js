const hre = require("hardhat");
const ethers = hre.ethers;

async function main() {
  console.log("MAIN");
  const [signer] = await ethers.getSigners();
  console.log(`signer is ${signer.address}`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });