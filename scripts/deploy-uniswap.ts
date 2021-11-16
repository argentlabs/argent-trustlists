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

  /////////////////////////////////
  // Uniswap V2
  /////////////////////////////////

  // Add UniZap filter
  const UniswapV2Filter = await ethers.getContractFactory("UniswapV2UniZapFilter");
  const uniswapV2Filter = await UniswapV2Filter.deploy(
    config.tokenRegistry.address,
    config.uniswap.v2.factory,
    config.uniswap.v2.initCode,
    config.weth.token
  );
  await dappRegistry.addDapp(TRUSTLIST, config.uniswap.v2.unizap, uniswapV2Filter.address);
  configUpdate.uniswap.v2.filter = uniswapV2Filter.address;
  console.log(`Added Uniswap v2 filter ${uniswapV2Filter.address} for Uniswap v2 UniZap ${config.uniswap.v2.unizap}`);

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