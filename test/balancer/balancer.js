const { expect } = require("chai");
const { ethers } = require("hardhat");

const { parseEther } = ethers.utils;

const ERC20_ABI = require('../erc20/abis/erc20.json');
const POOL_ABI = require('./abis/bpool.json');
const POOL_ADDRESS = "0x1eff8af5d577060ba4ac8a29a13525bb0ee2a3d5";

const REGISTRY_ID = 0;
const TIMELOCK = 0;

describe("Balancer", function() {
  
  let DappRegistry;
  let BalancerFilter
  let registry;
  let deployer;
  let wallet;
  let other;
  let tokenA;

  before(async function() {
    DappRegistry = await ethers.getContractFactory("DappRegistry");
    BalancerFilter = await ethers.getContractFactory("BalancerFilter");
    registry = await DappRegistry.deploy(TIMELOCK);
    [deployer, wallet, other] = await ethers.getSigners();
    tokenA = new ethers.Contract(ethers.constants.AddressZero, ERC20_ABI);
  });

  describe("Testing filter for BPool", function() {

    let pool;
    let balancerFilter;

    before(async function() {
      pool = new ethers.Contract(POOL_ADDRESS, POOL_ABI, deployer);
      balancerFilter = await BalancerFilter.deploy();
      await registry.addDapp(REGISTRY_ID, pool.address, balancerFilter.address);
    });

    it("Should be added to the registry", async function() {
      const auth = await registry.getAuthorisation(0, pool.address);
      expect(auth[0]).to.equal(balancerFilter.address);
    });

    it("Should accept calls to join", async function() {
      let data = pool.interface.encodeFunctionData("joinswapExternAmountIn", [tokenA.address, parseEther("0.1"), 1]);
      const isAuthorised = await registry.isAuthorised(wallet.address, pool.address, pool.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should accept calls to exit from token amount", async function() {
        let data = pool.interface.encodeFunctionData("exitswapExternAmountOut", [tokenA.address, parseEther("0.1"), parseEther("1")]);
        const isAuthorised = await registry.isAuthorised(wallet.address, pool.address, pool.address, data);
        expect(isAuthorised).to.equal(true);
    });

    it("Should accept calls to exit from LP amount", async function() {
        let data = pool.interface.encodeFunctionData("exitswapPoolAmountIn", [tokenA.address, parseEther("0.1"), 1]);
        const isAuthorised = await registry.isAuthorised(wallet.address, pool.address, pool.address, data);
        expect(isAuthorised).to.equal(true);
    });

    it("Should accept calls to approve underlying when pool is spender", async function() {
        let data = tokenA.interface.encodeFunctionData("approve", [pool.address, parseEther("0.1")]);
        const isAuthorised = await registry.isAuthorised(wallet.address, pool.address, tokenA.address, data);
        expect(isAuthorised).to.equal(true);
    });

    it("Should reject calls to transfer LP token", async function() {
      let data = tokenA.interface.encodeFunctionData("transfer", [other.address, parseEther("0.1")]);
      const isAuthorised = await registry.isAuthorised(wallet.address, other.address, pool.address, data);
      expect(isAuthorised).to.equal(false);
    });
  });
});
