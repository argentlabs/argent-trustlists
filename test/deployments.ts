import hre from "hardhat";

describe("Deployments", function () {
  it("Should deploy all filters on hardhat network", async function () {
    await hre.run("deploy-all");
  });
});