const hre = require("hardhat");
const ethers = hre.ethers;
const clonedeep = require('lodash.clonedeep');
const ConfigLoader = require("./utils/configurator-loader.js");

async function main() {

  console.log('\n', `/////////////     Running [deploy-registries.js] on [${hre.network.name}]     ///////////////`, '\n');

  const configLoader = new ConfigLoader(hre.network.name);
  const config = await configLoader.load();
  const configUpdate = clonedeep(config);
  const deployer = (await ethers.getSigners())[0];

  /////////////////////////////////
  // DappRegistry
  /////////////////////////////////

  // Deploy DappRegistry
  const DappRegistry = await ethers.getContractFactory("DappRegistry");
  const dappRegistry = await DappRegistry.deploy(config.dappRegistry.timelock);
  console.log("Deployed DappRegistry at ", dappRegistry.address);

  // Add Argent refund EOAs
  if (config.argent.refundCollector) {
    await dappRegistry.addDapp(0, config.argent.refundCollector, ethers.constants.AddressZero);
  }
  if (config.argent.tradeCommissionCollector) {
    await dappRegistry.addDapp(0, config.argent.tradeCommissionCollector, ethers.constants.AddressZero);
  }

  // Transfer ownership to the Argent multisig
  if (config.dappRegistry.owner) {
    console.log("Setting the owner of the default registry");
    await dappRegistry.changeOwner(0, config.dappRegistry.owner);
  } else {
    configUpdate.dappRegistry.owner = deployer.address;
  }

  configUpdate.dappRegistry.address = dappRegistry.address;

  /////////////////////////////////
  // TokenRegistry
  /////////////////////////////////

  // Deploy new TokenRegistry
  const TokenRegistry = await ethers.getContractFactory("TokenRegistry");
  const tokenRegistry = await TokenRegistry.deploy();
  console.log("Deployed TokenRegistry at ", tokenRegistry.address);

  // Adding managers to the TokenRegistry
  if (config.tokenRegistry.managers) {
    for (const idx in config.argent.managers) {
      const manager = config.argent.managers[idx];
      console.log(`Setting ${manager} as a manager of the token registry`);
      await tokenRegistry.addManager(manager);
    }
  }
  
  //Transfer ownership to the Argent multisig
  if (config.tokenRegistry.owner) {
    console.log("Setting the owner of the token registry");
    await tokenRegistry.changeOwner(config.tokenRegistry.owner);
  }

  configUpdate.tokenRegistry.address = tokenRegistry.address;

  /////////////////////////////////
  // Update the config
  /////////////////////////////////

  await configLoader.save(configUpdate);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });