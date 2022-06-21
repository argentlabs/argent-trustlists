const { expect } = require("chai");
const { ethers } = require("hardhat");

const { parseEther } = ethers.utils;

const ERC20_ABI = require('../erc20/abis/erc20.json');

const UNI_FACTORY = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const UNI_INIT_CODE = "0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f";
const WETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const USDC_ETH_PAIR = "0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc";
const ETH_USDT_PAIR = "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852";

const UNIZAP_ABI = require('./abis/unizap.json');
const UNIZAP_ADDRESS = "0xbCc492DF37bD4ec651D46d72230E340c9ec1950c";

const REGISTRY_ID = 0;
const TIMELOCK = 0;

describe("Uniswap", function() {
  
  let DappRegistry;
  let TokenRegistry;
  let UnizapFilter
  let registry;
  let deployer;
  let wallet;
  let other;
  let tradablePair;
  let nonTradablePair;
  let unizap;
  let unizapFilter;

  before(async function() {
    [deployer, wallet, other] = await ethers.getSigners();
    DappRegistry = await ethers.getContractFactory("DappRegistry");
    TokenRegistry = await ethers.getContractFactory("TokenRegistry");
    UnizapFilter = await ethers.getContractFactory("UniswapV2UniZapFilter");
    registry = await DappRegistry.deploy(TIMELOCK);
    tokenRegistry = await TokenRegistry.deploy();
    tradablePair = new ethers.Contract(USDC_ETH_PAIR, ERC20_ABI);
    nonTradablePair = new ethers.Contract(ETH_USDT_PAIR, ERC20_ABI);
    await tokenRegistry.setTradableForTokenList([tradablePair.address, nonTradablePair.address], [true, false]);
    unizap = new ethers.Contract(UNIZAP_ADDRESS, UNIZAP_ABI, deployer);
    unizapFilter = await UnizapFilter.deploy(tokenRegistry.address, UNI_FACTORY, UNI_INIT_CODE, WETH);
    await registry.addDapp(REGISTRY_ID, unizap.address, unizapFilter.address);
  });

  describe("Adding liquidity", function() {

    it("Should accept to add liquidity with ETH", async function() {
        const deadline = 10;
        let data = unizap.interface.encodeFunctionData("swapExactETHAndAddLiquidity", [USDC, 1, wallet.address, deadline]);
        const isAuthorised = await registry.isAuthorised(wallet.address, unizap.address, unizap.address, data);
        expect(isAuthorised).to.equal(true);
    });

    it("Should reject to add liquidity with ETH when the recipient is not the wallet", async function() {
      const deadline = 10;
      let data = unizap.interface.encodeFunctionData("swapExactETHAndAddLiquidity", [USDC, 1, other.address, deadline]);
      const isAuthorised = await registry.isAuthorised(wallet.address, unizap.address, unizap.address, data);
      expect(isAuthorised).to.equal(false);
    });

    it("Should reject to add liquidity with ETH when the pair is not tradable", async function() {
      const deadline = 10;
      let data = unizap.interface.encodeFunctionData("swapExactETHAndAddLiquidity", [USDT, 1, wallet.address, deadline]);
      const isAuthorised = await registry.isAuthorised(wallet.address, unizap.address, unizap.address, data);
      expect(isAuthorised).to.equal(false);
    });

    it("Should accept to add liquidity with the token", async function() {
      const deadline = 10;
      let data = unizap.interface.encodeFunctionData("swapExactTokensAndAddLiquidity", [USDC, WETH, parseEther("0.1"), 1, wallet.address, deadline]);
      const isAuthorised = await registry.isAuthorised(wallet.address, unizap.address, unizap.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should reject to add liquidity with the token when the recipient is not the wallet", async function() {
      const deadline = 10;
      let data = unizap.interface.encodeFunctionData("swapExactTokensAndAddLiquidity", [USDC, WETH, parseEther("0.1"), 1, other.address, deadline]);
      const isAuthorised = await registry.isAuthorised(wallet.address, unizap.address, unizap.address, data);
      expect(isAuthorised).to.equal(false);
    });

    it("Should reject to add liquidity with the token when the pair is not tradable", async function() {
      const deadline = 10;
      let data = unizap.interface.encodeFunctionData("swapExactTokensAndAddLiquidity", [USDT, WETH, parseEther("0.1"), 1, wallet.address, deadline]);
      const isAuthorised = await registry.isAuthorised(wallet.address, unizap.address, unizap.address, data);
      expect(isAuthorised).to.equal(false);
    });
  });

  describe("Removing liquidity", function() {

    it("Should accept to remove liquidity to ETH", async function() {
        const deadline = 10;
        let data = unizap.interface.encodeFunctionData("removeLiquidityAndSwapToETH", [USDC, parseEther("0.1"), 1, wallet.address, deadline]);
        const isAuthorised = await registry.isAuthorised(wallet.address, unizap.address, unizap.address, data);
        expect(isAuthorised).to.equal(true);
    });

    it("Should reject to remove liquidity to ETH when the recipient is not the wallet", async function() {
      const deadline = 10;
      let data = unizap.interface.encodeFunctionData("removeLiquidityAndSwapToETH", [USDC, parseEther("0.1"), 1, other.address, deadline]);
      const isAuthorised = await registry.isAuthorised(wallet.address, unizap.address, unizap.address, data);
      expect(isAuthorised).to.equal(false);
    });

    it("Should reject to remove liquidity to ETH when the pair is not tradable", async function() {
      const deadline = 10;
      let data = unizap.interface.encodeFunctionData("removeLiquidityAndSwapToETH", [USDT, parseEther("0.1"), 1, wallet.address, deadline]);
      const isAuthorised = await registry.isAuthorised(wallet.address, unizap.address, unizap.address, data);
      expect(isAuthorised).to.equal(false);
    });

    it("Should accept to remove liquidity to the token", async function() {
      const deadline = 10;
      let data = unizap.interface.encodeFunctionData("removeLiquidityAndSwapToToken", [WETH, USDC, parseEther("0.1"), 1, wallet.address, deadline]);
      const isAuthorised = await registry.isAuthorised(wallet.address, unizap.address, unizap.address, data);
      expect(isAuthorised).to.equal(true);
    });

    it("Should reject to remove liquidity to the token when the recipient is not the wallet", async function() {
      const deadline = 10;
      let data = unizap.interface.encodeFunctionData("removeLiquidityAndSwapToToken", [WETH, USDC, parseEther("0.1"), 1, other.address, deadline]);
      const isAuthorised = await registry.isAuthorised(wallet.address, unizap.address, unizap.address, data);
      expect(isAuthorised).to.equal(false);
    });

    it("Should reject to remove liquidity to the token when the pair is not tradable", async function() {
      const deadline = 10;
      let data = unizap.interface.encodeFunctionData("removeLiquidityAndSwapToToken", [WETH, USDT, parseEther("0.1"), 1, wallet.address, deadline]);
      const isAuthorised = await registry.isAuthorised(wallet.address, unizap.address, unizap.address, data);
      expect(isAuthorised).to.equal(false);
    });
  });

  describe("Other", function() {

    it("Should be added to the registry", async function() {
      const auth = await registry.getAuthorisation(0, unizap.address);
      expect(auth[0]).to.equal(unizapFilter.address);
    });

    it("Should reject ETH transfer", async function() {
      let data = "0x";
      const isAuthorised = await registry.isAuthorised(wallet.address, unizap.address, unizap.address, data);
      expect(isAuthorised).to.equal(false);
    });

    it("Should accept to aprove Unizap on an ERC20", async function() {
      let data = tradablePair.interface.encodeFunctionData("approve", [unizap.address, parseEther("0.1")]);
      const isAuthorised = await registry.isAuthorised(wallet.address, unizap.address, tradablePair.address, data);
      expect(isAuthorised).to.equal(true);
    });
  });
});
