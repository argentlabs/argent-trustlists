const { expect } = require("chai");
const { ethers } = require("hardhat");

const { parseEther } = ethers.utils;
const { getRouteParams, getParaswappoolData, getSimpleSwapParams, getRoutesForExchange } = require("./sell-helper");

const ZERO_ADDRESS = ethers.constants.AddressZero;

const ERC20_ABI = require("../erc20/abis/erc20.json");
const WETH_ABI = require("../weth/abis/weth.json");
const AUGUSTUS_ABI = require("./abis/augustus.json");
const UNIV1_TARGET_EXCHANGE_ABI = require("./abis/targetExchanges/uniswapV1.json");
const UNIV2_TARGET_EXCHANGE_ABI = require("./abis/targetExchanges/uniswapV2.json");
const UNIV3_TARGET_EXCHANGE_ABI = require("./abis/targetExchanges/uniswapV3.json");
const ZEROEXV2_TARGET_EXCHANGE_ABI = require("./abis/targetExchanges/zeroexV2.json");
const ZEROEXV4_TARGET_EXCHANGE_ABI = require("./abis/targetExchanges/zeroexV4.json");
const CURVE_TARGET_EXCHANGE_ABI = require("./abis/targetExchanges/curve.json");

const USDC = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const WETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const CREAM = "0x2ba592F78dB6436527729929AAf6c908497cB200"; // non-tradable

// UniV3
const UNIV3_FACTORY = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
const UNIV3_INIT_CODE = "0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54";
const UNIV3_FEE = 3000;
const UNIV3_ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
const DAI_WETH_UNIV3_PAIR = "0xC2e9F25Be6257c210d7Adf0D4Cd6E3E881ba25f8";
const USDC_WETH_UNIV3_PAIR = "0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8";
const DAI_USDC_UNIV3_PAIR = "0xa63b490aA077f541c9d64bFc1Cc0db2a752157b5";

// UniV2
const DAI_WETH_UNIV2_PAIR = "0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11";
const USDC_WETH_UNIV2_PAIR = "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc";
const DAI_USDC_UNIV2_PAIR = "0xAE461cA67B15dc8dc81CE7615e0320dA1A9aB8D5";
const UNIV2_FACTORY = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const UNIV2_INIT_CODE = "0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f";

// Sushi
const DAI_WETH_SUSHI_PAIR = "0xC3D03e4F041Fd4cD388c549Ee2A29a9E5075882f";
const USDC_WETH_SUSHI_PAIR = "0x397FF1542f962076d0BFE58eA045FfA2d347ACa0";
const DAI_USDC_SUSHI_PAIR = "0xAaF5110db6e744ff70fB339DE037B990A20bdace";

// UniV1
const UNIV1_FACTORY = "0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95";
const UNIV1_DAI_ETH_POOL = "0x2a1530C4C41db0B0b2bB646CB5Eb1A67b7158667";
const UNIV1_USDC_ETH_POOL = "0x97deC872013f6B5fB443861090ad931542878126";

// Paraswap
const MULTISWAP = "multiSwap((address,uint256,uint256,uint256,address,string,bool,(address,uint256,(address,address,uint256,bytes,uint256)[])[]))";
const SIMPLESWAP = "simpleSwap(address,address,uint256,uint256,uint256,address[],bytes,uint256[],uint256[],address,string,bool)";
const SWAP_ON_UNI = "swapOnUniswap(uint256,uint256,address[],uint8)";
const SWAP_ON_UNI_FORK = "swapOnUniswapFork(address,bytes32,uint256,uint256,address[],uint8)";
const MEGASWAP = "megaSwap((address,uint256,uint256,uint256,address,string,bool,(uint256,(address,uint256,(address,address,uint256,bytes,uint256)[])[])[]))";
const PARASWAP_ETH_TOKEN = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const AUGUSTUS = "0x1bD435F3C054b6e901B7b108a0ab7617C808677b";
const UNISWAP_PROXY = "0x0fcbb36ed7908bd5952ca171584b74bbab283091";
const UNIV2_FORKS = [
  {
    factory: "0xc0aee478e3658e2610c5f7a4a2e1777ce9e4f2ac",
    initCode: "0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303",
    paraswapUniV2Router: "0xBc1315CD2671BC498fDAb42aE1214068003DC51e",
  },
  {
    factory: "0x696708db871b77355d6c2be7290b27cf0bb9b24b",
    initCode: "0x50955d9250740335afc702786778ebeae56a5225e4e18b7cb046e61437cde6b3",
    paraswapUniV2Router: "0xEC4c8110E5B5Bf0ad8aa89e3371d9C3b8CdCD778",
  },
  {
    factory: "0x9deb29c9a4c7a88a3c0257393b7f3335338d9a9d",
    initCode: "0x69d637e77615df9f235f642acebbdad8963ef35c5523142078c9b8f9d0ceba7e",
    paraswapUniV2Router: "0xF806F9972F9A34FC05394cA6CF2cc606297Ca6D5",
  },
];
const ADAPTERS = {
  uniswap: "0x60b64533b9a1865d88758b05b6adfe60426311f2",
  uniswapV2: "0x695725627E04898Ef4a126Ae71FC30aA935c5fb6",
  sushiswap: "0x77Bc1A1ba4E9A6DF5BDB21f2bBC07B9854E8D1a8",
  linkswap: "0x28c4106aadd12a9bb5d795ae717d8aa0b5685277",
  defiswap: "0xdF68D5E9b413075Ff9654fdaBc7c6Ca72f72cfA3",
  zeroexV2: "0xae0eEa652303D174E267e4D51F656254d3039F76",
  zeroexV4: "0x64c3fb89f934592a2d7a5d1aa87c504b4bffe428",
  curve: "0x7B566Ec2B0f914e03e508EA2AE591ea2FaCF713A",
  weth: "0x19C95e4d0bddC5d252d84c2263F81FE1059B7368",
  uniswapV3: "0xbfBFf2938E3bE0fE588FbF6007F1fdE73C5a9A4E",
};
const TARGET_EXCHANGES = {
  uniswap: "0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95",
  uniswapV2: "0x86d3579b043585A97532514016dCF0C2d6C4b6a1",
  uniswapV3: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
  sushiswap: "0xBc1315CD2671BC498fDAb42aE1214068003DC51e",
  linkswap: "0xEC4c8110E5B5Bf0ad8aa89e3371d9C3b8CdCD778",
  defiswap: "0xF806F9972F9A34FC05394cA6CF2cc606297Ca6D5",
  zeroexV2: "0x080bf510fcbf18b91105470639e9561022937712",
  zeroexV4: "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
  curve: ["0x79a8c46dea5ada233abaffd40f3a0a2b1e5a4f27"],
};
const MARKET_MAKERS = ["0x56178a0d5f301baf6cf3e1cd53d9863437345bf9"];
const ZEROEXV2_PROXY = "0x95e6f48254609a6ee006f7d493c8e5fb97094cef";

const REGISTRY_ID = 0;
const TIMELOCK = 0;

describe("Paraswap", function () {
  let wallet;
  let other;
  let deployer;

  let dappRegistry;
  let tokenRegistry;

  let uniswapV1Exchanges = {};
  let uniswapV3Router;
  let zeroExV2TargetExchange;
  let zeroExV4TargetExchange;
  let curvePool;
  let weth;
  let dai;
  let usdc;
  let cream;
  let paraswap;
  let paraswapProxyAddress;
  let paraswapFilter;
  let proxyFilter;
  let paraswapUniV2Router;

  before(async function () {
    [deployer, wallet, other] = await ethers.getSigners();

    const DappRegistry = await ethers.getContractFactory("DappRegistry");
    const TokenRegistry = await ethers.getContractFactory("TokenRegistry");
    const ParaswapFilter = await ethers.getContractFactory("ParaswapFilter");
    const OnlyApproveFilter = await ethers.getContractFactory("OnlyApproveFilter");
    const ParaswapUniV2RouterFilter = await ethers.getContractFactory("ParaswapUniV2RouterFilter");
    const UniswapV3RouterFilter = await ethers.getContractFactory("UniswapV3RouterFilter");
    const ZeroExV2Filter = await ethers.getContractFactory("WhitelistedZeroExV2Filter");
    const ZeroExV4Filter = await ethers.getContractFactory("WhitelistedZeroExV4Filter");
    const WethFilter = await ethers.getContractFactory("WethFilter");
    const CurveFilter = await ethers.getContractFactory("CurveFilter");

    dai = new ethers.Contract(DAI, ERC20_ABI, deployer);
    usdc = new ethers.Contract(USDC, ERC20_ABI, deployer);
    weth = new ethers.Contract(WETH, WETH_ABI, deployer);
    cream = new ethers.Contract(CREAM, ERC20_ABI, deployer);
    paraswap = new ethers.Contract(AUGUSTUS, AUGUSTUS_ABI, deployer);

    const paraswapOwner = await paraswap.owner();
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [paraswapOwner],
    });
    paraswap = paraswap.connect(await ethers.provider.getSigner(paraswapOwner));

    zeroExV2TargetExchange = new ethers.Contract(TARGET_EXCHANGES.zeroexV2, ZEROEXV2_TARGET_EXCHANGE_ABI, deployer);
    zeroExV4TargetExchange = new ethers.Contract(TARGET_EXCHANGES.zeroexV4, ZEROEXV4_TARGET_EXCHANGE_ABI, deployer);
    paraswapUniV2Router = new ethers.Contract(TARGET_EXCHANGES.uniswapV2, UNIV2_TARGET_EXCHANGE_ABI, deployer);
    uniswapV1Exchanges[DAI] = new ethers.Contract(UNIV1_DAI_ETH_POOL, UNIV1_TARGET_EXCHANGE_ABI, deployer);
    uniswapV1Exchanges[USDC] = new ethers.Contract(UNIV1_USDC_ETH_POOL, UNIV1_TARGET_EXCHANGE_ABI, deployer);
    uniswapV3Router = new ethers.Contract(TARGET_EXCHANGES.uniswapV3, UNIV3_TARGET_EXCHANGE_ABI, deployer);
    curvePool = new ethers.Contract(TARGET_EXCHANGES.curve[0], CURVE_TARGET_EXCHANGE_ABI, deployer);

    dappRegistry = await DappRegistry.deploy(TIMELOCK);
    tokenRegistry = await TokenRegistry.deploy();

    const pairs = [
      DAI_USDC_UNIV3_PAIR,
      USDC_WETH_UNIV3_PAIR,
      DAI_WETH_UNIV3_PAIR,
      DAI_USDC_UNIV2_PAIR,
      USDC_WETH_UNIV2_PAIR,
      DAI_WETH_UNIV2_PAIR,
      DAI_WETH_SUSHI_PAIR,
      USDC_WETH_SUSHI_PAIR,
      DAI_USDC_SUSHI_PAIR,
      UNIV1_DAI_ETH_POOL,
      UNIV1_USDC_ETH_POOL,
    ];
    await tokenRegistry.setTradableForTokenList([DAI, USDC, WETH, ...pairs], Array(3 + pairs.length).fill(true));

    proxyFilter = await OnlyApproveFilter.deploy();
    paraswapFilter = await ParaswapFilter.deploy(
      tokenRegistry.address,
      dappRegistry.address,
      AUGUSTUS,
      UNISWAP_PROXY,
      [...UNIV2_FORKS.map((f) => f.factory), UNIV3_FACTORY],
      [...UNIV2_FORKS.map((f) => f.initCode), UNIV3_INIT_CODE],
      [
        ADAPTERS.uniswap,
        ADAPTERS.uniswapV2,
        ADAPTERS.sushiswap,
        ADAPTERS.linkswap,
        ADAPTERS.defiswap,
        ADAPTERS.zeroexV2,
        ADAPTERS.zeroexV4,
        ADAPTERS.curve,
        ADAPTERS.weth,
        ADAPTERS.uniswapV3,
      ],
      [].concat(...Object.values(TARGET_EXCHANGES)),
      MARKET_MAKERS
    );

    const paraswapUniV2RouterFilter = await ParaswapUniV2RouterFilter.deploy(tokenRegistry.address, UNIV2_FACTORY, UNIV2_INIT_CODE, weth.address);
    const uniV3RouterFilter = await UniswapV3RouterFilter.deploy(tokenRegistry.address, UNIV3_FACTORY, UNIV3_INIT_CODE, weth.address);
    const zeroExV2Filter = await ZeroExV2Filter.deploy(MARKET_MAKERS);
    const zeroExV4Filter = await ZeroExV4Filter.deploy(MARKET_MAKERS);
    const curveFilter = await CurveFilter.deploy();
    const wethFilter = await WethFilter.deploy();

    paraswapProxyAddress = await paraswap.getTokenTransferProxy();
    await dappRegistry.addDapp(REGISTRY_ID, paraswapProxyAddress, proxyFilter.address);
    await dappRegistry.addDapp(REGISTRY_ID, AUGUSTUS, paraswapFilter.address);
    await dappRegistry.addDapp(REGISTRY_ID, TARGET_EXCHANGES.uniswapV2, paraswapUniV2RouterFilter.address);
    await dappRegistry.addDapp(REGISTRY_ID, TARGET_EXCHANGES.uniswapV3, uniV3RouterFilter.address);
    await dappRegistry.addDapp(REGISTRY_ID, ZEROEXV2_PROXY, proxyFilter.address);
    await dappRegistry.addDapp(REGISTRY_ID, TARGET_EXCHANGES.zeroexV2, zeroExV2Filter.address);
    await dappRegistry.addDapp(REGISTRY_ID, TARGET_EXCHANGES.zeroexV4, zeroExV4Filter.address);
    await dappRegistry.addDapp(REGISTRY_ID, TARGET_EXCHANGES.curve[0], curveFilter.address);
    await dappRegistry.addDapp(REGISTRY_ID, WETH, wethFilter.address);
    await dappRegistry.addDapp(REGISTRY_ID, uniswapV1Exchanges[DAI].address, ZERO_ADDRESS);
    await dappRegistry.addDapp(REGISTRY_ID, uniswapV1Exchanges[USDC].address, ZERO_ADDRESS);
  });

  function getPath({ fromToken, toToken, routes, useUnauthorisedAdapter = false, useUnauthorisedTargetExchange = false }) {
    const exchanges = {
      uniswap: useUnauthorisedAdapter ? other.address : ADAPTERS.uniswap,
      uniswapv2: useUnauthorisedAdapter ? other.address : ADAPTERS.uniswapV2,
      uniswapv3: useUnauthorisedAdapter ? other.address : ADAPTERS.uniswapV3,
      sushiswap: useUnauthorisedAdapter ? other.address : ADAPTERS.sushiswap,
      linkswap: useUnauthorisedAdapter ? other.address : ADAPTERS.linkswap,
      defiswap: useUnauthorisedAdapter ? other.address : ADAPTERS.defiswap,
      paraswappoolv2: useUnauthorisedAdapter ? other.address : ADAPTERS.zeroexV2,
      paraswappoolv4: useUnauthorisedAdapter ? other.address : ADAPTERS.zeroexV4,
      curve: useUnauthorisedAdapter ? other.address : ADAPTERS.curve,
      weth: useUnauthorisedAdapter ? other.address : ADAPTERS.weth,
    };
    const targetExchanges = {
      uniswap: useUnauthorisedTargetExchange ? other.address : TARGET_EXCHANGES.uniswap,
      uniswapv2: useUnauthorisedTargetExchange ? other.address : TARGET_EXCHANGES.uniswapV2,
      uniswapv3: useUnauthorisedTargetExchange ? other.address : TARGET_EXCHANGES.uniswapV3,
      sushiswap: ZERO_ADDRESS,
      linkswap: ZERO_ADDRESS,
      defiswap: ZERO_ADDRESS,
      paraswappoolv2: useUnauthorisedTargetExchange ? other.address : TARGET_EXCHANGES.zeroexV2,
      paraswappoolv4: useUnauthorisedTargetExchange ? other.address : TARGET_EXCHANGES.zeroexV4,
      curve: useUnauthorisedTargetExchange ? other.address : TARGET_EXCHANGES.curve[0],
      weth: ZERO_ADDRESS,
    };
    return [
      {
        to: toToken,
        totalNetworkFee: 0,
        routes: routes.map((route) => getRouteParams(fromToken, toToken, route, exchanges, targetExchanges)),
      },
    ];
  }

  function getMultiSwapData({ fromToken, toToken, fromAmount, toAmount, beneficiary, useUnauthorisedAdapter = false, useUnauthorisedTargetExchange = false, routes }) {
    const path = getPath({ fromToken, toToken, routes, useUnauthorisedAdapter, useUnauthorisedTargetExchange });
    return paraswap.interface.encodeFunctionData(MULTISWAP, [
      {
        fromToken,
        fromAmount,
        toAmount,
        expectedAmount: 0,
        beneficiary,
        referrer: "abc",
        useReduxToken: false,
        path,
      },
    ]);
  }

  function getMegaSwapData({ fromToken, toToken, fromAmount, toAmount, beneficiary, useUnauthorisedAdapter, useUnauthorisedTargetExchange, routes }) {
    const path = getPath({ fromToken, toToken, routes, useUnauthorisedAdapter, useUnauthorisedTargetExchange });
    return paraswap.interface.encodeFunctionData(MEGASWAP, [
      {
        fromToken,
        fromAmount,
        toAmount,
        expectedAmount: 0,
        beneficiary,
        referrer: "abc",
        useReduxToken: false,
        path: [{ fromAmountPercent: 10000, path }],
      },
    ]);
  }

  function getSimpleSwapData({ fromToken, toToken, fromAmount, toAmount, exchange, beneficiary, maker = MARKET_MAKERS[0] }) {
    const simpleSwapParams = getSimpleSwapParams({
      ...getSimpleSwapExchangeCallParams({ exchange, fromToken, toToken, fromAmount, toAmount, maker }),
      fromTokenContract: getTokenContract(fromToken),
      toTokenContract: getTokenContract(toToken),
      fromAmount,
      toAmount,
      beneficiary,
    });
    return paraswap.interface.encodeFunctionData(SIMPLESWAP, simpleSwapParams);
  }

  function getSwapOnUniswapData({ fromToken, toToken, fromAmount, toAmount }) {
    return paraswap.interface.encodeFunctionData(SWAP_ON_UNI, [fromAmount, toAmount, [fromToken, toToken], 0]);
  }

  function getSwapOnUniswapForkData({ fromToken, toToken, fromAmount, toAmount }) {
    return paraswap.interface.encodeFunctionData(SWAP_ON_UNI_FORK, [UNIV2_FORKS[0].factory, UNIV2_FORKS[0].initCode, fromAmount, toAmount, [fromToken, toToken], 0]);
  }

  function getSimpleSwapExchangeCallParams({ exchange, fromToken, toToken, fromAmount, toAmount, maker }) {
    exchange = exchange.toLowerCase();
    let targetExchange;
    let swapMethod;
    let swapParams;
    let proxy = null;
    let convertWeth = false;

    if (["uniswapv2", "sushiswap", "defiswap", "linkswap"].includes(exchange)) {
      targetExchange = paraswapUniV2Router;
      swapMethod = "swap(uint256,uint256,address[])";
      swapParams = [fromAmount, toAmount, [fromToken, toToken]];
    } else if (exchange === "uniswapv3") {
      targetExchange = uniswapV3Router;
      swapMethod = "exactInputSingle((address,address,uint24,address,uint256,uint256,uint256,uint160))";
      swapParams = [
        {
          tokenIn: fromToken,
          tokenOut: toToken,
          fee: UNIV3_FEE,
          recipient: paraswap.address,
          deadline: 99999999999,
          amountIn: fromAmount,
          amountOutMinimum: toAmount,
          sqrtPriceLimitX96: 0,
        },
      ];
    } else if (exchange === "uniswap") {
      if (fromToken === PARASWAP_ETH_TOKEN) {
        targetExchange = uniswapV1Exchanges[toToken];
        swapMethod = "ethToTokenSwapInput";
        swapParams = [1, 99999999999];
      } else {
        targetExchange = uniswapV1Exchanges[fromToken];
        if (toToken === PARASWAP_ETH_TOKEN) {
          swapMethod = "tokenToEthSwapInput";
          swapParams = [fromAmount, 1, 99999999999];
        } else {
          swapMethod = "tokenToTokenSwapInput";
          swapParams = [fromAmount, 1, 1, 99999999999, toToken];
        }
      }
    } else if (exchange === "paraswappoolv2") {
      proxy = { address: ZEROEXV2_PROXY };
      targetExchange = zeroExV2TargetExchange;
      swapMethod = "marketSellOrdersNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[])";
      const { orders, signatures } = getParaswappoolData({ maker, version: 2 });
      swapParams = [orders, 0, signatures];
      convertWeth = toToken === PARASWAP_ETH_TOKEN;
    } else if (exchange === "paraswappoolv4") {
      targetExchange = zeroExV4TargetExchange;
      swapMethod = "fillRfqOrder((address,address,uint128,uint128,address,address,address,bytes32,uint64,uint256),(uint8,uint8,bytes32,bytes32),uint128)";
      convertWeth = toToken === PARASWAP_ETH_TOKEN;
      const { order, signature } = getParaswappoolData({ fromToken, toToken, maker, version: 4 });
      swapParams = [order, signature, 0];
    } else if (exchange === "curve") {
      targetExchange = curvePool;
      swapMethod = "exchange(int128,int128,uint256,uint256)";
      swapParams = [0, 1, fromAmount, toAmount];
    } else if (exchange === "weth") {
      targetExchange = weth;
      swapMethod = fromToken === PARASWAP_ETH_TOKEN ? "deposit()" : "withdraw(uint256)";
      swapParams = fromToken === PARASWAP_ETH_TOKEN ? [] : [toAmount];
    }

    return { targetExchange, swapMethod, swapParams, proxy, convertWeth, augustus: paraswap, weth };
  }

  function getTokenContract(tokenAddress) {
    let tokenContract;
    if (tokenAddress === DAI) {
      tokenContract = dai;
    } else if (tokenAddress === USDC) {
      tokenContract = usdc;
    } else if (tokenAddress === WETH) {
      tokenContract = weth;
    } else if (tokenAddress === CREAM) {
      tokenContract = cream;
    } else {
      tokenContract = { address: PARASWAP_ETH_TOKEN };
    }
    return tokenContract;
  }

  async function testTrade({
    method,
    fromToken,
    toToken,
    beneficiary = ZERO_ADDRESS,
    fromAmount = parseEther("0.01"),
    toAmount = 1,
    useUnauthorisedAdapter = false,
    useUnauthorisedTargetExchange = false,
    expectValid = true,
    fee = UNIV3_FEE,
    exchange = "uniswapV2",
    maker = MARKET_MAKERS[0],
  }) {
    // token approval if necessary
    if (fromToken !== PARASWAP_ETH_TOKEN) {
      const token = getTokenContract(fromToken);
      const approveData = token.interface.encodeFunctionData("approve(address,uint256)", [paraswapProxyAddress, fromAmount]);
      const isValid = await proxyFilter.isValid(wallet.address, paraswapProxyAddress, fromToken, approveData);
      expect(isValid).to.equal(true);
    }

    // token swap
    let swapData;

    if (method === "multiSwap") {
      const routes = getRoutesForExchange({ fromToken, toToken, maker, exchange, fee });
      swapData = getMultiSwapData({
        fromToken,
        toToken,
        fromAmount,
        toAmount,
        beneficiary,
        routes,
        useUnauthorisedAdapter,
        useUnauthorisedTargetExchange,
      });
    } else if (method === "megaSwap") {
      const routes = getRoutesForExchange({ fromToken, toToken, maker, exchange, fee });
      swapData = getMegaSwapData({
        fromToken,
        toToken,
        fromAmount,
        toAmount,
        beneficiary,
        routes,
        useUnauthorisedAdapter,
        useUnauthorisedTargetExchange,
      });
    } else if (method === "simpleSwap") {
      swapData = getSimpleSwapData({ fromToken, toToken, fromAmount, toAmount, beneficiary, exchange, maker });
    } else if (method === "swapOnUniswap") {
      swapData = getSwapOnUniswapData({ fromToken, toToken, fromAmount, toAmount });
    } else if (method === "swapOnUniswapFork") {
      swapData = getSwapOnUniswapForkData({ fromToken, toToken, fromAmount, toAmount });
    } else {
      throw new Error("Invalid method");
    }

    const isValid = await paraswapFilter.isValid(wallet.address, paraswap.address, paraswap.address, swapData);
    expect(isValid).to.equal(expectValid);
  }

  function testsForMethod(method, exchange = null) {
    if (exchange === "weth") {
      it("should allow selling ETH for token WETH", async () => {
        await testTrade({ method, exchange, fromToken: PARASWAP_ETH_TOKEN, toToken: WETH });
      });
      it("should allow selling WETH for token ETH", async () => {
        await testTrade({ method, exchange, fromToken: WETH, toToken: PARASWAP_ETH_TOKEN });
      });
    } else if (!["defiswap", "linkswap"].includes(exchange) /*pairs not in token registry for these forks*/) {
      it("should allow selling ETH for USDC", async () => {
        await testTrade({ method, exchange, fromToken: PARASWAP_ETH_TOKEN, toToken: USDC });
      });
      it("should allow selling DAI for ETH", async () => {
        await testTrade({ method, exchange, fromToken: DAI, toToken: PARASWAP_ETH_TOKEN });
      });
      it("should allow selling DAI for USDC", async () => {
        await testTrade({ method, exchange, fromToken: DAI, toToken: USDC });
      });
    }

    if (["uniswapv2", "sushiswap", "defiswap", "linkswap"].includes(exchange)) {
      it("should not allow selling ETH for non-tradable token", async () => {
        await testTrade({ method, exchange, fromToken: PARASWAP_ETH_TOKEN, toToken: CREAM, expectValid: false });
      });
    }
    if (["paraswappoolv2", "paraswappoolv4"].includes(exchange)) {
      it("denies a trade with non-whitelisted maker", async () => {
        await testTrade({ method, exchange, fromToken: PARASWAP_ETH_TOKEN, toToken: DAI, maker: other.address, expectValid: false });
      });
    }
  }

  for (const method of ["swapOnUniswap", "swapOnUniswapFork"]) {
    describe(`${method} trades`, () => {
      testsForMethod(method);
    });
  }

  for (const method of ["multiSwap", "megaSwap", "simpleSwap"]) {
    describe(`${method} trades`, () => {
      for (const exchange of ["uniswapv2", "sushiswap", "defiswap", "linkswap", "uniswap", "paraswappoolv2", "paraswappoolv4", "curve", "uniswapV3", "weth"]) {
        describe(`  via ${exchange}`, () => {
          testsForMethod(method, exchange);
        });
      }
    });
  }

  describe("Unauthorised exchanges", () => {
    async function testUnauthorisedAdapter(method) {
      await testTrade({ method, fromToken: PARASWAP_ETH_TOKEN, toToken: USDC, useUnauthorisedAdapter: true, expectValid: false });
    }

    for (const method of ["multiSwap", "megaSwap"]) {
      it(`should not allow ${method} via unauthorised adapter`, async () => {
        await testUnauthorisedAdapter(method);
      });
    }

    async function testUnauthorisedTargetExchange(method) {
      await testTrade({ method, fromToken: PARASWAP_ETH_TOKEN, toToken: USDC, useUnauthorisedTargetExchange: true, expectValid: false });
    }

    for (const method of ["multiSwap", "megaSwap"]) {
      it(`should not allow ${method} via unauthorised target exchange`, async () => {
        await testUnauthorisedTargetExchange(method);
      });
    }
  });

  describe("simpleSwap target exchanges", () => {
    it("should allow ETH transfers to WETH", async () => {
      const simpleSwapParams = getSimpleSwapParams({ targetExchange: weth, swapMethod: null });
      const swapData = paraswap.interface.encodeFunctionData(SIMPLESWAP, simpleSwapParams);
      const isValid = await paraswapFilter.isValid(wallet.address, paraswap.address, paraswap.address, swapData);
      expect(isValid).to.equal(true);
    });

    for (const exchange of ["uniswapv2", "sushiswap", "paraswappoolv2", "paraswappoolv4", "curve", "uniswapV3"]) {
      it(`should not allow ETH transfers to ${exchange}'s target exchange`, async () => {
        const { targetExchange } = getSimpleSwapExchangeCallParams({ exchange, fromToken: PARASWAP_ETH_TOKEN, toToken: USDC });
        const simpleSwapParams = getSimpleSwapParams({ targetExchange, swapMethod: null });
        const swapData = paraswap.interface.encodeFunctionData(SIMPLESWAP, simpleSwapParams);
        const isValid = await paraswapFilter.isValid(wallet.address, paraswap.address, paraswap.address, swapData);
        expect(isValid).to.equal(false);
      });
    }

    for (const exchange of ["paraswap", "uniswapv2", "sushiswap", "paraswappoolv2", "paraswappoolv4", "curve", "uniswapV3", "weth"]) {
      it(`should not allow simpleSwap via unauthorised method call to ${exchange}'s target exchange`, async () => {
        const target = exchange === "paraswap" ? paraswap : getSimpleSwapExchangeCallParams({ exchange, fromToken: PARASWAP_ETH_TOKEN, toToken: USDC }).targetExchange;
        const methodData = paraswap.interface.encodeFunctionData("renounceOwnership()", []); // unauthorised methodId
        const simpleSwapParams = [PARASWAP_ETH_TOKEN, USDC, 1, 1, 0, [target.address], methodData, [0, 4], [0], wallet.address, "abc", false];
        const swapData = paraswap.interface.encodeFunctionData(SIMPLESWAP, simpleSwapParams);
        const isValid = await paraswapFilter.isValid(wallet.address, paraswap.address, paraswap.address, swapData);
        expect(isValid).to.equal(false);
      });
    }
  });

  describe("Augustus", () => {
    it("should not allow sending ETH to Augustus without calling an authorised method", async () => {
      const isValid = await paraswapFilter.isValid(wallet.address, paraswap.address, paraswap.address, "0x");
      expect(isValid).to.equal(false);
    });
    it("should not allow calling an unauthorised method on Augustus", async () => {
      const methodData = paraswap.interface.encodeFunctionData("renounceOwnership()", []); // unauthorised methodId
      const isValid = await paraswapFilter.isValid(wallet.address, paraswap.address, paraswap.address, methodData);
      expect(isValid).to.equal(false);
    });
    it("should not allow swapOnUniswap[Fork] via unauthorised uniswap proxy", async () => {
      // wipe the timelock to avoid having to evm_mine thousands of blocks...
      const tl1 = await paraswap.getTimeLock();
      await ethers.provider.send("hardhat_setStorageAt", [AUGUSTUS, "0xA", "0x0000000000000000000000000000000000000000000000000000000000000000"]);
      const tl2 = await paraswap.getTimeLock();
      expect(tl1.toString()).to.not.be.equal(tl2.toString());

      const uniswapProxyAddress = await paraswap.getUniswapProxy();
      await paraswap.changeUniswapProxy(other.address);
      await paraswap.confirmUniswapProxyChange();
      const uniswapProxyAddress2 = await paraswap.getUniswapProxy();
      expect(uniswapProxyAddress2).to.not.be.equal(uniswapProxyAddress);

      await paraswapFilter.updateIsValidUniswapProxy();
      await testTrade({
        method: "swapOnUniswap",
        fromToken: PARASWAP_ETH_TOKEN,
        toToken: USDC,
        expectValid: false,
      });
      await testTrade({
        method: "swapOnUniswapFork",
        fromToken: PARASWAP_ETH_TOKEN,
        toToken: USDC,
        expectValid: false,
      });
      await paraswap.changeUniswapProxy(uniswapProxyAddress);
      await paraswapFilter.updateIsValidUniswapProxy();
    });
  });
});
