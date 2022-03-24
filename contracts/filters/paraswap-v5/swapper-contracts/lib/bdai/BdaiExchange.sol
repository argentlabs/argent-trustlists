pragma solidity 0.7.5;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

import "./IBdai.sol";
import "../Utils.sol";


contract BdaiExchange {

    address public immutable bdai;
    address public immutable dai;

   constructor(address _bdai, address _dai) public {
       bdai = _bdai;
       dai = _dai;
   }

    function swapOnBdai(
        IERC20 fromToken,
        IERC20 toToken,
        uint256 fromAmount
    )
        internal

    {

        _swapOnBdai(
            fromToken,
            toToken,
            fromAmount
        );
    }

    function buyOnBdai(
        IERC20 fromToken,
        IERC20 toToken,
        uint256 fromAmount
    )
        internal

    {

        _swapOnBdai(
            fromToken,
            toToken,
            fromAmount
        );
    }

    function _swapOnBdai(
        IERC20 fromToken,
        IERC20 toToken,
        uint256 fromAmount
    )
        private
    {

        Utils.approve(address(bdai), address(fromToken), fromAmount);

        if (address(fromToken) == bdai){
            require(address(toToken) == dai, "Destination token should be dai");
            IBdai(bdai).exit(fromAmount);
        }
        else if (address(fromToken) == dai) {
            require(address(toToken) == bdai, "Destination token should be bdai");
            IBdai(bdai).join(fromAmount);
        }
        else {
            revert("Invalid fromToken");
        }
    }
}
