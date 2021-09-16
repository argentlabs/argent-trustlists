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
  const deployer = (await ethers.getSigners())[0];

  // Temporarily give ownership of DappRegistry to deployment account if needed
  const registryOwner = await dappRegistry.registryOwners(TRUSTLIST);
  if (registryOwner != deployer.address) {
    const multisigExecutor = new MultisigExecutor();
    await multisigExecutor.connect(registryOwner);
    await multisigExecutor.executeCall(dappRegistry, "changeOwner", [TRUSTLIST, deployer.address]);
  }

  // Add Argent refund EOAs
  if (config.argent.refundCollector) {
    await dappRegistry.addDapp(TRUSTLIST, config.argent.refundCollector, ethers.constants.AddressZero);
    console.log(`Added empty filter for Argent refund collector ${config.argent.refundCollector}`);
  }
  if (config.argent.tradeCommissionCollector) {
    await dappRegistry.addDapp(TRUSTLIST, config.argent.tradeCommissionCollector, ethers.constants.AddressZero);
    console.log(`Added empty filter for Argent trade commission collector ${config.argent.tradeCommissionCollector}`);
  }
  
  // Add Argent ENS Manager filter
  const ZkSyncFilter = await ethers.getContractFactory("ArgentEnsManagerFilter");
  const zkSyncFilter = await ZkSyncFilter.deploy();
  await dappRegistry.addDapp(TRUSTLIST, config.argent.ens.manager, zkSyncFilter.address);
  configUpdate.zkSync.filter = zkSyncFilter.address;
  console.log(`Added zkSync filter ${zkSyncFilter.address} for zkSync contract ${config.zkSync.address}`);

  // Give ownership back
  if (registryOwner != deployer.address) {
    await dappRegistry.changeOwner(TRUSTLIST, registryOwner);
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