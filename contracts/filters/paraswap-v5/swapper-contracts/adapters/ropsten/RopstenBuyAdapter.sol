pragma solidity 0.7.5;
pragma experimental ABIEncoderV2;

import "../../lib/uniswapv2/NewUniswapV2.sol";
import "../IBuyAdapter.sol";

/**
* @dev This contract will route call to:
* 1- UniswapV2Forks
* The above are the indexes
*/
contract RopstenBuyAdapter is IBuyAdapter, NewUniswapV2 {
    using SafeMath for uint256;

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
        else {
            revert("Index not supported");
        }
    }
}
