pragma solidity 0.7.5;
pragma experimental ABIEncoderV2;


import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

import "./IIdle.sol";
import "../Utils.sol";

contract Idle {

    struct IdleData {
        address idleToken;
    }

    function swapOnIdle(
        IERC20 fromToken,
        IERC20 toToken,
        uint256 fromAmount,
        bytes calldata payload
    )
        internal

    {
        _swapOnIdle(
            fromToken,
            toToken,
            fromAmount,
            payload
        );

    }

    function buyOnIdle(
        IERC20 fromToken,
        IERC20 toToken,
        uint256 fromAmount,
        bytes calldata payload
    )
        internal

    {
        _swapOnIdle(
            fromToken,
            toToken,
            fromAmount,
            payload
        );

    }

    function _swapOnIdle(
        IERC20 fromToken,
        IERC20 toToken,
        uint256 fromAmount,
        bytes memory payload
    )
        private
    {

        IdleData memory data = abi.decode(payload, (IdleData));

        Utils.approve(address(data.idleToken), address(fromToken), fromAmount);

        if (address(fromToken) == address(data.idleToken)) {
            require(
                IIdle(data.idleToken).token() == address(toToken),
                "Invalid to token"
            );

            IIdle(data.idleToken).redeemIdleToken(
                fromAmount,
                false,
                new uint256[](0)
            );
        }
        else if (address(toToken) == address(data.idleToken)) {
            require(
                IIdle(data.idleToken).token() == address(fromToken),
                "Invalid to token"
            );
            IIdle(data.idleToken).mintIdleToken(
                fromAmount,
                new uint256[](0)
            );
        }
        else {
            revert("Invalid token pair!!");
        }
    }
}
