const { expect } = require("chai");
const { ethers } = require("hardhat");

const { parseEther } = ethers.utils;

const ERC20_ABI = require('../erc20/abis/erc20.json');

const LIDO_ABI = require('./abis/lido.json');
const LIDO_ADDRESS = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";

const REGISTRY_ID = 0;
const TIMELOCK = 0;

describe("Lido", function() {
  
  let DappRegistry;
  let LidoFilter
  let registry;
  let deployer;
  let wallet;
  let other;
  let erc20;

  before(async function() {
    DappRegistry = await ethers.getContractFactory("DappRegistry");
    LidoFilter = await ethers.getContractFactory("LidoFilter");
    registry = await DappRegistry.deploy(TIMELOCK);
    [deployer, wallet, other] = await ethers.getSigners();
    erc20 = new ethers.Contract(ethers.constants.AddressZero, ERC20_ABI);
  });

  describe("Testing filter for Lido", function() {

    let lido;
    let lidoFilter;

    before(async function() {
      lido = new ethers.Contract(LIDO_ADDRESS, LIDO_ABI, deployer);
      lidoFilter = await LidoFilter.deploy();
      await registry.addDapp(REGISTRY_ID, lido.address, lidoFilter.address);
    });

    it("Should be added to the registry", async function() {
      const auth = await registry.getAuthorisation(0, lido.address);
      expect(auth[0]).to.equal(lidoFilter.address);
    });

    it("Should accept ETH deposits via fallback", async function() {
      let data = "0x";
      const isAuthorised = await registry.isAuthorised(wallet.address, lido.address, lido.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should accept calls to submit", async function() {
        let data = lido.interface.encodeFunctionData("submit", [wallet.address]);
        const isAuthorised = await registry.isAuthorised(wallet.address, lido.address, lido.address, data);
        expect(isAuthorised).to.equal(true);
    });

    it("Should reject calls to approve stETH", async function() {
      let data = erc20.interface.encodeFunctionData("approve", [other.address, parseEther("0.1")]);
      const isAuthorised = await registry.isAuthorised(wallet.address, other.address, lido.address, data);
      expect(isAuthorised).to.equal(false);
    });

    it("Should reject calls to approve ERC20 token when pool is spender", async function() {
        let data = erc20.interface.encodeFunctionData("approve", [lido.address, parseEther("0.1")]);
        const isAuthorised = await registry.isAuthorised(wallet.address, lido.address, erc20.address, data);
        expect(isAuthorised).to.equal(false);
    });
  });
});
