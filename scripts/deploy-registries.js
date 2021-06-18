const hre = require("hardhat");
const ethers = hre.ethers;
const clonedeep = require('lodash.clonedeep');
const ConfigLoader = require("./utils/configurator-loader.js");

async function main() {

  const configLoader = new ConfigLoader(hre.network.name);
  const config = await configLoader.load();
  const configUpdate = clonedeep(config);

  // Deploy DappRegistry
  const DappRegistry = await ethers.getContractFactory("DappRegistry");
  const dappRegistry = await DappRegistry.deploy(config.dappRegistry.timelock);
  configUpdate.dappRegistry.address = dappRegistry.address;
  console.log(`Deployed DappRegistry ${dappRegistry.address} with timelock ${config.dappRegistry.timelock}`);

  // Deploy new TokenRegistry
  const TokenRegistry = await ethers.getContractFactory("TokenRegistry");
  const tokenRegistry = await TokenRegistry.deploy();
  console.log("Deployed TokenRegistry ", tokenRegistry.address);
  configUpdate.tokenRegistry.address = tokenRegistry.address;

  await configLoader.save(configUpdate);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });