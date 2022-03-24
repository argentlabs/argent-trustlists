import { TransactionRequest } from "@ethersproject/abstract-provider";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, Contract, ContractFactory } from "ethers";
import { ethers } from "hardhat";
import { getTransaction, signCalldata } from "./paraswap.service";

const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const AUGUSTUS_ADDRESS = "0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57";

const REGISTRY_ID = 0;
const TIMELOCK = 0;

const ethAmount = ethers.utils.parseEther("0.1").toString();
const daiAmount = ethers.utils.parseEther("100").toString();

describe("Paraswap", function () {
  let DappRegistry: ContractFactory;
  let AugustusSwapperForwarder: ContractFactory;
  let ParaswapFilter: ContractFactory;

  let registry: Contract;
  let deployer: SignerWithAddress;
  let wallet: SignerWithAddress;
  let ags: SignerWithAddress;
  let ethToDaiTransaction: TransactionRequest;

  before(async function () {
    DappRegistry = await ethers.getContractFactory("DappRegistry");
    AugustusSwapperForwarder = await ethers.getContractFactory("AugustusSwapperForwarder");
    ParaswapFilter = await ethers.getContractFactory("ParaswapV5Filter");
    registry = await DappRegistry.deploy(TIMELOCK);
    [deployer, wallet, ags] = await ethers.getSigners();
  });

  describe("Testing filter for Paraswap v5", function () {
    let augustus: any;
    let forwarder: any;
    let filter: any;
    let dai: any;

    before(async function () {
      const paraswapInterface = "contracts/filters/paraswap-v5/swapper-contracts/IParaswap.sol:IParaswap";
      augustus = await ethers.getContractAt(paraswapInterface, AUGUSTUS_ADDRESS);

      forwarder = await AugustusSwapperForwarder.deploy(ethers.constants.AddressZero, augustus.address);
      let role = "0x7a05a596cb0ce7fdea8a1e1ec73be300bdb35097c944ce1897202f7a13122eb2"
      const simpleSwap = await ethers.getContractAt("SimpleSwap", "0xa655d02670be0ceC6b8b6b83c68Ed5375a2f5028");
      let tx = await forwarder.grantRole(role, simpleSwap.address);
      await tx.wait();
      tx = await forwarder.setImplementation(simpleSwap.interface.getSighash("simpleSwap"), simpleSwap.address);
      await tx.wait()

      filter = await ParaswapFilter.deploy(ags.address);
      await registry.addDapp(REGISTRY_ID, forwarder.address, filter.address);

      dai = await ethers.getContractAt("IERC20", DAI_ADDRESS);
      ethToDaiTransaction = await getTransaction(ETH_ADDRESS, dai.address, ethAmount, deployer.address);
    });

    it("Should accept swapOnUniswap", async function () {
      const amountIn = ethAmount;
      const amountOutMin = "1";
      const path = [ethers.constants.AddressZero];
      const swapData = augustus.interface.encodeFunctionData("swapOnUniswap", [amountIn, amountOutMin, path]);
      const signature = await signCalldata(swapData, ags);

      const data = forwarder.interface.encodeFunctionData("delegateToParaswap", [signature, swapData]);
      const isAuthorised = await registry.isAuthorised(wallet.address, forwarder.address, forwarder.address, data);
      expect(isAuthorised).to.be.true;
    });

    it("Should swap ETH for DAI on augustus directly", async function () {
      const balanceBefore = await dai.balanceOf(deployer.address);
      await deployer.sendTransaction(ethToDaiTransaction);
      const balanceAfter: BigNumber = await dai.balanceOf(deployer.address);
      expect(balanceAfter.sub(balanceBefore).gt(0)).to.be.true;
    });

    it("Should swap ETH for DAI on augustus using the forwader", async function () {
      const signature = await signCalldata(ethToDaiTransaction.data, ags);
      const balanceBefore = await dai.balanceOf(deployer.address);
      await forwarder.delegateToParaswap(signature, ethToDaiTransaction.data, { value: ethAmount });
      const balanceAfter: BigNumber = await dai.balanceOf(deployer.address);
      expect(balanceAfter.sub(balanceBefore).gt(0)).to.be.true;
    });
  });
});
