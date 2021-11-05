const hre = require("hardhat");
const ethers = hre.ethers;

async function main() {
  const [signer] = await ethers.getSigners();
  console.log(`signer is ${signer.address}`);
  console.log(`ALCHEMY_KEY is ${(process.env.ALCHEMY_KEY || "").split("")}`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });