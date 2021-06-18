const hre = require("hardhat");
const ethers = hre.ethers;
const clonedeep = require('lodash.clonedeep');

const ConfigLoader = require("./utils/configurator-loader.js");
const MultisigExecutor = require("./utils/multisigexecutor.js");

const TRUSTLIST = 0;

async function main() {

  // No Balancer integration on Ropsten
  if (hre.network.name === "ropsten") {
    console.log("skipping balancer on Ropsten");
    return;
  }

  const configLoader = new ConfigLoader(hre.network.name);
  const config = await configLoader.load();
  const configUpdate = clonedeep(config);

  const DappRegistry = await ethers.getContractFactory("DappRegistry");
  const dappRegistry = await DappRegistry.attach(config.dappRegistry.address);
  const deployer = (await ethers.getSigners())[0];

  // Temporarily give ownership of DappRegistry to deployment
  if (config.dappRegistry.owner != deployer.address) {
    const multisigExecutor = new MultisigExecutor();
    await multisigExecutor.connect(config.dappRegistry.owner);
    await multisigExecutor.executeCall(dappRegistry, "changeOwner", [TRUSTLIST, deployer.address]);
  }

  // A balancer filter to each pool
  const BalancerFilter = await ethers.getContractFactory("BalancerFilter");
  const balancerFilter = await BalancerFilter.deploy();
  configUpdate.balancer.v1.filter = balancerFilter.address;
  for (const pool of (config.balancer.v1.pools)) {
    await dappRegistry.addDapp(TRUSTLIST, pool, balancerFilter.address);
    console.log(`Added Balancer filter ${balancerFilter.address} for Balancer pool ${pool}`);
  }

  // Give ownership back
  if (config.dappRegistry.owner != deployer.address) {
    await dappRegistry.changeOwner(TRUSTLIST, config.dappRegistry.owner);
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