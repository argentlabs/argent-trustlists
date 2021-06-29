const hre = require("hardhat");
const ethers = hre.ethers;
const clonedeep = require("lodash.clonedeep");
const BN = require("bn.js");

const ConfigLoader = require("./utils/configurator-loader.js");
const MultisigExecutor = require("./utils/multisigexecutor.js");

const TRUSTLIST = 0;

const keypress = async () => {
  process.stdin.setRawMode(true);
  return new Promise((resolve) =>
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

  const installFilter = async ({ filterDeployer, dapp, dappName = "Dapp", filterName = "Filter", registryId = TRUSTLIST }) => {
    const timelock = 1000 * parseInt((await dappRegistry.timelockPeriod()).toHexString(), 16);
    const filter = (await dappRegistry.getAuthorisation(registryId, dapp))[0];
    const [filterStr, dappStr] = [`${filterName}@${filter}`, `${dappName}@${dapp}`];
    if (filter === ethers.constants.AddressZero) {
      const newFilter = await filterDeployer();
      console.log(`Adding ${filterName}@${newFilter} for ${dappStr}`);
      await dappRegistry.addDapp(registryId, dapp, newFilter);
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
        await dappRegistry.requestFilterUpdate(registryId, dapp, newFilter);
        console.log(`Done. Pending filter update will be confirmable on ${new Date(Date.now() + timelock).toLocaleString()}\n`);
      } else if (Date.now() < pendingUpdateConfirmationTime) {
        const confTime = new Date(pendingUpdateConfirmationTime).toLocaleString();
        console.log(`Pending installation of ${filterName}@${pendingUpdateFilterAddress} for ${dappStr} will be confirmable on ${confTime}\n`);
      } else {
        console.log(`Confirming installation of ${filterName}@${pendingUpdateFilterAddress} for ${dappStr}`);
        await dappRegistry.confirmFilterUpdate(registryId, dapp);
        console.log("Done.\n");
      }
    }
  };

  /////////////////////////////////
  // Paraswap
  /////////////////////////////////

  const ParaswapFilter = await ethers.getContractFactory("ParaswapFilter");
  const ParaswapUniV2RouterFilter = await ethers.getContractFactory("ParaswapUniV2RouterFilter");
  const UniswapV3RouterFilter = await ethers.getContractFactory("UniswapV3RouterFilter");
  const WhitelistedZeroExV2Filter = await ethers.getContractFactory("WhitelistedZeroExV2Filter");
  const WhitelistedZeroExV4Filter = await ethers.getContractFactory("WhitelistedZeroExV4Filter");

  const forks = [config.paraswap.uniswapV2Forks.sushiswap, config.paraswap.uniswapV2Forks.linkswap, config.paraswap.uniswapV2Forks.defiswap];

  await installFilter({
    filterDeployer: async () => {
      console.log("Deploying ParaswapFilter...");
      const paraswapFilter = await ParaswapFilter.deploy(
        config.tokenRegistry.address,
        config.dappRegistry.address,
        config.paraswap.contract,
        config.paraswap.uniswapProxy,
        [...forks, config.uniswap.v3].map((f) => f.factory),
        [...forks, config.uniswap.v3].map((f) => f.initCode),
        [
          config.paraswap.adapters.uniswap,
          config.paraswap.adapters.uniswapV2,
          config.paraswap.adapters.sushiswap,
          config.paraswap.adapters.linkswap,
          config.paraswap.adapters.defiswap,
          config.paraswap.adapters.zeroexV2,
          config.paraswap.adapters.zeroexV4,
          config.paraswap.adapters.curve,
          config.paraswap.adapters.weth,
          config.paraswap.adapters.uniswapV3,
        ],
        [...Object.values(config.paraswap.targetExchanges || {}), ...config.curve.pools],
        config.paraswap.marketMakers || []
      );
      console.log(`Deployed ParaswapFilter at ${paraswapFilter.address}`);
      configUpdate.paraswap.filters.paraswap = paraswapFilter.address;
      return paraswapFilter.address;
    },
    dapp: config.paraswap.contract,
    dappName: "Augustus",
    filterName: "ParaswapFilter",
  });

  // ParaswapUniV2RouterFilter
  const factories = [config.uniswap.v2, ...forks].map((f) => f.factory);
  const initCodes = [config.uniswap.v2, ...forks].map((f) => f.initCode);
  const routers = [config.paraswap, ...forks].map((f) => f.paraswapUniV2Router);
  for (let i = 0; i < routers.length; i += 1) {
    await installFilter({
      filterDeployer: async () => {
        console.log(`Deploying ParaswapUniV2RouterFilter#${i}...`);
        const paraswapUniV2RouterFilter = await ParaswapUniV2RouterFilter.deploy(config.tokenRegistry.address, factories[i], initCodes[i], config.weth.token);
        console.log(`Deployed ParaswapUniV2RouterFilter#${i} at ${paraswapUniV2RouterFilter.address}`);
        configUpdate.paraswap.filters[["uniswapV2", "sushiswap", "linkswap", "defiswap"][i]] = paraswapUniV2RouterFilter.address;
        return paraswapUniV2RouterFilter.address;
      },
      dapp: routers[i],
      dappName: `ParaswapUniV2Router#${i}`,
      filterName: `ParaswapUniV2RouterFilter#${i}`,
    });
  }

  // UniswapV3RouterFilter
  await installFilter({
    filterDeployer: async () => {
      const uniV3RouterFilter = await UniswapV3RouterFilter.deploy(config.tokenRegistry.address, config.uniswap.v3.factory, config.uniswap.v3.initCode, config.weth.token);
      console.log(`Deployed UniswapV3RouterFilter at ${uniV3RouterFilter.address}`);
      configUpdate.paraswap.filters.uniswapV3 = uniV3RouterFilter.address;
      return uniV3RouterFilter.address;
    },
    dapp: config.uniswap.v3.router,
    dappName: "UniswapV3Router",
    filterName: "UniswapV3RouterFilter",
  });

  // WhitelistedZeroExV2Filter
  await installFilter({
    filterDeployer: async () => {
      const zeroExV2Filter = await WhitelistedZeroExV2Filter.deploy(config.paraswap.marketMakers);
      console.log(`Deployed WhitelistedZeroExV2Filter at ${zeroExV2Filter.address}`);
      configUpdate.paraswap.filters.zeroexV2 = zeroExV2Filter.address;
      return zeroExV2Filter.address;
    },
    dapp: config.paraswap.targetExchanges.zeroexV2,
    dappName: "ZeroExV2",
    filterName: "WhitelistedZeroExV2Filter",
  });

  // WhitelistedZeroExV4Filter
  await installFilter({
    filterDeployer: async () => {
      const zeroExV4Filter = await WhitelistedZeroExV4Filter.deploy(config.paraswap.marketMakers);
      console.log(`Deployed WhitelistedZeroExV4Filter at ${zeroExV4Filter.address}`);
      configUpdate.paraswap.filters.zeroexV4 = zeroExV4Filter.address;
      return zeroExV4Filter.address;
    },
    dapp: config.paraswap.targetExchanges.zeroexV4,
    dappName: "ZeroExV4",
    filterName: "WhitelistedZeroExV4Filter",
  });

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
