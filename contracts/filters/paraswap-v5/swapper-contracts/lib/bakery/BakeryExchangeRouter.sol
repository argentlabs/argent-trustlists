pragma solidity 0.7.5;

import '@uniswap/lib/contracts/libraries/TransferHelper.sol';

import '../weth/IWETH.sol';
import '../uniswapv2/NewUniswapV2Lib.sol';
import './IBakeryPair.sol';

contract BakeryExchangeRouter {
    using SafeMath for uint256;

    address constant _ETH_IDENTIFIER = address(
        0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
    );
    // Pool bits are 255-161: fee, 160: direction flag, 159-0: address
    uint256 constant _FEE_OFFSET = 161;
    uint256 constant _DIRECTION_FLAG =
    0x0000000000000000000000010000000000000000000000000000000000000000;

    receive() external payable {
    }

    function swap(
        address tokenIn,
        uint256 amountIn,
        uint256 amountOutMin,
        address weth,
        uint256[] calldata pools
    )
    external
    payable
    returns (uint256 tokensBought)
    {
        return _swap(
            tokenIn,
            amountIn,
            amountOutMin,
            weth,
            pools
        );
    }

    function buy(
        address tokenIn,
        uint256 amountInMax,
        uint256 amountOut,
        address weth,
        uint256[] memory pools
    )
    external
    payable
    returns (uint256 tokensSold)
    {
        return _buy(
            tokenIn,
            amountInMax,
            amountOut,
            weth,
            pools
        );
    }

    function _swap(
        address tokenIn,
        uint256 amountIn,
        uint256 amountOutMin,
        address weth,
        uint256[] memory pools
    )
    private
    returns (uint256 tokensBought)
    {
        uint256 pairs = pools.length;

        require(pairs != 0, "At least one pool required");

        bool tokensBoughtEth;

        if (tokenIn == _ETH_IDENTIFIER) {
            require(amountIn == msg.value, "Incorrect amount of ETH sent");
            IWETH(weth).deposit{value: msg.value}();
            require(IWETH(weth).transfer(address(pools[0]), msg.value));
        } else {
            TransferHelper.safeTransferFrom(
                tokenIn, msg.sender, address(pools[0]), amountIn
            );
            tokensBoughtEth = weth != address(0);
        }

        tokensBought = amountIn;

        for (uint256 i = 0; i < pairs; ++i) {
            uint256 p = pools[i];
            address pool = address(p);
            bool direction = p & _DIRECTION_FLAG == 0;

            tokensBought = NewUniswapV2Lib.getAmountOut(
                tokensBought, pool, direction, p >> _FEE_OFFSET
            );
            (uint256 amount0Out, uint256 amount1Out) = direction
            ? (uint256(0), tokensBought) : (tokensBought, uint256(0));
            IBakeryPair(pool).swap(
                amount0Out,
                amount1Out,
                i + 1 == pairs
                ? (tokensBoughtEth ? address(this) : msg.sender)
                : address(pools[i + 1])
            );
        }

        if (tokensBoughtEth) {
            IWETH(weth).withdraw(tokensBought);
            TransferHelper.safeTransferETH(msg.sender, tokensBought);
        }

        require(tokensBought >= amountOutMin, "UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT");
    }

    function _buy(
        address tokenIn,
        uint256 amountInMax,
        uint256 amountOut,
        address weth,
        uint256[] memory pools
    )
    private
    returns (uint256 tokensSold)
    {
        uint256 pairs = pools.length;

        require(pairs != 0, "At least one pool required");

        uint256[] memory amounts = new uint256[](pairs + 1);

        amounts[pairs] = amountOut;

        for (uint256 i = pairs; i != 0; --i) {
            uint256 p = pools[i - 1];
            amounts[i - 1] = NewUniswapV2Lib.getAmountIn(
                amounts[i],
                address(p),
                p & _DIRECTION_FLAG == 0,
                p >> _FEE_OFFSET
            );
        }

        tokensSold = amounts[0];
        require(tokensSold <= amountInMax, "UniswapV2Router: INSUFFICIENT_INPUT_AMOUNT");
        bool tokensBoughtEth;

        if (tokenIn == _ETH_IDENTIFIER) {
            TransferHelper.safeTransferETH(
                msg.sender, msg.value.sub(tokensSold)
            );
            IWETH(weth).deposit{value: tokensSold}();
            require(IWETH(weth).transfer(address(pools[0]), tokensSold));
        } else {
            TransferHelper.safeTransferFrom(
                tokenIn, msg.sender, address(pools[0]), tokensSold
            );
            tokensBoughtEth = weth != address(0);
        }

        for (uint256 i = 0; i < pairs; ++i) {
            uint256 p = pools[i];
            (uint256 amount0Out, uint256 amount1Out) = p & _DIRECTION_FLAG == 0
            ? (uint256(0), amounts[i + 1]) : (amounts[i + 1], uint256(0));
            IBakeryPair(address(p)).swap(
                amount0Out,
                amount1Out,
                i + 1 == pairs
                ? (tokensBoughtEth ? address(this) : msg.sender)
                : address(pools[i + 1])
            );
        }

        if (tokensBoughtEth) {
            IWETH(weth).withdraw(amountOut);
            TransferHelper.safeTransferETH(msg.sender, amountOut);
        }
    }
}
