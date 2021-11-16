import hre, { ethers } from "hardhat";
import clonedeep from "lodash.clonedeep";
import BN from "bn.js";

import { ConfigLoader } from "./utils/configurator-loader";
import { MultisigExecutor } from "./utils/multisigexecutor";

const TRUSTLIST = 0;

const keypress = () => {
  process.stdin.setRawMode(true);
  return new Promise<void>((resolve) =>
    process.stdin.once("data", (data) => {
      const byteArray = [...data];
      if (byteArray.length > 0 && byteArray[0] === 3) {
        console.log("^C");
        process.exit(1);
      }
      process.stdin.setRawMode(false);
      resolve();
    })
  );
};

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
    const tx = await multisigExecutor.executeCall(dappRegistry, "changeOwner", [TRUSTLIST, deployer.address]);
    await tx.wait();
  }

  const installFilter = async ({ filterDeployer, dapp, dappName = "Dapp", filterName = "Filter", registryId = TRUSTLIST }: any) => {
    const timelock = 1000 * parseInt((await dappRegistry.timelockPeriod()).toHexString(), 16);
    const filter = (await dappRegistry.getAuthorisation(registryId, dapp))[0];
    const [filterStr, dappStr] = [`${filterName}@${filter}`, `${dappName}@${dapp}`];
    if (filter === ethers.constants.AddressZero) {
      const newFilter = await filterDeployer();
      console.log(`Adding ${filterName}@${newFilter} for ${dappStr}`);
      const tx = await dappRegistry.addDapp(registryId, dapp, newFilter);
      await tx.wait();
      console.log(`Done. Filter will be active on ${new Date(Date.now() + timelock).toLocaleString()}\n`);
    } else {
      const pendingUpdate = await dappRegistry.pendingFilterUpdates(registryId, dapp);
      const pendingUpdateConfirmationTime = 1000 * parseInt(new BN(pendingUpdate.slice(2), 16).maskn(64).toString(16), 16);
      const pendingUpdateFilterAddress = `0x${pendingUpdate.slice(10, 50)}`;
      if (pendingUpdate === ethers.constants.HashZero) {
        console.log(`Existing filter ${filterStr} found for ${dappStr}. Press any key to confirm its replacement, or Cmd+C to cancel.\n`);
        await keypress();
        const newFilter = await filterDeployer();
        console.log(`Requesting replacement of ${filterStr} by ${filterName}@${newFilter} for ${dappStr}`);
        const tx = await dappRegistry.requestFilterUpdate(registryId, dapp, newFilter);
        await tx.wait();
        console.log(`Done. Pending filter update will be confirmable on ${new Date(Date.now() + timelock).toLocaleString()}\n`);
      } else if (Date.now() < pendingUpdateConfirmationTime) {
        const confTime = new Date(pendingUpdateConfirmationTime).toLocaleString();
        console.log(`Pending installation of ${filterName}@${pendingUpdateFilterAddress} for ${dappStr} will be confirmable on ${confTime}\n`);
      } else {
        console.log(`Confirming installation of ${filterName}@${pendingUpdateFilterAddress} for ${dappStr}`);
        const tx = await dappRegistry.confirmFilterUpdate(registryId, dapp);
        await tx.wait();
        console.log("Done.\n");
      }
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  
  // Add a call to installFilter for every filter that you want to update:
  /* 
  await installFilter({
    // must retrun the address of the filter
    filterDeployer: async () => {
      const myFilterToUpdate = await MyFilterToUpdate.deploy(...);
      console.log(`Deployed MyFilterToUpdate at ${myFilterToUpdate.address}`);
      configUpdate.myDapp.filter = myFilterToUpdate.address;
      return myFilterToUpdate.address;
    },
    dapp: config.myDapp.address,
    dappName: "MyDapp",
    filterName: "MyDappFilter",
  });
   */
  /////////////////////////////////////////////////////////////////////////////

  // Give ownership back
  if (registryOwner != deployer.address) {
    const tx = await dappRegistry.changeOwner(TRUSTLIST, registryOwner);
    await tx.wait();
  }

  // update config
  await configLoader.save(configUpdate);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  })
