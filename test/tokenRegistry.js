const { expect } = require("chai");
const { ethers } = require("hardhat");

let DAI = "0x6b175474e89094c44da98b954eedeac495271d0f";
let USDC = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

describe("TokenRegistry", function () {

  let registry;
  let deployer;
  let owner;
  let manager;
  let otherManager;
  let other;

  beforeEach(async function () {
    const TokenRegistry = await ethers.getContractFactory("TokenRegistry");
    registry = await TokenRegistry.deploy();
    [deployer, owner, manager, otherManager, other] = await ethers.getSigners();
  });

  describe("TokenRegistry management", function () {

    it("Should change the owner", async function () {
      expect(await registry.owner()).to.equal(deployer.address);

      // should fail if the sender is not the owner
      await expect(
        registry.connect(other).changeOwner(owner.address)
      ).to.be.revertedWith("Must be owner");

      // should fail if the target owner is null
      await expect(
        registry.changeOwner(ethers.constants.AddressZero)
      ).to.be.revertedWith("Address must not be null");

      // change owner
      await registry.changeOwner(owner.address);
      expect(await registry.owner()).to.equal(owner.address);
    });

    it("Should add/remove a manager", async function () {
      // should fail to add if the sender is not the owner
      await expect(
        registry.connect(other).addManager(manager.address)
      ).to.be.revertedWith("Must be owner");

      // should fail to add if the manager is null
      await expect(
        registry.addManager(ethers.constants.AddressZero)
      ).to.be.revertedWith("M: Address must not be null");

      // should add the manager
      await registry.addManager(manager.address);
      expect(await registry.managers(manager.address)).to.equal(true);

      // Shoudl fail to remove an unknown manager
      await expect(
        registry.revokeManager(other.address)
      ).to.be.revertedWith("M: Target must be an existing manager");

      // Remove the manager
      await registry.revokeManager(manager.address);
      expect(await registry.managers(manager.address)).to.equal(false);
    });

    it("Should add tokens", async function () {
      // add the manager
      await registry.addManager(manager.address);
      expect(await registry.managers(manager.address)).to.equal(true);

      // Shoudl fail to add tokens when not a manager or an owner
      await expect(
        registry.connect(other).setTradableForTokenList([DAI], [true])
      ).to.be.revertedWith("TR: Unauthorised");

      // managers can only remove tokens
      await expect(
        registry.connect(manager).setTradableForTokenList([DAI], [true])
      ).to.be.revertedWith("TR: Unauthorised operation");

      // should add tokens as owner
      expect(await registry.getTradableForTokenList([DAI, USDC])).to.eql([false, false]);
      await registry.setTradableForTokenList([DAI, USDC], [true, true]);
      expect(await registry.getTradableForTokenList([DAI, USDC])).to.eql([true, true]);
    });

    it("Should remove tokens", async function () {
      // add the manager
      await registry.addManager(manager.address);
      expect(await registry.managers(manager.address)).to.equal(true);

      // add tokens
      await registry.setTradableForTokenList([DAI, USDC], [true, true]);
      expect(await registry.areTokensTradable([DAI, USDC])).to.equal(true);

      // should remove tokens as manager
      await registry.connect(manager).setTradableForTokenList([USDC], [false]);
      expect(await registry.isTokenTradable(USDC)).to.equal(false);

      // should remove tokens as owner
      registry.setTradableForTokenList([DAI], [false]);
      expect(await registry.isTokenTradable(DAI)).to.equal(false);
    });
  });
});