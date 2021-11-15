const hre = require("hardhat");
const ethers = hre.ethers;
const clonedeep = require("lodash.clonedeep");

const ConfigLoader = require("./utils/configurator-loader.js");
const MultisigExecutor = require("./utils/multisigexecutor.js");

const TRUSTLIST = 0;

async function main() {
  const configLoader = new ConfigLoader(hre.network.name);
  const config = await configLoader.load();
  const configUpdate = clonedeep(config);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer is ${deployer.address} with balance ETH ${ethers.utils.formatEther(await ethers.provider.getBalance(deployer.address))}`);

  const dappRegistry = await ethers.getContractAt("DappRegistry", config.dappRegistry.address);
  const yearnV2Filter = await ethers.getContractAt("YearnV2Filter", config.yearn.v2.filter);
  const registryOwner = await dappRegistry.registryOwners(TRUSTLIST);
  console.log(`dapp registry is ${dappRegistry.address}`);
  console.log(`yearn v2 filter is ${yearnV2Filter.address}`);
  console.log(`registry owner is ${registryOwner}`);

  if (config.argent.multisig.address.toLowerCase() !== registryOwner.toLowerCase()) {
    console.error("Registry owner should be multisig");
    return;
  }

  const multisigExecutor = new MultisigExecutor(config.argent.multisig.autosign);
  await multisigExecutor.connect(config.argent.multisig.address);
  console.log("multisig executor connected");

  const yvYFI = "0xdb25cA703181E7484a155DD612b06f57E12Be5F0";
  const yvUSDC = "0xa354F35829Ae975e850e23e9615b11Da1B3dC4DE";

  let vault, transaction;

  vault = yvYFI;
  console.log("adding yvYFI vault");
  transaction = await multisigExecutor.executeCall(dappRegistry, "addDapp", [TRUSTLIST, vault, yearnV2Filter.address]);
  console.log(`hash ${transaction.hash}`);
  console.log(`Added new YearnV2 vault ${vault} for filter ${yearnV2Filter.address}`);
  configUpdate.yearn.v2.vaults.push(vault);

  vault = yvUSDC;
  console.log("adding yvUSDC vault");
  transaction = await multisigExecutor.executeCall(dappRegistry, "addDapp", [TRUSTLIST, vault, yearnV2Filter.address]);
  console.log(`hash ${transaction.hash}`);
  console.log(`Added new YearnV2 vault ${vault} for filter ${yearnV2Filter.address}`);
  configUpdate.yearn.v2.vaults.push(vault);

  await configLoader.save(configUpdate);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
