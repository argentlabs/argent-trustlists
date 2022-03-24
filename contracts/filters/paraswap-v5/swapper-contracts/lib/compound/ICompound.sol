pragma solidity 0.7.5;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";


abstract contract ICToken is IERC20 {
    function redeem(uint redeemTokens) external virtual returns (uint);

    function redeemUnderlying(uint redeemAmount) external virtual returns (uint);
}


abstract contract ICEther is ICToken {
    function mint() external virtual payable;
}


abstract contract ICERC20 is ICToken {
    function mint(uint mintAmount) external virtual returns (uint);

    function underlying() external virtual view returns (address token);
}
