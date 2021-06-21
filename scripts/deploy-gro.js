const hre = require("hardhat");
const ethers = hre.ethers;
const clonedeep = require("lodash.clonedeep");

const ConfigLoader = require("./utils/configurator-loader.js");
const MultisigExecutor = require("./utils/multisigexecutor.js");

const TRUSTLIST = 0;

async function main() {
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
  // Gro
  /////////////////////////////////

  const GroWithdrawFilter = await ethers.getContractFactory("GroWithdrawFilter");
  const GroDepositFilter = await ethers.getContractFactory("GroDepositFilter");
  const depositFilter = await GroDepositFilter.deploy();
  const withdrawFilter = await GroWithdrawFilter.deploy();
  configUpdate.gro.deposit.filter = depositFilter.address;
  configUpdate.gro.withdraw.filter = withdrawFilter.address;
  await dappRegistry.addDapp(TRUSTLIST, configUpdate.gro.deposit.handler, depositFilter.address);
  console.log(`Added deposit filter ${depositFilter.address} for Gro deposit handler ${configUpdate.gro.deposit.handler}`);
  await dappRegistry.addDapp(TRUSTLIST, configUpdate.gro.withdraw.handler, withdrawFilter.address);
  console.log(`Added withdraw filter ${withdrawFilter.address} for Gro withdraw handler ${configUpdate.gro.withdraw.handler}`);

  // Give ownership back
  if (registryOwner != deployer.address) {
    await dappRegistry.changeOwner(TRUSTLIST, registryOwner);
  }

  // update config
  await configLoader.save(configUpdate);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
