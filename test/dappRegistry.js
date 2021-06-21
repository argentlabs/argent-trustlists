const { expect } = require("chai");
const { ethers } = require("hardhat");

const { parseEther } = ethers.utils;

const ERC20_ABI = require('./erc20/abis/erc20.json');

const REGISTRY_ID = 0;
const TIMELOCK = 3;

describe("DappRegistry", function() {
  
  let DappRegistry;
  let OnlyApproveFilter
  let registry;
  let deployer;
  let wallet;
  let registryOwner;
  let other;
  let erc20;

  before(async function() {
    DappRegistry = await ethers.getContractFactory("DappRegistry");
    OnlyApproveFilter = await ethers.getContractFactory("OnlyApproveFilter");
    registry = await DappRegistry.deploy(TIMELOCK);
    [deployer, wallet, registryOwner, other] = await ethers.getSigners();
    erc20 = new ethers.Contract(ethers.constants.AddressZero, ERC20_ABI);
  });

  describe("DappRegistry management", function() {

    it("Should create a new registry", async function() {
      // should fail when the sender is not the owner of registry 0
      await expect(
        registry.connect(other).createRegistry(1, registryOwner.address)
      ).to.be.revertedWith("DR: sender != registry owner");

      // should fail when the registry owner is null
      await expect(
        registry.createRegistry(1, ethers.constants.AddressZero)
      ).to.be.revertedWith("DR: registry owner is 0");

      // should succeed
      await registry.createRegistry(1, registryOwner.address);
      expect(await registry.registryOwners(1)).to.equal(registryOwner.address);

      // should fail when the registry already exists
      await expect(
        registry.createRegistry(1, registryOwner.address)
      ).to.be.revertedWith("DR: duplicate registry");
    });

    it("Should change the timelock", async function() {
      const newTimelock = 2;
      await registry.requestTimelockChange(newTimelock);
      expect(await registry.newTimelockPeriod()).to.equal(newTimelock);

      // should fail if confirmation comes too early
      await expect(
        registry.confirmTimelockChange()
      ).to.be.revertedWith("DR: can't (yet) change timelock");

      await ethers.provider.send("evm_increaseTime", [5]);
      await registry.confirmTimelockChange();
      expect(await registry.timelockPeriod()).to.equal(newTimelock);
    });

    it("Should change the owner of a registry", async function() {
      await registry.createRegistry(2, registryOwner.address);
      expect(await registry.registryOwners(2)).to.equal(registryOwner.address);

      // should fail if the sender is not the owner
      await expect(
        registry.connect(deployer).changeOwner(2, other.address)
      ).to.be.revertedWith("DR: sender != registry owner");

      await registry.connect(registryOwner).changeOwner(2, other.address);
      expect(await registry.registryOwners(2)).to.equal(other.address);
    });
  });

  // skip.describe("Trustlist management", function() {

  // });

  // skip.describe("Filter management", function() {

  // });
});
