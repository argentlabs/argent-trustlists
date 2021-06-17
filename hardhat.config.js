require("@nomiclabs/hardhat-waffle");
require("solidity-coverage");
require("dotenv").config();
const { spawn } = require("child_process");

const SCRIPTS = [
  "deploy-registries.js",
  "deploy-compound.js",
  "deploy-weth.js",
  "deploy-curve.js"
];

const runScript = (script) => {
  return new Promise((resolve, reject) => {
    const childProcess = spawn("npx", ["hardhat", "run", `./scripts/${script}`, "--network", hre.network.name], { stdio: "inherit" });
    childProcess.once("close", resolve);
    childProcess.once("error", reject);
  })
}

task("deploy", "Deploy all scripts", async () => {
    for (const script of SCRIPTS) {
      console.log('\n', `/////////////     Executing [${script}] on [${hre.network.name}]     ///////////////`, '\n');
      await runScript(script);
    };
  });

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    hardhat: {
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`
      }
    },
    ropsten: {
      url: `https://eth-ropsten.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
      chainId: 3
    }
  },
  solidity: {
    compilers: [
      {
        version: "0.8.3"
      }
    ]
  },
};
