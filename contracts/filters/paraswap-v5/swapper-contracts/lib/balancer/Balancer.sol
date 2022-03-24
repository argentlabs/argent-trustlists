pragma solidity 0.7.5;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

import "../Utils.sol";
import "../weth/IWETH.sol";
import "./IBalancerPool.sol";
import "../WethProvider.sol";

interface IBalancerProxy {

  struct Swap {
        address pool;
        uint tokenInParam; // tokenInAmount / maxAmountIn / limitAmountIn
        uint tokenOutParam; // minAmountOut / tokenAmountOut / limitAmountOut
        uint maxPrice;
    }

    function batchSwapExactIn(
        Swap[] calldata swaps,
        address tokenIn,
        address tokenOut,
        uint totalAmountIn,
        uint minTotalAmountOut
    )
        external
        returns (uint totalAmountOut);

    function batchSwapExactOut(
        Swap[] calldata swaps,
        address tokenIn,
        address tokenOut,
        uint maxTotalAmountIn
    )
        external
        returns (uint totalAmountIn);

    function batchEthInSwapExactIn(
        Swap[] calldata swaps,
        address tokenOut,
        uint minTotalAmountOut
    )
        external
        payable
        returns (uint totalAmountOut);

    function batchEthOutSwapExactIn(
        Swap[] calldata swaps,
        address tokenIn,
        uint totalAmountIn,
        uint minTotalAmountOut
    )
        external
        returns (uint totalAmountOut);

    function batchEthInSwapExactOut(
        Swap[] calldata swaps,
        address tokenOut
    )
        external
        payable
        returns (uint totalAmountIn);

    function batchEthOutSwapExactOut(
        Swap[] calldata swaps,
        address tokenIn,
        uint maxTotalAmountIn
    )
        external
        returns (uint totalAmountIn);
}

abstract contract Balancer is WethProvider {
    using SafeMath for uint256;

    struct BalancerData {
        IBalancerProxy.Swap[] swaps;
    }

    function swapOnBalancer(
        IERC20 fromToken,
        IERC20 toToken,
        uint256 fromAmount,
        address exchangeProxy,
        bytes calldata payload
    )
        internal
    {
        BalancerData memory data = abi.decode(payload, (BalancerData));

        address _fromToken = address(fromToken) == Utils.ethAddress()
            ? WETH : address(fromToken);
        address _toToken = address(toToken) == Utils.ethAddress()
            ? WETH : address(toToken);

        if (address(fromToken) == Utils.ethAddress()) {
             IWETH(WETH).deposit{value: fromAmount}();
        }

        uint256 totalInParam;
        for (uint i = 0; i < data.swaps.length; ++i) {
            totalInParam = totalInParam.add(data.swaps[i].tokenInParam);
        }

        for (uint i = 0; i < data.swaps.length; ++i) {
            IBalancerProxy.Swap memory _swap = data.swaps[i];
            uint256 adjustedInParam =
                _swap.tokenInParam.mul(fromAmount).div(totalInParam);
            Utils.approve(
                _swap.pool,
                _fromToken,
                adjustedInParam
            );
            IBalancerPool(_swap.pool).swapExactAmountIn(
                _fromToken,
                adjustedInParam,
                _toToken,
                _swap.tokenOutParam,
                _swap.maxPrice
            );
        }

        if (address(toToken) == Utils.ethAddress()) {
            IWETH(WETH).withdraw(
                IERC20(WETH).balanceOf(address(this))
            );
        }
    }

    function buyOnBalancer(
        IERC20 fromToken,
        IERC20 toToken,
        uint256 fromAmount,
        uint256 toAmount,
        address exchangeProxy,
        bytes calldata payload
    )
        internal
    {
        BalancerData memory data = abi.decode(payload, (BalancerData));

        address _fromToken = address(fromToken) == Utils.ethAddress()
            ? WETH : address(fromToken);
        address _toToken = address(toToken) == Utils.ethAddress()
            ? WETH : address(toToken);

        if (address(fromToken) == Utils.ethAddress()) {
            IWETH(WETH).deposit{value: fromAmount}();
        }

        _buyOnBalancer(
            _fromToken,
            _toToken,
            fromAmount,
            toAmount,
            data
        );

        if (
            address(fromToken) == Utils.ethAddress() ||
            address(toToken) == Utils.ethAddress()
        ) {
            IWETH(WETH).withdraw(
                IERC20(WETH).balanceOf(address(this))
            );
        }
    }

    function _buyOnBalancer(
        address _fromToken,
        address _toToken,
        uint256 fromAmount,
        uint256 toAmount,
        BalancerData memory data
    )
        private
    {
        uint256 totalInParam;
        uint256 totalOutParam;
        for (uint i = 0; i < data.swaps.length; ++i) {
            IBalancerProxy.Swap memory _swap = data.swaps[i];
            totalInParam = totalInParam.add(_swap.tokenInParam);
            totalOutParam = totalOutParam.add(_swap.tokenOutParam);
        }

        for (uint i = 0; i < data.swaps.length; ++i) {
            IBalancerProxy.Swap memory _swap = data.swaps[i];
            uint256 adjustedInParam =
                _swap.tokenInParam.mul(fromAmount).div(totalInParam);
            uint256 adjustedOutParam =
                _swap.tokenOutParam.mul(toAmount)
                    .add(totalOutParam - 1).div(totalOutParam);
            Utils.approve(_swap.pool, _fromToken, adjustedInParam);
            IBalancerPool(_swap.pool).swapExactAmountOut(
                _fromToken,
                adjustedInParam,
                _toToken,
                adjustedOutParam,
                _swap.maxPrice
            );
        }
    }
}
