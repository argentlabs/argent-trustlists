pragma solidity 0.7.5;
pragma experimental ABIEncoderV2;


import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

import "./IProxyRegistry.sol";
import "./IOasisExchange.sol";
import "../Utils.sol";

contract Oasis {

    struct OasisData {
        address otc;
        address weth;
        address factory;
    }

    function swapOnOasis(
        IERC20 fromToken,
        IERC20 toToken,
        uint256 fromAmount,
        uint256 toAmount,
        address exchange,
        bytes calldata payload
    )
        internal

    {

        OasisData memory data = abi.decode(payload, (OasisData));

        Utils.approve(address(exchange), address(fromToken), fromAmount);

        address proxy = IProxyRegistry(data.factory).proxies(address(this));

        if (address(fromToken) == Utils.ethAddress()) {
            if (proxy == address(0)) {
                IOasisExchange(exchange).createAndSellAllAmountPayEth{value: fromAmount}(
                    data.factory,
                    data.otc,
                    address(toToken),
                    toAmount
                );
            }
            else {
                IOasisExchange(exchange).sellAllAmountPayEth{value: fromAmount}(
                    data.otc,
                    data.weth,
                    address(toToken),
                    toAmount
                );
            }
        }
        else if (address(toToken) == Utils.ethAddress()) {
            if (proxy == address(0)) {
                IOasisExchange(exchange).createAndSellAllAmountBuyEth(
                    data.factory,
                    data.otc,
                    address(fromToken),
                    fromAmount,
                    toAmount
                );
            }
            else {
                IOasisExchange(exchange).sellAllAmountBuyEth(
                    data.otc,
                    address(fromToken),
                    fromAmount,
                    data.weth,
                    toAmount
                );
            }
        }
        else {
            if (proxy == address(0)) {
                IOasisExchange(exchange).createAndSellAllAmount(
                    data.factory,
                    data.otc,
                    address(fromToken),
                    fromAmount,
                    address(toToken),
                    toAmount
                );
            }
            else {
                IOasisExchange(exchange).sellAllAmount(
                    data.otc,
                    address(fromToken),
                    fromAmount,
                    address(toToken),
                    toAmount
                );
            }
        }
    }

    function buyOnOasis(
        IERC20 fromToken,
        IERC20 toToken,
        uint256 fromAmount,
        uint256 toAmount,
        address exchange,
        bytes calldata payload
    )
        internal

    {

        OasisData memory data = abi.decode(payload, (OasisData));

        Utils.approve(address(exchange), address(fromToken), fromAmount);

        address proxy = IProxyRegistry(data.factory).proxies(address(this));

        if (address(fromToken) == Utils.ethAddress()) {
            if (proxy == address(0)) {
                IOasisExchange(exchange).createAndBuyAllAmountPayEth{value: fromAmount}(
                    data.factory,
                    data.otc,
                    address(toToken),
                    toAmount
                );
            }
            else {
                IOasisExchange(exchange).buyAllAmountPayEth{value: fromAmount}(
                    data.otc,
                    address(toToken),
                    toAmount,
                    data.weth
                );
            }
        }
        else if (address(toToken) == Utils.ethAddress()) {
            if (proxy == address(0)) {
                IOasisExchange(exchange).createAndBuyAllAmountBuyEth(
                    data.factory,
                    data.otc,
                    toAmount,
                    address(fromToken),
                    fromAmount
                );
            }
            else {
                IOasisExchange(exchange).buyAllAmountBuyEth(
                    data.otc,
                    data.weth,
                    toAmount,
                    address(fromToken),
                    fromAmount
                );
            }
        }
        else {
            if (proxy == address(0)) {
                IOasisExchange(exchange).createAndBuyAllAmount(
                    data.factory,
                    data.otc,
                    address(toToken),
                    toAmount,
                    address(fromToken),
                    fromAmount
                );
            }
            else {
                IOasisExchange(exchange).buyAllAmount(
                    data.otc,
                    address(toToken),
                    toAmount,
                    address(fromToken),
                    fromAmount
                );
            }
        }
    }
}
