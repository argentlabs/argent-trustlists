pragma solidity 0.7.5;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

import "./IBETH.sol";
import "../Utils.sol";


contract BethExchange {

    address public immutable beth;

    constructor(address _beth) public {
        beth =_beth;
    }

    function swapOnBeth(
        IERC20 fromToken,
        IERC20 toToken,
        uint256 fromAmount
    )
        internal

    {
        _swapOnBeth(
            fromToken,
            toToken,
            fromAmount
        );
    }

    function buyOnBeth(
        IERC20 fromToken,
        IERC20 toToken,
        uint256 fromAmount
    )
        internal

    {

        _swapOnBeth(
            fromToken,
            toToken,
            fromAmount
        );
    }

    function _swapOnBeth(
        IERC20 fromToken,
        IERC20 toToken,
        uint256 fromAmount
    )
        private
    {

        Utils.approve(address(beth), address(fromToken), fromAmount);

        if (address(fromToken) == beth){
            require(address(toToken) == Utils.ethAddress(), "Destination token should be ETH");
            IBETH(beth).withdraw(fromAmount);
        }
        else if (address(fromToken) == Utils.ethAddress()) {
            require(address(toToken) == beth, "Destination token should be beth");
            IBETH(beth).deposit{value: fromAmount}();
        }
        else {
            revert("Invalid fromToken");
        }
    }
}
