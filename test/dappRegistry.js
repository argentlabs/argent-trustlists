const { expect } = require("chai");
const { ethers } = require("hardhat");

const { parseEther } = ethers.utils;

const ERC20_ABI = require('./abis/erc20.json');

const REGISTRY_ID = 0;
const TIMELOCK = 0;

describe("DappRegistry", function() {
  
  let DappRegistry;
  let OnlyApproveFilter
  let registry;
  let deployer;
  let wallet;
  let other;
  let erc20;

  before(async function() {
    DappRegistry = await ethers.getContractFactory("DappRegistry");
    OnlyApproveFilter = await ethers.getContractFactory("OnlyApproveFilter");
    registry = await DappRegistry.deploy(TIMELOCK);
    [deployer, wallet, other] = await ethers.getSigners();
    erc20 = new ethers.Contract(ethers.constants.AddressZero, ERC20_ABI);
  });

  describe("DappRegistry management", function() {

    it("Should change the timelock", async function() {
      const auth = await registry.getAuthorisation(0, tokenProxy.address);
      expect(auth[0]).to.equal(onlyApproveFilter.address);
    });
  });

  describe("Trustlist management", function() {

    it("Should change the timelock", async function() {
      const auth = await registry.getAuthorisation(0, tokenProxy.address);
      expect(auth[0]).to.equal(onlyApproveFilter.address);
    });
  });

  describe("Filter management", function() {

    it("Should change the timelock", async function() {
      const auth = await registry.getAuthorisation(0, tokenProxy.address);
      expect(auth[0]).to.equal(onlyApproveFilter.address);
    });
  });
});
