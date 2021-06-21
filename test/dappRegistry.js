const { expect } = require("chai");
const { ethers } = require("hardhat");

const TIMELOCK = 3;

describe("DappRegistry", function () {

  let registry;
  let deployer;
  let wallet;
  let registryOwner;
  let dapp;
  let other;

  beforeEach(async function () {
    const DappRegistry = await ethers.getContractFactory("DappRegistry");
    registry = await DappRegistry.deploy(TIMELOCK);
    [deployer, wallet, registryOwner, other, dapp] = await ethers.getSigners();
  });

  describe("DappRegistry management", function () {

    it("Should create a new registry", async function () {
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

    it("Should change the timelock", async function () {
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

    it("Should change the owner of a registry", async function () {
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

  describe("Trustlist management", function() {

    it("Should toggle a trustlit for a wallet", async function() {
      const isEnalbled = await registry.isEnabledRegistry(wallet.address, 0);
      await registry.connect(wallet).toggleRegistry(0, !isEnalbled);
      expect(await registry.isEnabledRegistry(wallet.address, 0)).to.equal(!isEnalbled);
    });

  });

  describe("Filter management", function () {

    let filter1;
    let filter2;

    before(async function () {
      const OnlyApproveFilter = await ethers.getContractFactory("OnlyApproveFilter");
      filter1 = await OnlyApproveFilter.deploy();
      filter2 = await OnlyApproveFilter.deploy();
    });

    it("Should add a dapp", async function () {
      // should fail when the sender is not the registry owner
      await expect(
        registry.connect(other).addDapp(0, dapp.address, filter1.address)
      ).to.be.revertedWith("DR: sender != registry owner");

      // add the dapp
      await registry.addDapp(0, dapp.address, filter1.address);
      let auth = await registry.getAuthorisation(0, dapp.address);
      expect(auth[0]).to.equal(filter1.address);
      expect(auth[1]).to.gt(0);

      // should fail to add a dapp twice
      await expect(
        registry.addDapp(0, dapp.address, filter1.address)
      ).to.be.revertedWith("DR: dapp already added");
    });

    it("Should remove a dapp", async function () {
      let auth1 = await registry.getAuthorisation(0, dapp.address);
      // should fail when the dapp is unknown
      await expect(
        registry.removeDapp(0, dapp.address)
      ).to.be.revertedWith("DR: unknown dapp");

      // add the dapp so it can be removed
      await registry.addDapp(0, dapp.address, filter1.address);
      let auth = await registry.getAuthorisation(0, dapp.address);
      expect(auth[0]).to.equal(filter1.address);
      expect(auth[1]).to.gt(0);

      // should fail when the sender is not the registry owner
      await expect(
        registry.connect(other).removeDapp(0, dapp.address)
      ).to.be.revertedWith("DR: sender != registry owner");

      // remove the dapp
      await registry.removeDapp(0, dapp.address);
      auth = await registry.getAuthorisation(0, dapp.address);
      expect(auth[0]).to.equal(ethers.constants.AddressZero);
      expect(auth[1]).to.equal(0);
    });

    it("Should update the filter of a dapp", async function () {
      // should fail to request an update when the dapp is unknown
      await expect(
        registry.requestFilterUpdate(0, dapp.address, filter2.address)
      ).to.be.revertedWith("DR: unknown dapp");

      // add the dapp
      await registry.addDapp(0, dapp.address, filter1.address);
      let auth = await registry.getAuthorisation(0, dapp.address);
      expect(auth[0]).to.equal(filter1.address);
      expect(auth[1]).to.gt(0);

      // should fail when the sender is not the registry owner
      await expect(
        registry.connect(other).requestFilterUpdate(0, dapp.address, filter2.address)
      ).to.be.revertedWith("DR: sender != registry owner");

      // should fail to confirm when the update was not requested
      await expect(
        registry.confirmFilterUpdate(0, dapp.address)
      ).to.be.revertedWith("DR: no pending filter update");

      // request a filter update
      await registry.requestFilterUpdate(0, dapp.address, filter2.address);

      // Should fail to confirm too early
      await expect(
        registry.confirmFilterUpdate(0, dapp.address)
      ).to.be.revertedWith("DR: too early to confirm auth");

      // should confim
      await ethers.provider.send("evm_increaseTime", [5]);
      await registry.confirmFilterUpdate(0, dapp.address);
      auth = await registry.getAuthorisation(0, dapp.address);
      expect(auth[0]).to.equal(filter2.address);
    });
  });
});
