const hre = require("hardhat");
const ethers = hre.ethers;
const clonedeep = require('lodash.clonedeep');

const ConfigLoader = require("./utils/configurator-loader.js");
const MultisigExecutor = require("./utils/multisigexecutor.js");

const TRUSTLIST = 0;

async function main() {

  const configLoader = new ConfigLoader(hre.network.name);
  const config = await configLoader.load();
  const configUpdate = clonedeep(config);

  const DappRegistry = await ethers.getContractFactory("DappRegistry");
  const dappRegistry = await DappRegistry.attach(config.dappRegistry.address);
  const deployer = await ethers.getSigner();

  // Temporarily give ownership of DappRegistry to deployment account if needed
  const originalRegistryOwner = await dappRegistry.registryOwners(TRUSTLIST);
  if (originalRegistryOwner != deployer.address) {
    if (originalRegistryOwner.toLowerCase() != config.argent.multisig.address.toLowerCase()) {
      console.log("Unexpected owner");
      process.exit(0);
    }
    const multisigExecutor = new MultisigExecutor(config.argent.multisig.autosign);
    await multisigExecutor.connect(originalRegistryOwner);
    await multisigExecutor.executeCall(dappRegistry, "changeOwner", [TRUSTLIST, deployer.address]);
  }

  // Add zkSync filter
  const ZkSyncFilter = await ethers.getContractFactory("ZkSyncFilter");
  const zkSyncFilter = await ZkSyncFilter.deploy();
  await zkSyncFilter.deployTransaction.wait();
  
  const tx1 = await dappRegistry.addDapp(TRUSTLIST, config.zkSync.address, zkSyncFilter.address);
  await tx1.wait();

  configUpdate.zkSync.filter = zkSyncFilter.address;
  console.log(`Added zkSync filter ${zkSyncFilter.address} for zkSync contract ${config.zkSync.address}`);

  // Give ownership back
  if (originalRegistryOwner != deployer.address) {
    const tx2 = await dappRegistry.changeOwner(TRUSTLIST, originalRegistryOwner);
    await tx2.wait();
  }

  // update config
  await configLoader.save(configUpdate);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });