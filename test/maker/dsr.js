const { expect } = require("chai");
const { ethers } = require("hardhat");

const { parseEther } = ethers.utils;

const ERC20_ABI = require('../erc20/abis/erc20.json');

const VAT_ABI = require('./abis/vat.json');
const POT_ABI = require('./abis/pot.json');
const DAIJOIN_ABI = require('./abis/daiJoin.json');
const VAT_ADDRESS = "0x35D1b3F3D7966A1DFe207aa4514C12a259A0492B";
const POT_ADDRESS = "0x197e90f9fad81970ba7976f33cbd77088e5d7cf7";
const DAIJOIN_ADDRESS = "0x9759A6Ac90977b93B58547b4A71c78317f391A28";


const REGISTRY_ID = 0;
const TIMELOCK = 0;

describe("DSR", function () {

  let registry;
  let deployer;
  let wallet;
  let other;
  let erc20;

  before(async function () {
    const DappRegistry = await ethers.getContractFactory("DappRegistry");
    registry = await DappRegistry.deploy(TIMELOCK);
    [deployer, wallet, other] = await ethers.getSigners();
    erc20 = new ethers.Contract(ethers.constants.AddressZero, ERC20_ABI);
  });

  describe("Testing Vat filter", function () {

    let vat;
    let vatFilter;

    before(async function () {
      vat = new ethers.Contract(VAT_ADDRESS, VAT_ABI);
      const VatFilter = await ethers.getContractFactory("VatFilter");
      vatFilter = await VatFilter.deploy(DAIJOIN_ADDRESS, POT_ADDRESS);
      await registry.addDapp(REGISTRY_ID, vat.address, vatFilter.address);
    });

    it("Should be added to the registry", async function () {
      const auth = await registry.getAuthorisation(0, vat.address);
      expect(auth[0]).to.equal(vatFilter.address);
    });

    it("Should reject ETH transfer", async function () {
      const isAuthorised = await registry.isAuthorised(wallet.address, vat.address, vat.address, "0x");
      expect(isAuthorised).to.equal(false);
    });

    it("Should accept calls to hope when hoped is pot or daiJoin", async function () {
      let data = vat.interface.encodeFunctionData("hope", [POT_ADDRESS]);
      expect(await registry.isAuthorised(wallet.address, vat.address, vat.address, data)).to.equal(true);
      data = vat.interface.encodeFunctionData("hope", [DAIJOIN_ADDRESS]);
      expect(await registry.isAuthorised(wallet.address, vat.address, vat.address, data)).to.equal(true);
      data = vat.interface.encodeFunctionData("hope", [other.address]);
      expect(await registry.isAuthorised(wallet.address, vat.address, vat.address, data)).to.equal(false);
    });

    it("Should block approving ERC20 tokens on vat", async function() {
      let data = erc20.interface.encodeFunctionData("approve", [vat.address, parseEther("0.1")]);
      const isAuthorised = await registry.isAuthorised(wallet.address, vat.address, erc20.address, data);
      expect(isAuthorised).to.equal(false);
    });
  });

  describe("Testing Pot filter", function () {

    let pot;
    let potFilter;

    before(async function () {
      pot = new ethers.Contract(POT_ADDRESS, POT_ABI);
      const PotFilter = await ethers.getContractFactory("PotFilter");
      potFilter = await PotFilter.deploy();
      await registry.addDapp(REGISTRY_ID, pot.address, potFilter.address);
    });

    it("Should be added to the registry", async function () {
      const auth = await registry.getAuthorisation(0, pot.address);
      expect(auth[0]).to.equal(potFilter.address);
    });

    it("Should reject ETH transfer", async function () {
      const isAuthorised = await registry.isAuthorised(wallet.address, pot.address, pot.address, "0x");
      expect(isAuthorised).to.equal(false);
    });

    it("Should accept calls to join", async function () {
      let data = pot.interface.encodeFunctionData("join", [parseEther("0.1")]);
      expect(await registry.isAuthorised(wallet.address, pot.address, pot.address, data)).to.equal(true);
    });

    it("Should accept calls to exit", async function () {
      let data = pot.interface.encodeFunctionData("exit", [parseEther("0.1")]);
      expect(await registry.isAuthorised(wallet.address, pot.address, pot.address, data)).to.equal(true);
    });

    it("Should accept calls to draw", async function () {
      let data = pot.interface.encodeFunctionData("drip", []);
      expect(await registry.isAuthorised(wallet.address, pot.address, pot.address, data)).to.equal(true);
    });
  });

  describe("Testing DaiJoin filter", function () {

    let daiJoin;
    let daiJoinFilter;

    before(async function () {
      daiJoin = new ethers.Contract(DAIJOIN_ADDRESS, DAIJOIN_ABI);
      const DaiJoinFilter = await ethers.getContractFactory("DaiJoinFilter");
      daiJoinFilter = await DaiJoinFilter.deploy();
      await registry.addDapp(REGISTRY_ID, daiJoin.address, daiJoinFilter.address);
    });

    it("Should be added to the registry", async function () {
      const auth = await registry.getAuthorisation(0, daiJoin.address);
      expect(auth[0]).to.equal(daiJoinFilter.address);
    });

    it("Should reject ETH transfer", async function () {
      const isAuthorised = await registry.isAuthorised(wallet.address, daiJoin.address, daiJoin.address, "0x");
      expect(isAuthorised).to.equal(false);
    });

    it("Should accept calls to join and exit when the recipient is the wallet", async function () {
      let data = daiJoin.interface.encodeFunctionData("join", [wallet.address, parseEther("0.1")]);
      expect(await registry.isAuthorised(wallet.address, daiJoin.address, daiJoin.address, data)).to.equal(true);
      data = daiJoin.interface.encodeFunctionData("exit", [wallet.address, parseEther("0.1")]);
      expect(await registry.isAuthorised(wallet.address, daiJoin.address, daiJoin.address, data)).to.equal(true);
    });

    it("Should reject calls to join and exit when the recipient is not the wallet", async function () {
      let data = daiJoin.interface.encodeFunctionData("join", [other.address, parseEther("0.1")]);
      expect(await registry.isAuthorised(wallet.address, daiJoin.address, daiJoin.address, data)).to.equal(false);
      data = daiJoin.interface.encodeFunctionData("exit", [other.address, parseEther("0.1")]);
      expect(await registry.isAuthorised(wallet.address, daiJoin.address, daiJoin.address, data)).to.equal(false);
    });

    it("Should accept calls to approve", async function () {
      let data = erc20.interface.encodeFunctionData("approve", [daiJoin.address, parseEther("0.1")]);
      const isAuthorised = await registry.isAuthorised(wallet.address, daiJoin.address, erc20.address, data);
      expect(isAuthorised).to.equal(true);
    });
  });
});
