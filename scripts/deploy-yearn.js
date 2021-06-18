const hre = require("hardhat");
const ethers = hre.ethers;
const clonedeep = require('lodash.clonedeep');

const ConfigLoader = require("./utils/configurator-loader.js");
const MultisigExecutor = require("./utils/multisigexecutor.js");

const TRUSTLIST = 0;

async function main() {

  // No Yearn v1 integration on Ropsten
  if (hre.network.name === "ropsten") {
    console.log("skipping Yearn v1 on Ropsten");
    return;
  }

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

  /////////////////////////////////
  // Yearn V1
  /////////////////////////////////

  // yEarn
  const YearnFilter = await ethers.getContractFactory("YearnFilter");
  const yearnFilter = await YearnFilter.deploy(false);
  configUpdate.yearn.v1.filter = yearnFilter.address;
  const wethYearnFilter = await YearnFilter.deploy(true);
  configUpdate.yearn.v1.wethFilter = wethYearnFilter.address;
  for (const vault of (config.yearn.v1.vaults)) {
    await dappRegistry.addDapp(TRUSTLIST, vault, yearnFilter.address);
    console.log(`Added Yearn filter ${yearnFilter.address} for yVault ${vault}`);
  }
  for (const vault of (config.yearn.v1.wethVaults)) {
    await dappRegistry.addDapp(TRUSTLIST, vault, wethYearnFilter.address);
    console.log(`Added Yearn filter ${wethYearnFilter.address} for wethVault ${vault}`);
  }

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