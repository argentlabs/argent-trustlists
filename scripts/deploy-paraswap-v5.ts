import { TransactionResponse } from "@ethersproject/abstract-provider";
import hre, { ethers } from "hardhat";
import clonedeep from "lodash.clonedeep";

import { ConfigLoader } from "./utils/configurator-loader";
import { MultisigExecutor } from "./utils/multisigexecutor";

const TRUSTLIST = 0;

export async function main() {

  const configLoader = new ConfigLoader(hre.network.name);
  const config = configLoader.load();
  const configUpdate = clonedeep(config);

  const dappRegistry = await ethers.getContractAt("DappRegistry", config.dappRegistry.address);
  const [deployer] = await ethers.getSigners();
  console.log("Deployer is", deployer.address);

  let tx: TransactionResponse;

  // Temporarily give ownership of DappRegistry to deployment account if needed
  const registryOwner = await dappRegistry.registryOwners(TRUSTLIST);
  if (registryOwner != deployer.address) {
    const multisigExecutor = new MultisigExecutor(config.argent.multisig.autosign);
    await multisigExecutor.connect(registryOwner);
    tx = await multisigExecutor.executeCall(dappRegistry, "changeOwner", [TRUSTLIST, deployer.address]);
    await tx.wait();
  }

  // Add Paraswap filter
  const Filter = await ethers.getContractFactory("ParaswapV5Filter");
  const filter = await Filter.deploy(config.masterSigner.address);

  tx = await dappRegistry.addDapp(TRUSTLIST, config.paraswapV5.address, filter.address);
  await tx.wait();

  configUpdate.paraswapV5.filter = filter.address;
  console.log(`Added Paraswap v5 filter ${filter.address} with master signer ${config.masterSigner.address}`);

  // Add spender approval filter
  tx = await dappRegistry.addDapp(TRUSTLIST, config.paraswapV5.spenderAddress, config.argent.onlyApproveFilter);
  await tx.wait();

  console.log(`Added OnlyApprove filter ${config.argent.onlyApproveFilter} for paraswap spender ${config.paraswapV5.spenderAddress}`);

  // Give ownership back
  if (registryOwner != deployer.address) {
    tx = await dappRegistry.changeOwner(TRUSTLIST, registryOwner);
    await tx.wait();
  }

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