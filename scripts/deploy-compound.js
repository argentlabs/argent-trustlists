const hre = require("hardhat");
const ethers = hre.ethers;
const clonedeep = require('lodash.clonedeep');

const ConfigLoader = require("./utils/configurator-loader.js");
const MultisigExecutor = require("./utils/multisigexecutor.js");

async function main() {

  console.log('\n', `/////////////     Running [deploy-compound.js] on [${hre.network.name}]     ///////////////`, '\n');

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

  // Add Compound filters
  for (const idx in config.compound.markets) {
    const market = config.compound.markets[idx];
    const CompoundFilter = await ethers.getContractFactory("CompoundCTokenFilter");
    const compoundFilter = await CompoundFilter.deploy(market.token);
    configUpdate.compound.markets[idx].filter = compoundFilter.address;
    await dappRegistry.addDapp(0, market.cToken, compoundFilter.address);
    console.log(`Added filter ${compoundFilter.address} for Compound cTken ${market.cToken}`);
  }
  await configLoader.save(configUpdate);

  // Give ownership back
  if (config.dappRegistry.owner != deployer.address) {
    await dappRegistry.changeOwner(0, config.dappRegistry.owner);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });