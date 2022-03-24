// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity 0.7.5;

interface ICoFiXRouter {
    function factory() external pure returns (address);
    function WETH() external pure returns (address);

    function swapExactETHForTokens(
        address token,
        uint amountIn,
        uint amountOutMin,
        address to,
        address rewardTo,
        uint deadline
    ) external payable returns (uint _amountIn, uint _amountOut);

    function swapExactTokensForETH(
        address token,
        uint amountIn,
        uint amountOutMin,
        address to,
        address rewardTo,
        uint deadline
    ) external payable returns (uint _amountIn, uint _amountOut);

    function swapExactTokensForTokens(
        address tokenIn,
        address tokenOut,
        uint amountIn,
        uint amountOutMin,
        address to,
        address rewardTo,
        uint deadline
    ) external payable returns (uint _amountIn, uint _amountOut);

    function swapETHForExactTokens(
        address token,
        uint amountInMax,
        uint amountOutExact,
        address to,
        address rewardTo,
        uint deadline
    ) external payable returns (uint _amountIn, uint _amountOut);

    function swapTokensForExactETH(
        address token,
        uint amountInMax,
        uint amountOutExact,
        address to,
        address rewardTo,
        uint deadline
    ) external payable returns (uint _amountIn, uint _amountOut);
}
