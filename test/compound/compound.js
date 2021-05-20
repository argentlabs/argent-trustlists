const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

const { parseEther } = ethers.utils;

const ZERO_ADDRESS = ethers.constants.AddressZero;

const ERC20_ABI = require('../erc20/abis/erc20.json');

const CETH_ABI = require('./abis/cEther.json');
const CETH_ADDRESS = "0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5";
const CDAI_ABI = require('./abis/cDai.json');
const CDAI_ADDRESS = "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643";

const REGISTRY_ID = 0;
const TIMELOCK = 0;

describe("Compound", function() {
  
  let DappRegistry;
  let CompoundCTokenFilter;
  let registry;
  let deployer;
  let wallet;
  let other;

  before(async function() {
    DappRegistry = await ethers.getContractFactory("DappRegistry");
    CompoundCTokenFilter = await ethers.getContractFactory("CompoundCTokenFilter");
    registry = await DappRegistry.deploy(TIMELOCK);
    [deployer, wallet, other] = await ethers.getSigners();
  });

  describe("Testing filter for CETH", function() {

    let cEther;
    let cEthFilter;

    before(async function() {
      cEther = new ethers.Contract(CETH_ADDRESS, CETH_ABI, deployer);
      cEthFilter = await CompoundCTokenFilter.deploy(ZERO_ADDRESS);
      await registry.addDapp(REGISTRY_ID, cEther.address, cEthFilter.address);
    });

    it("Should be added to the registry", async function() {
      const auth = await registry.getAuthorisation(0,cEther.address);
      expect(auth[0]).to.equal(cEthFilter.address);
    });
    
    it("Should accept ETH transfer", async function() {
      const isAuthorised = await registry.isAuthorised(wallet.address, cEther.address, cEther.address, "0x");
      expect(isAuthorised).to.equal(true);
    });

    it("Should accept to mint", async function() {
      let data = cEther.interface.encodeFunctionData("mint", []);
      const isAuthorised = await registry.isAuthorised(wallet.address, cEther.address, cEther.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should accept to redeem", async function() {
      let data = cEther.interface.encodeFunctionData("redeem", [parseEther("0.1")]);
      const isAuthorised = await registry.isAuthorised(wallet.address, cEther.address, cEther.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should accept to redeem underlying", async function() {
      let data = cEther.interface.encodeFunctionData("redeemUnderlying", [parseEther("0.1")]);
      const isAuthorised = await registry.isAuthorised(wallet.address, cEther.address, cEther.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should accept to borrow", async function() {
      let data = cEther.interface.encodeFunctionData("borrow", [parseEther("0.1")]);
      const isAuthorised = await registry.isAuthorised(wallet.address, cEther.address, cEther.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should accept to repay borrow", async function() {
      let data = cEther.interface.encodeFunctionData("repayBorrow", []);
      const isAuthorised = await registry.isAuthorised(wallet.address, cEther.address, cEther.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should reject to repay borrow on behalf", async function() {
      let data = cEther.interface.encodeFunctionData("repayBorrowBehalf", [other.address]);
      const isAuthorised = await registry.isAuthorised(wallet.address, cEther.address, cEther.address, data);
      expect(isAuthorised).to.equal(false);
    });

    it("Should reject ERC20 aprove on cEther", async function() {
      let data = cEther.interface.encodeFunctionData("approve", [other.address, parseEther("0.1")]);
      const isAuthorised = await registry.isAuthorised(wallet.address, other.address, cEther.address, data);
      expect(isAuthorised).to.equal(false);
    });
  });

  describe("Testing filter for CDAI", function() {

    let dai;
    let cDai;
    let cDaiFilter;
    let erc20;

    before(async function() {
      cDai = new ethers.Contract(CDAI_ADDRESS, CDAI_ABI, deployer);
      const daiAddress = await cDai.underlying();
      dai = new ethers.Contract(daiAddress, ERC20_ABI);
      cDaiFilter = await CompoundCTokenFilter.deploy(daiAddress);
      await registry.addDapp(REGISTRY_ID, cDai.address, cDaiFilter.address);
      erc20 = new ethers.Contract(ethers.constants.AddressZero, ERC20_ABI);
    });

    it("Should be added to the registry", async function() {
        const auth = await registry.getAuthorisation(0,cDai.address);
        expect(auth[0]).to.equal(cDaiFilter.address);
      });

    it("Should accept to mint", async function() {
      let data = cDai.interface.encodeFunctionData("mint", [parseEther("0.1")]);
      const isAuthorised = await registry.isAuthorised(wallet.address, cDai.address, cDai.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should accept to redeem", async function() {
      let data = cDai.interface.encodeFunctionData("redeem", [parseEther("0.1")]);
      const isAuthorised = await registry.isAuthorised(wallet.address, cDai.address, cDai.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should accept to redeem underlying", async function() {
      let data = cDai.interface.encodeFunctionData("redeemUnderlying", [parseEther("0.1")]);
      const isAuthorised = await registry.isAuthorised(wallet.address, cDai.address, cDai.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should accept to borrow", async function() {
      let data = cDai.interface.encodeFunctionData("borrow", [parseEther("0.1")]);
      const isAuthorised = await registry.isAuthorised(wallet.address, cDai.address, cDai.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should accept to repay borrow", async function() {
      let data = cDai.interface.encodeFunctionData("repayBorrow", [parseEther("0.1")]);
      const isAuthorised = await registry.isAuthorised(wallet.address, cDai.address, cDai.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should reject to repay borrow on behalf", async function() {
      let data = cDai.interface.encodeFunctionData("repayBorrowBehalf", [other.address, parseEther("0.1")]);
      const isAuthorised = await registry.isAuthorised(wallet.address, cDai.address, cDai.address, data);
      expect(isAuthorised).to.equal(false);
    });

    it("Should reject ERC20 aprove on cDai", async function() {
      let data = cDai.interface.encodeFunctionData("approve", [other.address, parseEther("0.1")]);
      const isAuthorised = await registry.isAuthorised(wallet.address, other.address, cDai.address, data);
      expect(isAuthorised).to.equal(false);
    });

    it("Should accept to aprove the cDAI contract on the DAI token", async function() {
      let data = dai.interface.encodeFunctionData("approve", [cDai.address, parseEther("0.1")]);
      const isAuthorised = await registry.isAuthorised(wallet.address, cDai.address, dai.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should reject to aprove the cDAI contract on another ERC20 token", async function() {
      let data = erc20.interface.encodeFunctionData("approve", [cDai.address, parseEther("0.1")]);
      const isAuthorised = await registry.isAuthorised(wallet.address, cDai.address, erc20.address, data);
      expect(isAuthorised).to.equal(false);
    });

    it("Should reject ETH transfer", async function() {
      const isAuthorised = await registry.isAuthorised(wallet.address, cDai.address, cDai.address, "0x");
      expect(isAuthorised).to.equal(false);
    });
  });
});
