pragma solidity 0.7.5;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

interface ISwapRouterOneBit {
    function swapTokensWithTrust(
        IERC20 srcToken,
        IERC20 destToken,
        uint srcAmount,
        uint destAmountMin,
        address to
    ) external returns (uint destAmount);
}
