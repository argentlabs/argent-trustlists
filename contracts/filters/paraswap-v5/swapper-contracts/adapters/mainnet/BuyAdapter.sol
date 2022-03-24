pragma solidity 0.7.5;
pragma experimental ABIEncoderV2;

import "../../lib/uniswapv2/NewUniswapV2.sol";
import "../../lib/uniswapv3/UniswapV3.sol";
import "../../lib/zeroxv4/ZeroxV4.sol";
import "../../lib/balancer/Balancer.sol";
import "../IBuyAdapter.sol";

/**
* @dev This contract will route call to:
* 1- UniswapV2Forks
* 2- UniswapV3
* 3- ZeroXV4
* 4- Balancer (V1)
* The above are the indexes
*/
contract BuyAdapter is IBuyAdapter, NewUniswapV2, UniswapV3, ZeroxV4, Balancer {
    using SafeMath for uint256;

    constructor(
        address _weth
    )
        WethProvider(_weth)
        public
    {
    }

    function initialize(bytes calldata data) override external {
        revert("METHOD NOT IMPLEMENTED");
    }

    function buy(
        uint256 index,
        IERC20 fromToken,
        IERC20 toToken,
        uint256 maxFromAmount,
        uint256 toAmount,
        address targetExchange,
        bytes calldata payload
    )
        external
        override
        payable
    {
        if (index == 1) {
            buyOnUniswapFork(
                fromToken,
                toToken,
                maxFromAmount,
                toAmount,
                payload
            );
        }
        else if (index == 2) {
            buyOnUniswapV3(
                fromToken,
                toToken,
                maxFromAmount,
                toAmount,
                targetExchange,
                payload
            );
        }
        else if (index == 3) {
            buyOnZeroXv4(
                fromToken,
                toToken,
                maxFromAmount,
                toAmount,
                targetExchange,
                payload
            );
        }
        else if (index == 4) {
            buyOnBalancer(
                fromToken,
                toToken,
                maxFromAmount,
                toAmount,
                targetExchange,
                payload
            );
        }
        else {
            revert("Index not supported");
        }
    }
}
