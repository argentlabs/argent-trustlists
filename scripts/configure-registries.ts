import hre, { ethers } from "hardhat";
import clonedeep from "lodash.clonedeep";

import { ConfigLoader } from "./utils/configurator-loader";
import { MultisigExecutor } from "./utils/multisigexecutor";

const TRUSTLIST = 0;

export async function main() {

  const configLoader = new ConfigLoader(hre.network.name);
  const config = configLoader.load();
  const configUpdate = clonedeep(config);
  const multisigAddress = config.argent.multisig;

  /////////////////////////////////
  // DappRegistry
  /////////////////////////////////

  const dappRegistry = await ethers.getContractAt("DappRegistry", config.dappRegistry.address);
  const [deployer] = await ethers.getSigners();

  // Temporarily give ownership of DappRegistry to deployment account if needed
  const registryOwner = await dappRegistry.registryOwners(TRUSTLIST);
  if (registryOwner != deployer.address) {
    if (multisigAddress !== registryOwner) {
      throw new Error(`multisig address ${multisigAddress} != registry owner ${registryOwner}`);
    }
    
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
  const ArgentEnsFilter = await ethers.getContractFactory("ArgentEnsManagerFilter");
  const argentEnsFilter = await ArgentEnsFilter.deploy();
  await dappRegistry.addDapp(TRUSTLIST, config.argent.ens.manager, argentEnsFilter.address);
  configUpdate.argent.ens.managerFilter = argentEnsFilter.address;
  console.log(`Added Argent ENS Manager filter ${argentEnsFilter.address} for Argent ENS Manager ${config.argent.ens.manager}`);

  // Transfer ownership to Argent multisig
  await dappRegistry.changeOwner(TRUSTLIST, multisigAddress);
  console.log(`Transfered ownership of trustlist 0 to Argent multisig ${multisigAddress}`);


  // The following isn't part of our current model but leaving it commented here for legacy purposes

  /////////////////////////////////
  // TokenRegistry
  /////////////////////////////////

  // const TokenRegistry = await ethers.getContractFactory("TokenRegistry");
  // const tokenRegistry = await TokenRegistry.attach(config.tokenRegistry.address);

  // // Add Argent backend EOAs as managers to the TokenRegistry
  // for (const idx in config.argent.managers) {
  //   const manager = config.argent.managers[idx];
  //   console.log(`Adding ${manager} as a manager of the token registry`);
  //   await tokenRegistry.addManager(manager);
  // }

  // // Transfer ownership to Argent multisig
  // await tokenRegistry.changeOwner(multisigAddress);
  // console.log(`Transfered ownership of toekn registry to Argent multisig ${multisigAddress}`);

  /////////////////////////////////
  // Update the config
  /////////////////////////////////

  // update config
  configLoader.save(configUpdate);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}