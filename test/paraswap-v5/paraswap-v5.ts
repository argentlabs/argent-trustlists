import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";
import { ethers } from "hardhat";
import { paraswapInterface, signCalldata } from "./paraswap.service";

const AUGUSTUS_ADDRESS = "0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57";
const REGISTRY_ID = 0;
const TIMELOCK = 0;

describe("Paraswap", function () {
  let DappRegistry: ContractFactory;
  let ParaswapFilter: ContractFactory;

  let registry: Contract;
  let deployer: SignerWithAddress;
  let wallet: SignerWithAddress;
  let ags: SignerWithAddress;

  before(async function () {
    DappRegistry = await ethers.getContractFactory("DappRegistry");
    ParaswapFilter = await ethers.getContractFactory("ParaswapV5Filter");
    registry = await DappRegistry.deploy(TIMELOCK);
    [deployer, wallet, ags] = await ethers.getSigners();
  });

  describe("Testing filter for Paraswap v5", function () {
    let filter: Contract;

    before(async function () {
      filter = await ParaswapFilter.deploy(ags.address);
      await registry.addDapp(REGISTRY_ID, AUGUSTUS_ADDRESS, filter.address);
    });

    it("Should accept swap data signed by the master signer", async function () {
      const amountIn = ethers.utils.parseEther("0.1");
      const amountOutMin = "1";
      const path = [ethers.constants.AddressZero];
      const swapData = paraswapInterface.encodeFunctionData("swapOnUniswap", [amountIn, amountOutMin, path]);

      const latestBlock = await ethers.provider.getBlock("latest");
      const deadline = ethers.utils.hexZeroPad(ethers.utils.hexlify(latestBlock.number + 3), 32);

      const dataToSign = ethers.utils.concat([wallet.address, deadline, swapData]);
      const signature = await signCalldata(dataToSign, ags);

      const data = ethers.utils.concat([swapData, deadline, signature]);
      const isAuthorised = await registry.isAuthorised(wallet.address, AUGUSTUS_ADDRESS, AUGUSTUS_ADDRESS, data);
      expect(isAuthorised).to.be.true;
    });

  });
});
