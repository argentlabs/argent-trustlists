import hre, { ethers } from "hardhat";
import clonedeep from "lodash.clonedeep";

import { ConfigLoader } from "./utils/configurator-loader";
import { MultisigExecutor } from "./utils/multisigexecutor";

const TRUSTLIST = 0;

async function main() {

  const configLoader = new ConfigLoader(hre.network.name);
  const config = await configLoader.load();
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

  // Add Pot filters
  const PotFilter = await ethers.getContractFactory("PotFilter");
  const potFilter = await PotFilter.deploy();
  await dappRegistry.addDapp(TRUSTLIST, config.maker.pot.address, potFilter.address);
  configUpdate.maker.pot.filter = potFilter.address;
  console.log(`Added Pot filter ${potFilter.address} for Maker Pot ${config.maker.pot.address}`);
  // Add Vat filter
  const VatFilter = await ethers.getContractFactory("VatFilter");
  const vatFilter = await VatFilter.deploy(config.maker.daiJoin.address, config.maker.pot.address);
  await dappRegistry.addDapp(TRUSTLIST, config.maker.vat.address, vatFilter.address);
  configUpdate.maker.vat.filter = vatFilter.address;
  console.log(`Added Vat filter ${vatFilter.address} for Maker Vat ${config.maker.vat.address}`);
  // Add DaiJoin filter
  const DaiJoinFilter = await ethers.getContractFactory("DaiJoinFilter");
  const daiJoinFilter = await DaiJoinFilter.deploy();
  await dappRegistry.addDapp(TRUSTLIST, config.maker.daiJoin.address, daiJoinFilter.address);
  configUpdate.maker.daiJoin.filter = daiJoinFilter.address;
  console.log(`Added DaiJoin filter ${daiJoinFilter.address} for Maker DaiJoin ${config.maker.daiJoin.address}`);

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