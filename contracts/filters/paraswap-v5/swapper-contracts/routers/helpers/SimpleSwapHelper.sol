pragma solidity 0.7.5;

import "../../lib/Utils.sol";
import "../../lib/weth/IWETH.sol";

contract SimpleSwapHelper {

    function approve(
        address token,
        address to,
        uint256 amount
    )
        external
    {
        require(
            msg.sender == address(this),
            "SimpleSwap: Invalid access"
        );
        Utils.approve(to, token, amount);
    }

    function withdrawAllWETH(IWETH token) external {
      require(
          msg.sender == address(this),
          "SimpleSwap: Invalid access"
      );
      uint256 amount = token.balanceOf(address(this));
      token.withdraw(amount);
    }

}