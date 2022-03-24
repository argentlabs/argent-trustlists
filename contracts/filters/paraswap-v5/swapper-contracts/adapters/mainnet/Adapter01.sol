pragma solidity 0.7.5;
pragma experimental ABIEncoderV2;

import "../../lib/uniswapv2/NewUniswapV2.sol";
import "../../lib/zeroxv4/ZeroxV4.sol";
import "../../lib/zeroxv2/ZeroxV2.sol";
import "../../lib/curve/Curve.sol";
import "../../lib/balancer/Balancer.sol";
import "../../lib/uniswapv3/UniswapV3.sol";
import "../../lib/aavee2/Aavee2.sol";
import "../../lib/oneinchlp/OneInchPool.sol";
import "../../lib/mstable/MStable.sol";
import "../../lib/curve/CurveV2.sol";
import "../IAdapter.sol";

/**
* @dev This contract will route call to:
* 1- 0xV4
* 2- 0xV2
* 3- Curve
* 4- UniswapV2Forks
* 5- Balancer
* 6- UniswapV3
* 7- Aavee2
* 8- OneInchPool
* 9- MStable
* 10- CurveV2
* The above are the indexes
*/
contract Adapter01 is IAdapter, NewUniswapV2, ZeroxV4, ZeroxV2, Curve, Balancer, UniswapV3, Aavee2, OneInchPool, MStable, CurveV2 {
    using SafeMath for uint256;

    constructor(
        address _erc20Proxy,
        uint16 _aaveeRefCode,
        address _aaveeLendingPool,
        address _aaveeWethGateway,
        address _weth
    )
        WethProvider(_weth)
        Aavee2(_aaveeRefCode, _aaveeLendingPool, _aaveeWethGateway)
        ZeroxV2(_erc20Proxy)
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
            if (route[i].index == 1) {
                //swap on 0xV4
                swapOnZeroXv4(
                    fromToken,
                    toToken,
                    fromAmount.mul(route[i].percent).div(10000),
                    route[i].targetExchange,
                    route[i].payload
                );
            }
            else if (route[i].index == 2) {
                //swap on 0xV2
                swapOnZeroXv2(
                    fromToken,
                    toToken,
                    fromAmount.mul(route[i].percent).div(10000),
                    route[i].targetExchange,
                    route[i].payload
                );
            }
            else if (route[i].index == 3) {
                //swap on curve
                swapOnCurve(
                    fromToken,
                    toToken,
                    fromAmount.mul(route[i].percent).div(10000),
                    route[i].targetExchange,
                    route[i].payload
                );
            }
            else if (route[i].index == 4) {
                //swap on uniswapV2Fork
                swapOnUniswapV2Fork(
                    fromToken,
                    toToken,
                    fromAmount.mul(route[i].percent).div(10000),
                    route[i].payload
                );
            }
            else if (route[i].index == 5) {
                //swap on balancer
                swapOnBalancer(
                    fromToken,
                    toToken,
                    fromAmount.mul(route[i].percent).div(10000),
                    route[i].targetExchange,
                    route[i].payload
                );
            }
            else if (route[i].index == 6) {
                //swap on uniswapv3
                swapOnUniswapV3(
                    fromToken,
                    toToken,
                    fromAmount.mul(route[i].percent).div(10000),
                    route[i].targetExchange,
                    route[i].payload
                );
            }
            else if (route[i].index == 7) {
                //swap on aavee2
                swapOnAaveeV2(
                    fromToken,
                    toToken,
                    fromAmount.mul(route[i].percent).div(10000),
                    route[i].payload
                );
            }
            else if (route[i].index == 8) {
                //swap on oneinch
                swapOnOneInch(
                    fromToken,
                    toToken,
                    fromAmount.mul(route[i].percent).div(10000),
                    route[i].targetExchange
                );
            }
            else if (route[i].index == 9) {
                //swap on Mstable
                swapOnMStable(
                    fromToken,
                    toToken,
                    fromAmount.mul(route[i].percent).div(10000),
                    route[i].targetExchange,
                    route[i].payload
                );
            }
            else if (route[i].index == 10) {
                //swap on CurveV2
                swapOnCurveV2(
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
