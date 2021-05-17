require("@nomiclabs/hardhat-waffle");
require("solidity-coverage");
require("dotenv").config();

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    hardhat: {
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`
      }
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

