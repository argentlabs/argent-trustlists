pragma solidity 0.7.5;
pragma experimental ABIEncoderV2;

import 'openzeppelin-solidity/contracts/token/ERC20/IERC20.sol';
import '@uniswap/lib/contracts/libraries/TransferHelper.sol';

import './IBakeryPair.sol';
import '../uniswapv2/NewUniswapV2Lib.sol';
import "../Utils.sol";
import '../weth/IWETH.sol';


abstract contract BakeryAdapter {
    using SafeMath for uint256;

    // Pool bits are 255-161: fee, 160: direction flag, 159-0: address
    uint256 constant _FEE_OFFSET = 161;
    uint256 constant _DIRECTION_FLAG =
    0x0000000000000000000000010000000000000000000000000000000000000000;

    struct BakeryData {
        address weth;
        uint256[] pools;
    }

    function swapOnBakery(
        IERC20 fromToken,
        IERC20 toToken,
        uint256 fromAmount,
        bytes calldata payload
    )
    internal
    {
        BakeryData memory data = abi.decode(payload, (BakeryData));
        _swapOnBakery(
            address(fromToken),
            fromAmount,
            data.weth,
            data.pools
        );
    }

    function _swapOnBakery(
        address tokenIn,
        uint256 amountIn,
        address weth,
        uint256[] memory pools
    )
    private
    returns (uint256 tokensBought)
    {
        uint256 pairs = pools.length;

        require(pairs != 0, "At least one pool required");

        bool tokensBoughtEth;

        if (tokenIn == Utils.ethAddress()) {
            IWETH(weth).deposit{value: amountIn}();
            require(IWETH(weth).transfer(address(pools[0]), amountIn));
        } else {
            TransferHelper.safeTransfer(tokenIn, address(pools[0]), amountIn);
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
                i + 1 == pairs ? address(this) : address(pools[i + 1])
            );
        }

        if (tokensBoughtEth) {
            IWETH(weth).withdraw(tokensBought);
        }
    }
}
