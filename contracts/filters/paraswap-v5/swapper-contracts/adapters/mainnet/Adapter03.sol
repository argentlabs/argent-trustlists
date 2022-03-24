pragma solidity 0.7.5;
pragma experimental ABIEncoderV2;

import "../IAdapter.sol";

import "../../lib/aavee/Aavee.sol";
import "../../lib/chai/ChaiExchange.sol";
import "../../lib/bprotocol/BProtocolAMM.sol";
import "../../lib/bzx/BZX.sol";
import "../../lib/smoothy/SmoothyV1.sol";
import "../../lib/uniswap/UniswapV1.sol";
import "../../lib/kyberdmm/KyberDmm.sol";
import "../../lib/jarvis/Jarvis.sol";
import "../../lib/lido/Lido.sol";

/**
* @dev This contract will route call to:
* 0- ChaiExchange
* 1- UniswapV1
* 2- SmoothyV1
* 3- BZX
* 4- BProtocol
* 5- Aave
* 6- KyberDMM
* 7- Jarvis
* 8 - Lido
* The above are the indexes
*/

contract Adapter03 is IAdapter, ChaiExchange, UniswapV1, SmoothyV1, BZX, BProtocol, Aavee, KyberDmm, Jarvis, Lido {
    using SafeMath for uint256;

    constructor(
        uint16 aaveeRefCode,
        address aaveeSpender,
        address uniswapFactory,
        address chai,
        address dai,
        address weth,
        address stETH
    )
        WethProvider(weth)
        Aavee(aaveeRefCode, aaveeSpender)
        UniswapV1(uniswapFactory)
        ChaiExchange(chai, dai)
        Lido(stETH)
        public
    {
    }

    function initialize(bytes calldata data) override external {
        revert("METHOD NOT IMPLEMENTED");
    }
    
    function swap(
        IERC20 fromToken,
        IERC20 toToken,
        uint256 fromAmount,
        uint256 networkFee,
        Utils.Route[] calldata route
    )
        external
        override
        payable
    {
        for (uint256 i = 0; i < route.length; i++) {
            if (route[i].index == 0) {
                //swap on ChaiExchange
                swapOnChai(
                    fromToken,
                    toToken,
                    fromAmount.mul(route[i].percent).div(10000)
                );
            }
            else if (route[i].index == 1) {
                //swap on Uniswap
                swapOnUniswapV1(
                    fromToken,
                    toToken,
                    fromAmount.mul(route[i].percent).div(10000)
                );
            }
            else if (route[i].index == 2) {
                //swap on Smoothy
                swapOnSmoothyV1(
                    fromToken,
                    toToken,
                    fromAmount.mul(route[i].percent).div(10000),
                    route[i].targetExchange,
                    route[i].payload
                );
            }
            else if (route[i].index == 3) {
                //swap on BZX
                swapOnBzx(
                    fromToken,
                    toToken,
                    fromAmount.mul(route[i].percent).div(10000),
                    route[i].payload
                );
            }
            else if (route[i].index == 4) {
                //swap on BProtocol
                swapOnBProtocol(
                    fromToken,
                    toToken,
                    fromAmount.mul(route[i].percent).div(10000),
                    route[i].targetExchange,
                    route[i].payload
                );
            }
            else if (route[i].index == 5) {
                //swap on aavee
                swapOnAavee(
                    fromToken,
                    toToken,
                    fromAmount.mul(route[i].percent).div(10000),
                    route[i].targetExchange,
                    route[i].payload
                );
            }
            else if (route[i].index == 6) {
                //swap on KyberDmm
                swapOnKyberDmm(
                    fromToken,
                    toToken,
                    fromAmount.mul(route[i].percent).div(10000),
                    route[i].targetExchange,
                    route[i].payload
                );
            }
            else if (route[i].index == 7) {
                //swap on Jarvis
                swapOnJarvis(
                    fromToken,
                    toToken,
                    fromAmount.mul(route[i].percent).div(10000),
                    route[i].targetExchange,
                    route[i].payload
                );
            }
            else if (route[i].index == 8) {
                //swap on Lido
                swapOnLido(
                    fromToken,
                    toToken,
                    fromAmount.mul(route[i].percent).div(10000),
                    route[i].targetExchange,
                    route[i].payload
                );
            }
            else {
                revert("Index not supported");
            }
        }
    }
}
