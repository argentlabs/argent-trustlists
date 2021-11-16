import hre, { ethers } from "hardhat";
import clonedeep from "lodash.clonedeep";

import { ConfigLoader } from "./utils/configurator-loader";
import { MultisigExecutor } from "./utils/multisigexecutor";

const TRUSTLIST = 0;

async function main() {

  const configLoader = new ConfigLoader(hre.network.name);
  const config = configLoader.load();
  const configUpdate = clonedeep(config);

  const dappRegistry = await ethers.getContractAt("DappRegistry", config.dappRegistry.address);
  const [deployer] = await ethers.getSigners();

  // Temporarily give ownership of DappRegistry to deployment account if needed
  const registryOwner = await dappRegistry.registryOwners(TRUSTLIST);
  if (registryOwner != deployer.address) {
    const multisigExecutor = new MultisigExecutor();
    await multisigExecutor.connect(registryOwner);
    await multisigExecutor.executeCall(dappRegistry, "changeOwner", [TRUSTLIST, deployer.address]);
  }

  // Add WETH filters
  const WethFilter = await ethers.getContractFactory("WethFilter");
  const wethFilter = await WethFilter.deploy();
  await dappRegistry.addDapp(TRUSTLIST, config.weth.token, wethFilter.address);
  configUpdate.weth.filter = wethFilter.address;
  console.log(`Added WETH filter ${wethFilter.address} for WETH token ${config.weth.token}`);

  // Give ownership back
  if (registryOwner != deployer.address) {
    await dappRegistry.changeOwner(TRUSTLIST, registryOwner);
  }

  // update config
  configLoader.save(configUpdate);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });