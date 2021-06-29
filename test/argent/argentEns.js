const { expect } = require("chai");
const { ethers } = require("hardhat");

const ARGENT_ENS_ABI = require('./abis/argentEns.json');
const ARGENT_ENS_ADDRESS = "0xF32FDDEF964b98b1d2d2b1C071ac60ED55d4D217";

const REGISTRY_ID = 0;
const TIMELOCK = 0;

describe("Argent ENS", function () {

  let registry;
  let argentEnsManager;
  let argentEnsFilter;
  let deployer;
  let wallet;
  let other;

  before(async function () {
    argentEnsManager = new ethers.Contract(ARGENT_ENS_ADDRESS, ARGENT_ENS_ABI, deployer);
    const DappRegistry = await ethers.getContractFactory("DappRegistry");
    const ArgentEnsFilter = await ethers.getContractFactory("ArgentEnsManagerFilter");
    argentEnsFilter = await ArgentEnsFilter.deploy();
    registry = await DappRegistry.deploy(TIMELOCK);
    await registry.addDapp(REGISTRY_ID, argentEnsManager.address, argentEnsFilter.address);
    [deployer, wallet, other] = await ethers.getSigners();
  });

  describe("Testing filter for Argent ENS Manager", function () {

    it("Should be added to the registry", async function () {
      const auth = await registry.getAuthorisation(0, argentEnsManager.address);
      expect(auth[0]).to.equal(argentEnsFilter.address);
    });

    it("Should reject ETH deposits", async function () {
      let data = "0x";
      const isAuthorised = await registry.isAuthorised(wallet.address, argentEnsManager.address, argentEnsManager.address, data);
      expect(isAuthorised).to.equal(false);
    });

    it("Should accept calls to register", async function () {
      let dummySignature = "0x1234";
      let data = argentEnsManager.interface.encodeFunctionData("register(string,address,bytes)", ["label", wallet.address, dummySignature]);
      const isAuthorised = await registry.isAuthorised(wallet.address, argentEnsManager.address, argentEnsManager.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should reject calls to unsupported methods", async function () {
      let data = argentEnsManager.interface.encodeFunctionData("register(string,address)", ["label", wallet.address]);
      const isAuthorised = await registry.isAuthorised(wallet.address, argentEnsManager.address, argentEnsManager.address, data);
      expect(isAuthorised).to.equal(false);
    });
  });
});
