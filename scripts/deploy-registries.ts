import hre, { ethers } from "hardhat";
import clonedeep from "lodash.clonedeep";

import { ConfigLoader } from "./utils/configurator-loader";

async function main() {

  const configLoader = new ConfigLoader(hre.network.name);
  const config = configLoader.load();
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

  configLoader.save(configUpdate);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });