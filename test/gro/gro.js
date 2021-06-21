const { expect } = require("chai");
const { ethers } = require("hardhat");

const { parseEther } = ethers.utils;

const ZERO_ADDRESS = ethers.constants.AddressZero;

const ERC20_ABI = require("../erc20/abis/erc20.json");
const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const DEPOSIT_HANDLER_ABI = require("./abis/depositHandler.json");
const WITHDRAW_HANDLER_ABI = require("./abis/withdrawHandler.json");
const DEPOSIT_HANDLER_ADDRESS = "0x79b14d909381D79B655C0700d0fdc2C7054635b9";
const WITHDRAW_HANDLER_ADDRESS = "0xd89512Bdf570476310DE854Ef69D715E0e85B09F";

const REGISTRY_ID = 0;
const TIMELOCK = 0;

describe("Gro", function () {
  let DappRegistry;
  let DepositFilter;
  let WithdrawFilter;
  let registry;
  let deployer;
  let wallet;
  let other;

  let depositHandler;
  let withdrawHandler;

  let dai;

  before(async function () {
    [deployer, wallet, other] = await ethers.getSigners();
    DappRegistry = await ethers.getContractFactory("DappRegistry");
    registry = await DappRegistry.deploy(TIMELOCK);

    DepositFilter = await ethers.getContractFactory("GroDepositFilter");
    WithdrawFilter = await ethers.getContractFactory("GroWithdrawFilter");

    depositHandler = new ethers.Contract(DEPOSIT_HANDLER_ADDRESS, DEPOSIT_HANDLER_ABI, deployer);
    withdrawHandler = new ethers.Contract(WITHDRAW_HANDLER_ADDRESS, WITHDRAW_HANDLER_ABI, deployer);
    dai = new ethers.Contract(DAI, ERC20_ABI);

    const depositFilter = await DepositFilter.deploy();
    const withdrawFilter = await WithdrawFilter.deploy();
    await registry.addDapp(REGISTRY_ID, depositHandler.address, depositFilter.address);
    await registry.addDapp(REGISTRY_ID, withdrawHandler.address, withdrawFilter.address);
  });

  it("Should be added to the registry", async function () {
    let auth = await registry.getAuthorisation(0, depositHandler.address);
    expect(auth[0]).to.not.equal(ZERO_ADDRESS);
    auth = await registry.getAuthorisation(0, withdrawHandler.address);
    expect(auth[0]).to.not.equal(ZERO_ADDRESS);
  });

  it("Should reject ETH transfer", async function () {
    const data = "0x";
    let isAuthorised = await registry.isAuthorised(wallet.address, depositHandler.address, depositHandler.address, data);
    expect(isAuthorised).to.equal(false);
    isAuthorised = await registry.isAuthorised(wallet.address, withdrawHandler.address, withdrawHandler.address, data);
    expect(isAuthorised).to.equal(false);
  });

  it("Should accept to approve the deposit handler on an ERC20", async function () {
    const data = dai.interface.encodeFunctionData("approve", [depositHandler.address, parseEther("0.1")]);
    const isAuthorised = await registry.isAuthorised(wallet.address, depositHandler.address, dai.address, data);
    expect(isAuthorised).to.equal(true);
  });

  it("Should accept to call depositGvt", async function () {
    const data = depositHandler.interface.encodeFunctionData("depositGvt(uint256[],uint256,address)", [[parseEther("0.1"), 0, 0], 1, ZERO_ADDRESS]);
    const isAuthorised = await registry.isAuthorised(wallet.address, depositHandler.address, depositHandler.address, data);
    expect(isAuthorised).to.equal(true);
  });

  it("Should accept to call depositPwrd", async function () {
    const data = depositHandler.interface.encodeFunctionData("depositPwrd(uint256[],uint256,address)", [[parseEther("0.1"), 0, 0], 1, ZERO_ADDRESS]);
    const isAuthorised = await registry.isAuthorised(wallet.address, depositHandler.address, depositHandler.address, data);
    expect(isAuthorised).to.equal(true);
  });

  it("Should accept to call withdrawByLPToken", async function () {
    const data = withdrawHandler.interface.encodeFunctionData("withdrawByLPToken(bool,uint256,uint256[])", [true, parseEther("0.1"), [1, 1, 1]]);
    const isAuthorised = await registry.isAuthorised(wallet.address, withdrawHandler.address, withdrawHandler.address, data);
    expect(isAuthorised).to.equal(true);
  });

  it("Should accept to call withdrawByStablecoin", async function () {
    const data = withdrawHandler.interface.encodeFunctionData("withdrawByStablecoin(bool,uint256,uint256,uint256)", [true, 0, parseEther("0.1"), 1]);
    const isAuthorised = await registry.isAuthorised(wallet.address, withdrawHandler.address, withdrawHandler.address, data);
    expect(isAuthorised).to.equal(true);
  });

  it("Should accept to call withdrawAllSingle", async function () {
    const data = withdrawHandler.interface.encodeFunctionData("withdrawAllSingle(bool,uint256,uint256)", [true, 0, 1]);
    const isAuthorised = await registry.isAuthorised(wallet.address, withdrawHandler.address, withdrawHandler.address, data);
    expect(isAuthorised).to.equal(true);
  });

  it("Should accept to call withdrawAllBalanced", async function () {
    const data = withdrawHandler.interface.encodeFunctionData("withdrawAllBalanced(bool,uint256[])", [true, [1, 1, 1]]);
    const isAuthorised = await registry.isAuthorised(wallet.address, withdrawHandler.address, withdrawHandler.address, data);
    expect(isAuthorised).to.equal(true);
  });

  it("Should not accept to call unsupported method (deposits)", async function () {
    const data = depositHandler.interface.encodeFunctionData("referral", [ZERO_ADDRESS]);
    const isAuthorised = await registry.isAuthorised(wallet.address, depositHandler.address, depositHandler.address, data);
    expect(isAuthorised).to.equal(false);
  });
  it("Should not accept to call unsupported method (withdrawals)", async function () {
    const data = withdrawHandler.interface.encodeFunctionData("withdrawalFee", [true]);
    const isAuthorised = await registry.isAuthorised(wallet.address, withdrawHandler.address, withdrawHandler.address, data);
    expect(isAuthorised).to.equal(false);
  });
});
