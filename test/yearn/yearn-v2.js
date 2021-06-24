const { expect } = require("chai");
const { ethers } = require("hardhat");

const { parseEther } = ethers.utils;

const ERC20_ABI = require("../erc20/abis/erc20.json");

const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const DAI_VAULT_ABI = require("./abis/yDAIv2.json");
const DAI_VAULT_ADDRESS = "0x19D3364A399d251E894aC732651be8B0E4e85001";

const REGISTRY_ID = 0;
const TIMELOCK = 0;

describe("Yearn V2", function () {
  let DappRegistry;
  let YearnV2Filter;
  let registry;
  let deployer;
  let wallet;
  let other;

  before(async function () {
    [deployer, wallet, other] = await ethers.getSigners();
    DappRegistry = await ethers.getContractFactory("DappRegistry");
    YearnV2Filter = await ethers.getContractFactory("YearnV2Filter");
    registry = await DappRegistry.deploy(TIMELOCK);
  });

  describe("Token Vault", function () {
    let vault;
    let vaultFilter;
    let dai;

    before(async function () {
      vault = new ethers.Contract(DAI_VAULT_ADDRESS, DAI_VAULT_ABI, deployer);
      vaultFilter = await YearnV2Filter.deploy();
      await registry.addDapp(REGISTRY_ID, vault.address, vaultFilter.address);
      dai = new ethers.Contract(DAI, ERC20_ABI);
    });

    it("Should be added to the registry", async function () {
      const auth = await registry.getAuthorisation(0, vault.address);
      expect(auth[0]).to.equal(vaultFilter.address);
    });

    it("Should reject ETH transfer", async function () {
      let data = "0x";
      const isAuthorised = await registry.isAuthorised(wallet.address, vault.address, vault.address, data);
      expect(isAuthorised).to.equal(false);
    });

    it("Should accept to approve the Vault on an ERC20", async function () {
      let data = dai.interface.encodeFunctionData("approve", [vault.address, parseEther("0.1")]);
      const isAuthorised = await registry.isAuthorised(wallet.address, vault.address, dai.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should accept to call deposit (0 arg)", async function () {
      let data = vault.interface.encodeFunctionData("deposit()", []);
      const isAuthorised = await registry.isAuthorised(wallet.address, vault.address, vault.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should accept to call deposit (1 arg)", async function () {
      let data = vault.interface.encodeFunctionData("deposit(uint256)", [parseEther("0.1")]);
      const isAuthorised = await registry.isAuthorised(wallet.address, vault.address, vault.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should accept to call withdraw (0 arg)", async function () {
      let data = vault.interface.encodeFunctionData("withdraw()", []);
      const isAuthorised = await registry.isAuthorised(wallet.address, vault.address, vault.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should accept to call withdraw (1 arg)", async function () {
      let data = vault.interface.encodeFunctionData("withdraw(uint256)", [parseEther("0.1")]);
      const isAuthorised = await registry.isAuthorised(wallet.address, vault.address, vault.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should not accept to call unsupported method", async function () {
      let data = vault.interface.encodeFunctionData("setManagementFee", [0]);
      const isAuthorised = await registry.isAuthorised(wallet.address, vault.address, vault.address, data);
      expect(isAuthorised).to.equal(false);
    });
  });
});
