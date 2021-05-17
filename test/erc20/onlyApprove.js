const { expect } = require("chai");
const { ethers } = require("hardhat");

const { parseEther } = ethers.utils;

const ERC20_ABI = require('../erc20/abis/erc20.json');

const REGISTRY_ID = 0;
const TIMELOCK = 0;

describe("OnlyApprove", function() {
  
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

  describe("Testing filter for Token Proxy", function() {

    let tokenProxy;
    let onlyApproveFilter;

    before(async function() {
      tokenProxy = (await ethers.getSigners())[3]; // simulate a token proxy contract
      onlyApproveFilter = await OnlyApproveFilter.deploy();
      await registry.addDapp(REGISTRY_ID, tokenProxy.address, onlyApproveFilter.address);
    });

    it("Should be added to the registry", async function() {
      const auth = await registry.getAuthorisation(0, tokenProxy.address);
      expect(auth[0]).to.equal(onlyApproveFilter.address);
    });

    it("Should accept calls to approve", async function() {
      let data = erc20.interface.encodeFunctionData("approve", [tokenProxy.address, parseEther("0.1")]);
      const isAuthorised = await registry.isAuthorised(wallet.address, tokenProxy.address, erc20.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should reject calls to transfer", async function() {
      let data = erc20.interface.encodeFunctionData("transfer", [tokenProxy.address, parseEther("0.1")]);
      const isAuthorised = await registry.isAuthorised(wallet.address, tokenProxy.address, erc20.address, data);
      expect(isAuthorised).to.equal(false);
    });
  });
});
