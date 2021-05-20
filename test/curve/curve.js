const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

const { parseEther } = ethers.utils;

const STETH_POOL_ABI = require('./abis/stEth.json');
const STETH_POOL_ADDRESS = "0xDC24316b9AE028F1497c275EB9192a3Ea0f67022";

const SUSD_POOL_ABI = require('./abis/sUsd.json');
const SUSD_POOL_ADDRESS = "0xA5407eAE9Ba41422680e2e00537571bcC53efBfD";

const ERC20_ABI = require('../erc20/abis/erc20.json');

const REGISTRY_ID = 0;
const TIMELOCK = 0;

describe("Curve", function() {
  
  let DappRegistry;
  let CurveFilter;
  let registry;
  let deployer;
  let wallet;
  let other;
  let erc20;

  before(async function() {
    DappRegistry = await ethers.getContractFactory("DappRegistry");
    CurveFilter = await ethers.getContractFactory("CurveFilter");
    registry = await DappRegistry.deploy(TIMELOCK);
    [deployer, wallet, other] = await ethers.getSigners();
    erc20 = new ethers.Contract(ethers.constants.AddressZero, ERC20_ABI);
  });

  describe("Testing filter for stEth pool", function() {

    let pool;
    let poolFilter;

    before(async function() {
      pool = new ethers.Contract(STETH_POOL_ADDRESS, STETH_POOL_ABI, deployer);
      poolFilter = await CurveFilter.deploy();
      await registry.addDapp(REGISTRY_ID, pool.address, poolFilter.address);
    });

    it("Should be added to the registry", async function() {
      const auth = await registry.getAuthorisation(0,pool.address);
      expect(auth[0]).to.equal(poolFilter.address);
    });

    it("Should accept to exchange", async function() {
      let data = pool.interface.encodeFunctionData("exchange", [1, 0, 99, 1]);
      const isAuthorised = await registry.isAuthorised(wallet.address, pool.address, pool.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should accept to aprove the pool on an ERC20 underlying", async function() {
      let data = erc20.interface.encodeFunctionData("approve", [pool.address, parseEther("0.1")]);
      const isAuthorised = await registry.isAuthorised(wallet.address, pool.address, erc20.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should reject ETH transfer to the pool", async function() {
      const isAuthorised = await registry.isAuthorised(wallet.address, pool.address, pool.address, "0x");
      expect(isAuthorised).to.equal(false);
    });
  });

  describe("Testing filter for sUsd pool", function() {

    let pool;
    let poolFilter;

    before(async function() {
      pool = new ethers.Contract(SUSD_POOL_ADDRESS, SUSD_POOL_ABI, deployer);
      poolFilter = await CurveFilter.deploy();
      await registry.addDapp(REGISTRY_ID, pool.address, poolFilter.address);
    });

    it("Should be added to the registry", async function() {
      const auth = await registry.getAuthorisation(0,pool.address);
      expect(auth[0]).to.equal(poolFilter.address);
    });

    it("Should accept to exchange", async function() {
      let data = pool.interface.encodeFunctionData("exchange", [1, 0, 99, 1]);
      const isAuthorised = await registry.isAuthorised(wallet.address, pool.address, pool.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should accept to exchange underlying", async function() {
      let data = pool.interface.encodeFunctionData("exchange_underlying", [1, 0, 99, 1]);
      const isAuthorised = await registry.isAuthorised(wallet.address, pool.address, pool.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should accept to aprove the pool on an ERC20 underlying", async function() {
      let data = erc20.interface.encodeFunctionData("approve", [pool.address, parseEther("0.1")]);
      const isAuthorised = await registry.isAuthorised(wallet.address, pool.address, erc20.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should reject ETH transfer to the pool", async function() {
      const isAuthorised = await registry.isAuthorised(wallet.address, pool.address, pool.address, "0x");
      expect(isAuthorised).to.equal(false);
    });
  });
});
