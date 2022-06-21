const { expect } = require("chai");
const { ethers } = require("hardhat");

const { parseEther } = ethers.utils;

const WETH_ABI = require('./abis/weth.json');
const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

const REGISTRY_ID = 0;
const TIMELOCK = 0;

describe("Weth", function() {
  
  let DappRegistry;
  let WethFilter;
  let registry;
  let deployer;
  let wallet;
  let other;

  before(async function() {
    DappRegistry = await ethers.getContractFactory("DappRegistry");
    WethFilter = await ethers.getContractFactory("WethFilter");
    registry = await DappRegistry.deploy(TIMELOCK);
    [deployer, wallet, other] = await ethers.getSigners();
  });

  describe("Testing filter for WETH", function() {

    let weth;
    let wethFilter;

    before(async function() {
      weth = new ethers.Contract(WETH_ADDRESS, WETH_ABI, deployer);
      wethFilter = await WethFilter.deploy();
      await registry.addDapp(REGISTRY_ID, weth.address, wethFilter.address);
    });

    it("Should be added to the registry", async function() {
      const auth = await registry.getAuthorisation(0, weth.address);
      expect(auth[0]).to.equal(wethFilter.address);
    });

    it("Should accept deposit", async function() {
      let data = weth.interface.encodeFunctionData("deposit", []);
      const isAuthorised = await registry.isAuthorised(wallet.address, weth.address, weth.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should accept deposit wia the fallback method", async function() {
      let data = "0x";
      const isAuthorised = await registry.isAuthorised(wallet.address, weth.address, weth.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should block calls with 1, 2 or 3 bytes of data", async function() {
      let data = "0x01";
      const isAuthorised = await registry.isAuthorised(wallet.address, weth.address, weth.address, data);
      expect(isAuthorised).to.equal(false);
    });

    it("Should accept to withdraw", async function() {
        let data = weth.interface.encodeFunctionData("withdraw", [parseEther("0.1")]);
        const isAuthorised = await registry.isAuthorised(wallet.address, weth.address, weth.address, data);
        expect(isAuthorised).to.equal(true);
    });

    it("Should reject to transfer token", async function() {
        let data = weth.interface.encodeFunctionData("transfer", [other.address, parseEther("0.1")]);
        const isAuthorised = await registry.isAuthorised(wallet.address, other.address, weth.address, data);
        expect(isAuthorised).to.equal(false);
    });
  });
});
