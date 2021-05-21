const { expect } = require("chai");
const { ethers } = require("hardhat");

const { parseEther } = ethers.utils;

const ERC20_ABI = require('../erc20/abis/erc20.json');

const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const DAI_VAULT_ABI = require('./abis/yDAI.json');
const DAI_VAULT_ADDRESS = "0xACd43E627e64355f1861cEC6d3a6688B31a6F952";

const WETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const WETH_VAULT_ABI = require('./abis/yWETH.json');
const WETH_VAULT_ADDRESS = "0xe1237aA7f535b0CC33Fd973D66cBf830354D16c7";

const REGISTRY_ID = 0;
const TIMELOCK = 0;

describe("Yearn V1", function() {
  
  let DappRegistry;
  let YearnFilter
  let registry;
  let deployer;
  let wallet;
  let other;

  before(async function() {
    [deployer, wallet, other] = await ethers.getSigners();
    DappRegistry = await ethers.getContractFactory("DappRegistry");
    YearnFilter = await ethers.getContractFactory("YearnFilter");
    registry = await DappRegistry.deploy(TIMELOCK);
  });

  describe("WETH vault", function() {

    let vault;
    let vaultFilter;
    let weth;

    before(async function() {
      vault = new ethers.Contract(WETH_VAULT_ADDRESS, WETH_VAULT_ABI, deployer);
      vaultFilter = await YearnFilter.deploy(true);
      await registry.addDapp(REGISTRY_ID, vault.address, vaultFilter.address);
      weth = new ethers.Contract(WETH, ERC20_ABI);
    });

    it("Should be added to the registry", async function() {
      const auth = await registry.getAuthorisation(0, vault.address);
      expect(auth[0]).to.equal(vaultFilter.address);
    });

    it("Should accept ETH transfer", async function() {
      let data = "0x";
      const isAuthorised = await registry.isAuthorised(wallet.address, vault.address, vault.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should accept to aprove Vault on WETH", async function() {
      let data = weth.interface.encodeFunctionData("approve", [vault.address, parseEther("0.1")]);
      const isAuthorised = await registry.isAuthorised(wallet.address, vault.address, weth.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should accept to call deposit", async function() {
        let data = vault.interface.encodeFunctionData("deposit", [parseEther("0.1")]);
        const isAuthorised = await registry.isAuthorised(wallet.address, vault.address, vault.address, data);
        expect(isAuthorised).to.equal(true);
    });

    it("Should accept to call depositETH", async function() {
      let data = vault.interface.encodeFunctionData("depositETH", []);
      const isAuthorised = await registry.isAuthorised(wallet.address, vault.address, vault.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should accept to call withdraw", async function() {
      let data = vault.interface.encodeFunctionData("withdraw", [parseEther("0.1")]);
      const isAuthorised = await registry.isAuthorised(wallet.address, vault.address, vault.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should accept to call withdrawETH", async function() {
      let data = vault.interface.encodeFunctionData("withdrawETH", [parseEther("0.1")]);
      const isAuthorised = await registry.isAuthorised(wallet.address, vault.address, vault.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should accept to call withdrawAll", async function() {
      let data = vault.interface.encodeFunctionData("withdrawAll", []);
      const isAuthorised = await registry.isAuthorised(wallet.address, vault.address, vault.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should accept to call withdrawAllETH", async function() {
      let data = vault.interface.encodeFunctionData("withdrawAllETH", []);
      const isAuthorised = await registry.isAuthorised(wallet.address, vault.address, vault.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should reject to call transfer", async function() {
      let data = vault.interface.encodeFunctionData("transfer", [other.address, parseEther("0.1")]);
      const isAuthorised = await registry.isAuthorised(wallet.address, other.address, vault.address, data);
      expect(isAuthorised).to.equal(false);
    });
  });

  describe("Token Vault", function() {

    let vault;
    let vaultFilter;
    let dai;

    before(async function() {
      vault = new ethers.Contract(DAI_VAULT_ADDRESS, DAI_VAULT_ABI, deployer);
      vaultFilter = await YearnFilter.deploy(false);
      await registry.addDapp(REGISTRY_ID, vault.address, vaultFilter.address);
      dai = new ethers.Contract(DAI, ERC20_ABI);
    });

    it("Should be added to the registry", async function() {
      const auth = await registry.getAuthorisation(0, vault.address);
      expect(auth[0]).to.equal(vaultFilter.address);
    });

    it("Should reject ETH transfer", async function() {
      let data = "0x";
      const isAuthorised = await registry.isAuthorised(wallet.address, vault.address, vault.address, data);
      expect(isAuthorised).to.equal(false);
    });

    it("Should accept to aprove the Vault on an ERC20", async function() {
      let data = dai.interface.encodeFunctionData("approve", [vault.address, parseEther("0.1")]);
      const isAuthorised = await registry.isAuthorised(wallet.address, vault.address, dai.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should accept to call deposit", async function() {
      let data = vault.interface.encodeFunctionData("deposit", [parseEther("0.1")]);
      const isAuthorised = await registry.isAuthorised(wallet.address, vault.address, vault.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should accept to call withdraw", async function() {
      let data = vault.interface.encodeFunctionData("withdraw", [parseEther("0.1")]);
      const isAuthorised = await registry.isAuthorised(wallet.address, vault.address, vault.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should accept to call withdrawAll", async function() {
      let data = vault.interface.encodeFunctionData("withdrawAll", []);
      const isAuthorised = await registry.isAuthorised(wallet.address, vault.address, vault.address, data);
      expect(isAuthorised).to.equal(true);
    });
  });
});
