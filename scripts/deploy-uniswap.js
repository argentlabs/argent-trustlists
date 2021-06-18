const hre = require("hardhat");
const ethers = hre.ethers;
const clonedeep = require('lodash.clonedeep');

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
  if (config.dappRegistry.owner != deployer.address) {
    const multisigExecutor = new MultisigExecutor();
    await multisigExecutor.connect(config.dappRegistry.owner);
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