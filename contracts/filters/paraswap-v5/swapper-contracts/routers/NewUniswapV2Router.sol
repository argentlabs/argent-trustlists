pragma solidity 0.7.5;
pragma experimental ABIEncoderV2;

import '../AugustusStorage.sol';
import './IRouter.sol';
import '../lib/weth/IWETH.sol';
import '../lib/uniswapv2/NewUniswapV2Lib.sol';
import "../lib/Utils.sol";
import '@uniswap/lib/contracts/libraries/TransferHelper.sol';


contract NewUniswapV2Router is AugustusStorage, IRouter {
    using SafeMath for uint256;

    address constant ETH_IDENTIFIER = address(
        0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
    );
    // Pool bits are 255-161: fee, 160: direction flag, 159-0: address
    uint256 constant FEE_OFFSET = 161;
    uint256 constant DIRECTION_FLAG =
        0x0000000000000000000000010000000000000000000000000000000000000000;
    

    function initialize(bytes calldata data) override external {
        revert("METHOD NOT IMPLEMENTED");
    }

    function getKey() override external pure returns(bytes32) {
        return keccak256(abi.encodePacked("UNISWAP_DIRECT_ROUTER", "2.0.0"));
    }

    function swapOnUniswapV2Fork(
        address tokenIn,
        uint256 amountIn,
        uint256 amountOutMin,
        address weth,
        uint256[] calldata pools
    )
        external
        payable
    {
        _swap(
            tokenIn,
            amountIn,
            amountOutMin,
            weth,
            pools
        );
    }



    function buyOnUniswapV2Fork(
        address tokenIn,
        uint256 amountInMax,
        uint256 amountOut,
        address weth,
        uint256[] calldata pools
    )
        external
        payable
    {
        _buy(
            tokenIn,
            amountInMax,
            amountOut,
            weth,
            pools
        );
    }

    function swapOnUniswapV2ForkWithPermit(
        address tokenIn,
        uint256 amountIn,
        uint256 amountOutMin,
        address weth,
        uint256[] calldata pools,
        bytes calldata permit
    )
        external
        payable
    {
        _swapWithPermit(
            tokenIn,
            amountIn,
            amountOutMin,
            weth,
            pools,
            permit
        );
    }



    function buyOnUniswapV2ForkWithPermit(
        address tokenIn,
        uint256 amountInMax,
        uint256 amountOut,
        address weth,
        uint256[] calldata pools,
        bytes calldata permit
    )
        external
        payable
    {
        _buyWithPermit(
            tokenIn,
            amountInMax,
            amountOut,
            weth,
            pools,
            permit
        );
    }

    function transferTokens(
        address token,
        address from,
        address to,
        uint256 amount
    )
        private
    {
        ITokenTransferProxy(tokenTransferProxy).transferFrom(
            token, from, to, amount
        );
    }

    function transferTokensWithPermit(
        address token,
        address from,
        address to,
        uint256 amount,
        bytes calldata permit
    )
        private
    {   
        Utils.permit(token, permit);
        ITokenTransferProxy(tokenTransferProxy).transferFrom(
            token, from, to, amount
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

        if (tokenIn == ETH_IDENTIFIER) {
            require(amountIn == msg.value, "Incorrect msg.value");
            IWETH(weth).deposit{value: msg.value}();
            require(IWETH(weth).transfer(address(pools[0]), msg.value));
        } else {
            require(msg.value == 0, "Incorrect msg.value");
            transferTokens(tokenIn, msg.sender, address(pools[0]), amountIn);
            tokensBoughtEth = weth != address(0);
        }

        tokensBought = amountIn;

        for (uint256 i = 0; i < pairs; ++i) {
            uint256 p = pools[i];
            address pool = address(p);
            bool direction = p & DIRECTION_FLAG == 0;

            tokensBought = NewUniswapV2Lib.getAmountOut(
                tokensBought, pool, direction, p >> FEE_OFFSET
            );
            (uint256 amount0Out, uint256 amount1Out) = direction
                ? (uint256(0), tokensBought) : (tokensBought, uint256(0));
            IUniswapV2Pair(pool).swap(
                amount0Out,
                amount1Out,
                i + 1 == pairs
                    ? (tokensBoughtEth ? address(this) : msg.sender)
                    : address(pools[i + 1]),
                ""
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
                p & DIRECTION_FLAG == 0,
                p >> FEE_OFFSET
            );
        }

        tokensSold = amounts[0];
        require(tokensSold <= amountInMax, "UniswapV2Router: INSUFFICIENT_INPUT_AMOUNT");
        bool tokensBoughtEth;

        if (tokenIn == ETH_IDENTIFIER) {
            TransferHelper.safeTransferETH(
                msg.sender, msg.value.sub(tokensSold)
            );
            IWETH(weth).deposit{value: tokensSold}();
            require(IWETH(weth).transfer(address(pools[0]), tokensSold));
        } else {
            require(msg.value == 0, "Incorrect msg.value");
            transferTokens(tokenIn, msg.sender, address(pools[0]), tokensSold);
            tokensBoughtEth = weth != address(0);
        }

        for (uint256 i = 0; i < pairs; ++i) {
            uint256 p = pools[i];
            (uint256 amount0Out, uint256 amount1Out) = p & DIRECTION_FLAG == 0
                ? (uint256(0), amounts[i + 1]) : (amounts[i + 1], uint256(0));
            IUniswapV2Pair(address(p)).swap(
                amount0Out,
                amount1Out,
                i + 1 == pairs
                    ? (tokensBoughtEth ? address(this) : msg.sender)
                    : address(pools[i + 1]),
                ""
            );
        }

        if (tokensBoughtEth) {
            IWETH(weth).withdraw(amountOut);
            TransferHelper.safeTransferETH(msg.sender, amountOut);
        }
    }

    function _swapWithPermit(
        address tokenIn,
        uint256 amountIn,
        uint256 amountOutMin,
        address weth,
        uint256[] memory pools,
        bytes calldata permit
    )
        private
        returns (uint256 tokensBought)
    {
        uint256 pairs = pools.length;

        require(pairs != 0, "At least one pool required");

        bool tokensBoughtEth;

        if (tokenIn == ETH_IDENTIFIER) {
            require(amountIn == msg.value, "Incorrect msg.value");
            IWETH(weth).deposit{value: msg.value}();
            require(IWETH(weth).transfer(address(pools[0]), msg.value));
        } else {
            require(msg.value == 0, "Incorrect msg.value");
            transferTokensWithPermit(tokenIn, msg.sender, address(pools[0]), amountIn, permit);
            tokensBoughtEth = weth != address(0);
        }

        tokensBought = amountIn;

        for (uint256 i = 0; i < pairs; ++i) {
            uint256 p = pools[i];
            address pool = address(p);
            bool direction = p & DIRECTION_FLAG == 0;

            tokensBought = NewUniswapV2Lib.getAmountOut(
                tokensBought, pool, direction, p >> FEE_OFFSET
            );
            (uint256 amount0Out, uint256 amount1Out) = direction
                ? (uint256(0), tokensBought) : (tokensBought, uint256(0));
            IUniswapV2Pair(pool).swap(
                amount0Out,
                amount1Out,
                i + 1 == pairs
                    ? (tokensBoughtEth ? address(this) : msg.sender)
                    : address(pools[i + 1]),
                ""
            );
        }

        if (tokensBoughtEth) {
            IWETH(weth).withdraw(tokensBought);
            TransferHelper.safeTransferETH(msg.sender, tokensBought);
        }

        require(tokensBought >= amountOutMin, "UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT");
    }

    function _buyWithPermit(
        address tokenIn,
        uint256 amountInMax,
        uint256 amountOut,
        address weth,
        uint256[] memory pools,
        bytes calldata permit
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
                p & DIRECTION_FLAG == 0,
                p >> FEE_OFFSET
            );
        }

        tokensSold = amounts[0];
        require(tokensSold <= amountInMax, "UniswapV2Router: INSUFFICIENT_INPUT_AMOUNT");
        bool tokensBoughtEth;

        if (tokenIn == ETH_IDENTIFIER) {
            TransferHelper.safeTransferETH(
                msg.sender, msg.value.sub(tokensSold)
            );
            IWETH(weth).deposit{value: tokensSold}();
            require(IWETH(weth).transfer(address(pools[0]), tokensSold));
        } else {
            require(msg.value == 0, "Incorrect msg.value");
            transferTokensWithPermit(tokenIn, msg.sender, address(pools[0]), tokensSold, permit);
            tokensBoughtEth = weth != address(0);
        }

        for (uint256 i = 0; i < pairs; ++i) {
            uint256 p = pools[i];
            (uint256 amount0Out, uint256 amount1Out) = p & DIRECTION_FLAG == 0
                ? (uint256(0), amounts[i + 1]) : (amounts[i + 1], uint256(0));
            IUniswapV2Pair(address(p)).swap(
                amount0Out,
                amount1Out,
                i + 1 == pairs
                    ? (tokensBoughtEth ? address(this) : msg.sender)
                    : address(pools[i + 1]),
                ""
            );
        }

        if (tokensBoughtEth) {
            IWETH(weth).withdraw(amountOut);
            TransferHelper.safeTransferETH(msg.sender, amountOut);
        }
    }
}
