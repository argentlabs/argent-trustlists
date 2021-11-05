require("@nomiclabs/hardhat-waffle");
require("@rumblefishdev/hardhat-kms-signer");
require("solidity-coverage");
require("dotenv").config();
const { spawn } = require("child_process");

const SCRIPTS = [
  "deploy-registries.js",
  "deploy-aave.js",
  "deploy-balancer.js",
  "deploy-compound.js",
  "deploy-curve.js",
  "deploy-lido.js",
  "deploy-uniswap.js",
  "deploy-weth.js",
  "deploy-yearn.js",
  "deploy-maker.js",
  "deploy-gro.js",
  "deploy-paraswap.js",
  "deploy-argent.js",
];

const runScript = (script) => {
  return new Promise((resolve, reject) => {
    const childProcess = spawn("npx", ["hardhat", "run", `./scripts/${script}`, "--network", hre.network.name], { stdio: "inherit" });
    childProcess.once("close", resolve);
    childProcess.once("error", reject);
  });
};

task("deploy-all", "Deploy all scripts", async () => {
  for (const script of SCRIPTS) {
    console.log("\n", `/////////////     Executing [${script}] on [${hre.network.name}]     ///////////////`, "\n");
    await runScript(script);
  }
});

task("display-account", "Display deployment account", async () => {
  const signer = await hre.ethers.getSigner();
  console.log(signer);
});

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    hardhat: {
      // forking: {
        // url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
      // },
    },
    dev: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
      accounts: [`0x${process.env.DEV_PKEY}`],
      chainId: 4,
    },
    test: {
      url: `https://eth-ropsten.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
      kmsKeyId: process.env.TEST_KMSID,
      chainId: 3,
    },
    staging: {
      url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
      kmsKeyId: process.env.STAGING_KMSID,
      chainId: 1,
    },
    prod: {
      url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
      kmsKeyId: process.env.PROD_KMSID,
      chainId: 1,
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.3",
      },
    ],
  },
};
