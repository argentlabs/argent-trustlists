pragma solidity 0.7.5;
pragma experimental ABIEncoderV2;

import "../Utils.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "./ICurveV1Fork.sol";

contract CurveV1ForkAdapter {
    struct CurveV1ForkData {
        uint8 i;
        uint8 j;
        uint256 deadline;
    }

    function swapOnCurveV1Fork(
        IERC20 fromToken,
        IERC20 toToken,
        uint256 fromAmount,
        address exchange,
        bytes calldata payload
    )
    internal

    {

        CurveV1ForkData memory curveV1ForkData = abi.decode(payload, (CurveV1ForkData));

        Utils.approve(address(exchange), address(fromToken), fromAmount);

        ICurveV1Fork(exchange).swap(curveV1ForkData.i, curveV1ForkData.j, fromAmount, 1, curveV1ForkData.deadline);

    }
}
