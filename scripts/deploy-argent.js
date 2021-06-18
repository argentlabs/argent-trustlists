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

  /////////////////////////////////
  // DappRegistry
  /////////////////////////////////

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

  // Transfer ownership to Argent multisig
  await dappRegistry.changeOwner(TRUSTLIST, config.argent.multisig);
  console.log(`Transfered ownership of trustlist 0 to Argent multisig ${config.argent.multisig}`);

  /////////////////////////////////
  // TokenRegistry
  /////////////////////////////////

  const TokenRegistry = await ethers.getContractFactory("TokenRegistry");
  const tokenRegistry = await TokenRegistry.attach(config.tokenRegistry.address);

  // Add Argent backend EOAs as managers to the TokenRegistry
  for (const idx in config.argent.managers) {
    const manager = config.argent.managers[idx];
    console.log(`Adding ${manager} as a manager of the token registry`);
    await tokenRegistry.addManager(manager);
  }

  // Transfer ownership to Argent multisig
  await tokenRegistry.changeOwner(config.argent.multisig);
  console.log(`Transfered ownership of toekn registry to Argent multisig ${config.argent.multisig}`);

  /////////////////////////////////
  // Update the config
  /////////////////////////////////

  // update config
  await configLoader.save(configUpdate);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });