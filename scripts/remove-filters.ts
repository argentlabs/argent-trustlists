import hre, { ethers } from "hardhat";
import fetch from 'node-fetch';
import { ConfigLoader } from "./utils/configurator-loader";
import { setTimeout } from "timers/promises";

const TRUSTLIST = 0;
const FILTERS_TO_REMOVE = [
  "BalancerFilter",
  "CurveFilter",
  "ParaswapFilter",
  "ParaswapUniV2RouterFilter",
  "UniswapV3RouterFilter",
  "WhitelistedZeroExV2Filter",
  "WhitelistedZeroExV4Filter",
  "UniswapV2UniZapFilter"
];
const network = "staging";

async function getContractName(contractAddress: string, apiKey: string) {
  const response = await fetch(`https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${contractAddress}&apiKey=${apiKey}`);
  const result = await response.json();
  if (result.status != 1) {
    throw Error(`Error getting contract name in etherscan: ${JSON.stringify(result)}`);
  }
  return result.result[0].ContractName;
}

export async function main() {
  // const configLoader = new ConfigLoader(hre.network.name);
  const configLoader = new ConfigLoader(network);
  const apiKey = process.env.ETHERSCAN_API_KEY!;
  const config = configLoader.load();

  const dappRegistry = await ethers.getContractAt("DappRegistry", config.dappRegistry.address);
  const [deployer] = await ethers.getSigners();
  dappRegistry.connect(deployer);

  const filter = await dappRegistry.filters.DappAdded(TRUSTLIST, null, null, null);

  const logs = await dappRegistry.provider.getLogs({
    fromBlock: 0,
    toBlock: 'latest',
    ...filter
  });
  const events = logs.map(log => dappRegistry.interface.parseLog(log))
  const allDappsInEvents = events.map(e => (e.args[1]).toLowerCase());
  const dapps = [...new Set(allDappsInEvents)];

  const allFiltersInEvents = events.map(e => (e.args[2]).toLowerCase());
  const filters = [...new Set(allFiltersInEvents)]

  console.log(`Querying filter names...`);
  const filterWithNames: any[] = [];
  for (const filter of filters) {
    const name = (await getContractName(filter, apiKey));
    await setTimeout(500);
    console.log(`${filter} -> ${name}`);
    filterWithNames.push([filter, name]);
  }

  const filtersToRemove = filterWithNames.filter(f => FILTERS_TO_REMOVE.includes(f[1]));
  const filtersAddressesToRemove = filtersToRemove.map(f => f[0]);

  const dappsToRemove: string[] = []
  console.log(`Querying dapp filters...`);
  for (const dapp of dapps) {
    await setTimeout(500);
    const authorisation = await dappRegistry.authorisations(TRUSTLIST, dapp);
    const dappFilter = ("0x" + authorisation.substring(10, 50)).toLowerCase();
    console.log(`filter: ${dappFilter}`);
    if (filtersAddressesToRemove.includes(dappFilter)) {
      dappsToRemove.push(dapp);
    }
  }
  console.log(`Dapps to remove:`);
  console.log(dappsToRemove);


  console.log(`Removing...`);
  const registryOwner = await dappRegistry.registryOwners(TRUSTLIST);
  if (registryOwner != deployer.address) {
    console.log(`The account ${deployer} is not the owner of the registry`);
    return;
  }


  for (const dappToRemove of dappsToRemove) {
    const receipt = await dappRegistry.removeDapp(TRUSTLIST, dappToRemove);
    console.log(`receipt: ${receipt}`);
  }
};

