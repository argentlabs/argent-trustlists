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

  // Temporarily give ownership of DappRegistry to deployment account
  const registryOwner = await dappRegistry.registryOwners(TRUSTLIST);
  if (registryOwner != deployer.address) {
    const multisigExecutor = new MultisigExecutor();
    await multisigExecutor.connect(registryOwner);
    await multisigExecutor.executeCall(dappRegistry, "changeOwner", [TRUSTLIST, deployer.address]);
  }

  /////////////////////////////////
  // Aave V1
  /////////////////////////////////

  // lending pool
  const AaveV1LendingPoolFilter = await ethers.getContractFactory("AaveV1LendingPoolFilter");
  const aaveV1LendingPoolFilter = await AaveV1LendingPoolFilter.deploy();
  await dappRegistry.addDapp(TRUSTLIST, config.aave.v1.lendingPool.address, aaveV1LendingPoolFilter.address);
  configUpdate.aave.v1.lendingPool.filter = aaveV1LendingPoolFilter.address;
  console.log(`Added AaveV1LendingPoolFilter ${aaveV1LendingPoolFilter.address} for Aave v1 Lending Pool ${config.aave.v1.lendingPool.address}`);

  // lending pool core
  const OnlyApproveFilter = await ethers.getContractFactory("OnlyApproveFilter");
  const onlyApproveFilter = await OnlyApproveFilter.deploy();
  await dappRegistry.addDapp(TRUSTLIST, config.aave.v1.lendingPoolCore.address, onlyApproveFilter.address);
  configUpdate.aave.v1.lendingPoolCore.filter = onlyApproveFilter.address;
  console.log(`Added OnlyApproveFilter ${onlyApproveFilter.address} for Aave v1 Lending Pool Core ${config.aave.v1.lendingPoolCore.address}`);

  // aTokens
  const AaveV1ATokenFilter = await ethers.getContractFactory("AaveV1ATokenFilter");
  const aaveV1ATokenFilter = await AaveV1ATokenFilter.deploy();
  configUpdate.aave.v1.filter = aaveV1ATokenFilter.address;
  for (const aToken of config.aave.v1.aTokens) {
    await dappRegistry.addDapp(TRUSTLIST, aToken, aaveV1ATokenFilter.address);
    console.log(`Added aaveV1ATokenFilter ${onlyApproveFilter.address} for aToken ${aToken}`);
  }

  /////////////////////////////////
  // Aave V2
  /////////////////////////////////

  // No Aave v2 integration on Ropsten
  if (hre.network.name === "ropsten") {
    console.log("skipping Aave v2 on Ropsten");
  } else {
    const AaveV2Filter = await ethers.getContractFactory("AaveV2Filter");
    const aaveV2Filter = await AaveV2Filter.deploy();
    await dappRegistry.addDapp(TRUSTLIST, config.aave.v2.lendingPool.address, aaveV2Filter.address);
    configUpdate.aave.v2.lendingPool.filter = aaveV1LendingPoolFilter.address;
    console.log(`Added AaveV2Filter ${aaveV2Filter.address} for Aave v2 Lending Pool ${config.aave.v2.lendingPool.address}`);
  }

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
