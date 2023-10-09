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
const MAX_FEE_PER_GAS = 60000000000n // 60gwei
const MAX_TIP = 10000000000n //  1gwei

async function getContractName(contractAddress: string, apiKey: string) {
  const response = await fetch(`https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${contractAddress}&apiKey=${apiKey}`);
  const result = await response.json();
  if (result.status != 1) {
    throw Error(`Error getting contract name in etherscan: ${JSON.stringify(result)}`);
  }
  return result.result[0].ContractName;
}

export async function main() {
  let environment;
  if (hre.network.name == "hardhat") {
    environment = "prod";
  } else {
    environment = hre.network.name;
  }
  const configLoader = new ConfigLoader(environment);
  const apiKey = process.env.ETHERSCAN_API_KEY!;
  const config = configLoader.load();

  const dappRegistry = await ethers.getContractAt("DappRegistry", config.dappRegistry.address);
  const registryOwner = await dappRegistry.registryOwners(TRUSTLIST);

  let ownerAccount;
  if (hre.network.name == "hardhat") {
    console.log(`Running on a fork, impersonating owner`);
    ownerAccount = await hre.ethers.getImpersonatedSigner(registryOwner);
    dappRegistry.connect(ownerAccount);
    await hre.ethers.provider.send("hardhat_setBalance", [
      registryOwner,
      "0x20000000000000000",
    ]);
  } else {
    [ownerAccount] = await ethers.getSigners();
    if (!ownerAccount) throw Error("Unable to load owner account");
  }

  const filterTopicHash = await dappRegistry.filters.DappAdded(null, null, null, null).fragment.topicHash;
  const logs = await hre.ethers.provider.getLogs({
    fromBlock: 0,
    toBlock: 'latest',
    topics: [filterTopicHash],
    address: config.dappRegistry.address
  });
  const events = logs.map(log => dappRegistry.interface.parseLog({ topics: log.topics.concat(), data: log.data }));
  const allDappsInEvents = events.map(e => (e?.args[1]).toLowerCase());
  const dapps = [...new Set(allDappsInEvents)];

  console.log(`Querying dapp filters...`);
  const dappToFilter: Record<string, string> = {};
  for (const dapp of dapps) {
    await setTimeout(500);
    const authorisation = await dappRegistry.authorisations(TRUSTLIST, dapp);
    const dappFilter = ("0x" + authorisation.substring(10, 50)).toLowerCase();
    console.log(`dapp ${dapp} -> filter ${dappFilter}`);
    dappToFilter[dapp] = dappFilter;
  }
  const filters = [...new Set(Object.values(dappToFilter))]

  console.log(`Querying filter names...`);
  const filterWithNames: any[] = [];
  for (const filter of filters) {
    const name = (await getContractName(filter, apiKey));
    await setTimeout(500);
    console.log(`${filter} -> ${name}`);
    filterWithNames.push([filter, name]);
  }

  console.log(`Filters to remove:`);
  const filtersToRemove = filterWithNames.filter(([, filterName]) => FILTERS_TO_REMOVE.includes(filterName));
  console.log(filtersToRemove);
  const filtersAddressesToRemove = filtersToRemove.map(([filterAddress, filterName]) => filterAddress);

  console.log(`Dapps to remove:`);
  const dappsToRemove = Object.entries(dappToFilter)
    .filter(([dapp, filter]) => filtersAddressesToRemove.includes(filter))
    .map(([dapp, filter]) => dapp);
  console.log(dappsToRemove);

  console.log(`Removing...`);
  if (registryOwner != ownerAccount.address) {
    console.log(`The account ${ownerAccount} is not the owner of the registry`);
    return;
  }

  for (const dappToRemove of dappsToRemove) {
    const tx = await dappRegistry.removeDapp.populateTransaction(TRUSTLIST, dappToRemove)
    const response = await ownerAccount.sendTransaction({ ...tx, maxFeePerGas: MAX_FEE_PER_GAS, maxPriorityFeePerGas: MAX_TIP });
    console.log(`Sent tx: ${response.hash}`);
    const receipt = await response.wait();
    if (receipt?.status != 1) {
      throw Error("Transaction failed");
    }
  }
};

