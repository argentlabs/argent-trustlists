require("@nomiclabs/hardhat-waffle");
require("solidity-coverage");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    hardhat: {
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/1BWKmD5fplja08Syalco_aNBWf9cI081`
      }
    }
  },
  solidity: {
    compilers: [
      {
        version: "0.8.3"
      },
      {
        version: "0.5.4"
      }
    ]
  },
};

