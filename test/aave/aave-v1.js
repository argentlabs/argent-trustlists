const { expect } = require("chai");
const { ethers } = require("hardhat");

const { parseEther } = ethers.utils;

const LENDING_POOL_ABI = require('./abis/lendingPool.json');
const LENDING_POOL_ADDRESS = "0x398eC7346DcD622eDc5ae82352F02bE94C62d119";

const ATOKEN_ABI = require('./abis/aToken.json');
const ATOKEN_ADDRESS = "0x9ba00d6856a4edf4665bca2c2309936572473b7e"; // aUSDC
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

const REGISTRY_ID = 0;
const TIMELOCK = 0;

describe("Aave V1", function() {
  
  let DappRegistry;
  let LendingPoolFilter;
  let ATokenFilter;
  let registry;
  let deployer;
  let wallet;
  let other;

  before(async function() {
    DappRegistry = await ethers.getContractFactory("DappRegistry");
    LendingPoolFilter = await ethers.getContractFactory("AaveV1LendingPoolFilter");
    ATokenFilter = await ethers.getContractFactory("AaveV1ATokenFilter");
    registry = await DappRegistry.deploy(TIMELOCK);
    [deployer, wallet, other] = await ethers.getSigners();
  });

  describe("Testing filter for LendingPool", function() {

    let lendingPool;
    let lendingPoolFilter;

    before(async function() {
      lendingPool = new ethers.Contract(LENDING_POOL_ADDRESS, LENDING_POOL_ABI, deployer);
      lendingPoolFilter = await LendingPoolFilter.deploy();
      await registry.addDapp(REGISTRY_ID, lendingPool.address, lendingPoolFilter.address);
    });

    it("Should be added to the registry", async function() {
      const auth = await registry.getAuthorisation(0, lendingPool.address);
      expect(auth[0]).to.equal(lendingPoolFilter.address);
    });

    it("Should accept calls to deposit", async function() {
      let data = lendingPool.interface.encodeFunctionData("deposit", [USDC_ADDRESS, parseEther("0.1"), 0]);
      const isAuthorised = await registry.isAuthorised(wallet.address, lendingPool.address, lendingPool.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should reject calls to borrow", async function() {
      let data = lendingPool.interface.encodeFunctionData("borrow", [USDC_ADDRESS, parseEther("0.1"), 0, 0]);
      const isAuthorised = await registry.isAuthorised(wallet.address, lendingPool.address, lendingPool.address, data);
      expect(isAuthorised).to.equal(false);
    });
  });

  describe("Testing filter for aToken", function() {

    let aToken;
    let aTokenFilter;

    before(async function() {
      aToken = new ethers.Contract(ATOKEN_ADDRESS, ATOKEN_ABI, deployer);
      aTokenFilter = await ATokenFilter.deploy();
      await registry.addDapp(REGISTRY_ID, aToken.address, aTokenFilter.address);
    });

    it("Should be added to the registry", async function() {
      const auth = await registry.getAuthorisation(0, aToken.address);
      expect(auth[0]).to.equal(aTokenFilter.address);
    });

    it("Should accept calls to redeem", async function() {
      let data = aToken.interface.encodeFunctionData("redeem", [parseEther("0.1")]);
      const isAuthorised = await registry.isAuthorised(wallet.address, aToken.address, aToken.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should reject calls to transfer", async function() {
      let data = aToken.interface.encodeFunctionData("transfer", [other.address, parseEther("0.1")]);
      const isAuthorised = await registry.isAuthorised(wallet.address, other.address, aToken.address, data);
      expect(isAuthorised).to.equal(false);
    });
  });
});
