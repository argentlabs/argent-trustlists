const { expect } = require("chai");
const { ethers } = require("hardhat");

const { parseEther } = ethers.utils;

const ERC20_ABI = require('../erc20/abis/erc20.json');
const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

const LENDING_POOL_V2__ABI = require('./abis/lendingPoolV2.json');
const LENDING_POOL_V2_ADDRESS = "0xC6845a5C768BF8D7681249f8927877Efda425baf";

const REGISTRY_ID = 0;
const TIMELOCK = 0;

describe("Aave V2", function() {
  
  let DappRegistry;
  let AaveV2Filter;
  let registry;
  let deployer;
  let wallet;
  let other;
  let token;

  before(async function() {
    DappRegistry = await ethers.getContractFactory("DappRegistry");
    AaveV2Filter = await ethers.getContractFactory("AaveV2Filter");
    registry = await DappRegistry.deploy(TIMELOCK);
    [deployer, wallet, other] = await ethers.getSigners();
    token = new ethers.Contract(DAI, ERC20_ABI);
  });

  describe("Testing filter for LendingPool", function() {

    let lendingPool;
    let lendingPoolFilter;

    before(async function() {
      lendingPool = new ethers.Contract(LENDING_POOL_V2_ADDRESS, LENDING_POOL_V2__ABI, deployer);
      lendingPoolFilter = await AaveV2Filter.deploy();
      await registry.addDapp(REGISTRY_ID, lendingPool.address, lendingPoolFilter.address);
    });

    it("Should be added to the registry", async function() {
      const auth = await registry.getAuthorisation(0, lendingPool.address);
      expect(auth[0]).to.equal(lendingPoolFilter.address);
    });

    it("Should reject ETH transfer", async function() {
      let data = "0x";
      const isAuthorised = await registry.isAuthorised(wallet.address, lendingPool.address, lendingPool.address, data);
      expect(isAuthorised).to.equal(false);
    });

    it("Should accept calls to deposit", async function() {
      let data = lendingPool.interface.encodeFunctionData("deposit", [token.address, parseEther("0.1"), wallet.address, 0]);
      const isAuthorised = await registry.isAuthorised(wallet.address, lendingPool.address, lendingPool.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should reject calls to deposit when the recipient is not the wallet", async function() {
      let data = lendingPool.interface.encodeFunctionData("deposit", [token.address, parseEther("0.1"), other.address, 0]);
      const isAuthorised = await registry.isAuthorised(wallet.address, lendingPool.address, lendingPool.address, data);
      expect(isAuthorised).to.equal(false);
    });

    it("Should accept calls to withdraw", async function() {
      let data = lendingPool.interface.encodeFunctionData("withdraw", [token.address, parseEther("0.1"), wallet.address]);
      const isAuthorised = await registry.isAuthorised(wallet.address, lendingPool.address, lendingPool.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should reject calls to withdraw when the recipient is not the wallet", async function() {
      let data = lendingPool.interface.encodeFunctionData("withdraw", [token.address, parseEther("0.1"), other.address]);
      const isAuthorised = await registry.isAuthorised(wallet.address, lendingPool.address, lendingPool.address, data);
      expect(isAuthorised).to.equal(false);
    });

    it("Should accept to aprove the Vault on an ERC20", async function() {
    let data = token.interface.encodeFunctionData("approve", [lendingPool.address, parseEther("0.1")]);
    const isAuthorised = await registry.isAuthorised(wallet.address, lendingPool.address, token.address, data);
    expect(isAuthorised).to.equal(true);
    });
  });
});
