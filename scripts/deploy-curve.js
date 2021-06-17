const hre = require("hardhat");
const ethers = hre.ethers;
const clonedeep = require('lodash.clonedeep');

const ConfigLoader = require("./utils/configurator-loader.js");
const MultisigExecutor = require("./utils/multisigexecutor.js");

async function main() {

  const configLoader = new ConfigLoader(hre.network.name);
  const config = await configLoader.load();
  const configUpdate = clonedeep(config);

  const DappRegistry = await ethers.getContractFactory("DappRegistry");
  const dappRegistry = await DappRegistry.attach(config.dappRegistry.address);
  const deployer = (await ethers.getSigners())[0];

  // Temporarily give ownership of DappRegistry to deployment account if needed
  if (config.dappRegistry.owner != deployer.address) {
    const multisigExecutor = new MultisigExecutor();
    await multisigExecutor.connect(config.dappRegistry.owner);
    await multisigExecutor.executeCall(dappRegistry, "changeOwner", [0, deployer.address]);
  }

  // Add Curve filters
  const CurveFilter = await ethers.getContractFactory("CurveFilter");
  const curveFilter = await CurveFilter.deploy();
  configUpdate.curve.filter = curveFilter.address;
  for (const pool of config.curve.pools || []) {
    await dappRegistry.addDapp(0, pool, curveFilter.address);
    console.log(`Added Curve filter ${curveFilter.address} for Curve pool ${pool}`);
  }

  // Give ownership back
  if (config.dappRegistry.owner != deployer.address) {
    await dappRegistry.changeOwner(0, config.dappRegistry.owner);
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