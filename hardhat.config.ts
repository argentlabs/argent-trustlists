import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import "@rumblefishdev/hardhat-kms-signer";
import "solidity-coverage";
import dotenv from "dotenv";

dotenv.config();

const scripts = [
  "deploy-registries.ts",
  "deploy-aave.ts",
  "deploy-balancer.ts",
  "deploy-compound.ts",
  "deploy-curve.ts",
  "deploy-lido.ts",
  "deploy-uniswap.ts",
  "deploy-weth.ts",
  "deploy-yearn.ts",
  "deploy-maker.ts",
  "deploy-gro.ts",
  "deploy-paraswap.ts",
  "deploy-registries.ts",
];

task("deploy-all", "Deploy all scripts", async (args, hre) => {
  for (const script of scripts) {
    console.log("\n", `/////////////     Executing [${script}] on [${hre.network.name}]     ///////////////`, "\n");
    const { main } = require(`./scripts/${script}`);
    await main();
  }
});

task("display-account", "Display deployment account", async (args, hre) => {
  const [signer] = await hre.ethers.getSigners();
  console.log(signer);
});

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
      },
    },
    dev: {
      url: `https://eth-goerli.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
      accounts: [`0x${process.env.DEV_PKEY}`],
      chainId: 5,
    },
    hydrogen: {
      url: `https://eth-goerli.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
      accounts: [`0x${process.env.HYDROGEN_PKEY}`],
      chainId: 5,
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
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
    ],
  },
};

export default config;