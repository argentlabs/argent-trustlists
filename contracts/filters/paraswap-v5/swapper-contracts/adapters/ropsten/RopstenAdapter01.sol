pragma solidity 0.7.5;
pragma experimental ABIEncoderV2;

import "../IAdapter.sol";

import "../../lib/uniswapv2/NewUniswapV2.sol";
import "../../lib/uniswap/UniswapV1.sol";

/**
* @dev This contract will route call to:
* 0- UniswapV2Forks
* 1- UniswapV1
* The above are the indexes
*/

contract RopstenAdapter01 is IAdapter, NewUniswapV2, UniswapV1 {
    using SafeMath for uint256;

    constructor(
        address uniswapFactory
    )
        UniswapV1(uniswapFactory)
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
                //swap on uniswapV2Fork
                swapOnUniswapV2Fork(
                    fromToken,
                    toToken,
                    fromAmount.mul(route[i].percent).div(10000),
                    route[i].payload
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
            else {
                revert("Index not supported");
            }
        }
    }
}
