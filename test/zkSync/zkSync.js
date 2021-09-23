const { expect } = require("chai");
const { ethers } = require("hardhat");

const ZKSYNC_ABI = require('./abis/zkSync.json');
const ZKSYNC_ADDRESS = "0xF32FDDEF964b98b1d2d2b1C071ac60ED55d4D217";

const REGISTRY_ID = 0;
const TIMELOCK = 0;

describe("zkSync", function () {

  let registry;
  let zkSync;
  let zkSyncFilter;
  let deployer;
  let wallet;
  let other;

  before(async function () {
    zkSync = new ethers.Contract(ZKSYNC_ADDRESS, ZKSYNC_ABI, deployer);
    const DappRegistry = await ethers.getContractFactory("DappRegistry");
    const ZkSyncFilter = await ethers.getContractFactory("ZkSyncFilter");
    zkSyncFilter = await ZkSyncFilter.deploy();
    registry = await DappRegistry.deploy(TIMELOCK);
    await registry.addDapp(REGISTRY_ID, zkSync.address, zkSyncFilter.address);
    [deployer, wallet, other] = await ethers.getSigners();
  });

  describe("Testing filter for zkSync", function () {

    it("Should be added to the registry", async function () {
      const auth = await registry.getAuthorisation(0, zkSync.address);
      expect(auth[0]).to.equal(zkSyncFilter.address);
    });

    it("Should reject ETH deposits", async function () {
      let data = "0x";
      const isAuthorised = await registry.isAuthorised(wallet.address, zkSync.address, zkSync.address, data);
      expect(isAuthorised).to.equal(false);
    });

    it("Should accept calls to setAuthPubkeyHash", async function () {
      let data = zkSync.interface.encodeFunctionData("setAuthPubkeyHash(bytes,uint32)", [[], 0]);
      const isAuthorised = await registry.isAuthorised(wallet.address, zkSync.address, zkSync.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should reject calls to unsupported methods", async function () {
      let data = zkSync.interface.encodeFunctionData("getNoticePeriod()", []);
      const isAuthorised = await registry.isAuthorised(wallet.address, zkSync.address, zkSync.address, data);
      expect(isAuthorised).to.equal(false);
    });
  });
});
