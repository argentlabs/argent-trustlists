pragma solidity 0.7.5;
pragma experimental ABIEncoderV2;


import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "../Utils.sol";
import "./ICoFiXRouter.sol";


contract CoFiX {
    using SafeMath for uint256;

    struct CofixData {
        uint256 networkFee;
    }

    address public immutable rewardReceiver;

    constructor(address _rewardReceiver) public {
        rewardReceiver = _rewardReceiver;
    }

    function swapOnCofix(
        IERC20 fromToken,
        IERC20 toToken,
        uint256 fromAmount,
        uint256 toAmount,
        address exchange,
        bytes calldata payload
    )
        internal

    {
        Utils.approve(address(exchange), address(fromToken), fromAmount);
        CofixData memory data = abi.decode(payload, (CofixData));

        if (address(fromToken) == Utils.ethAddress()) {
            ICoFiXRouter(exchange).swapExactETHForTokens{value: data.networkFee + fromAmount}(
                address(toToken),
                fromAmount,
                toAmount,
                address(this),
                rewardReceiver,
                block.timestamp
            );
        }
        else if (address(toToken) == Utils.ethAddress()) {
            ICoFiXRouter(exchange).swapExactTokensForETH{value: data.networkFee}(
                address(fromToken),
                fromAmount,
                toAmount,
                address(this),
                rewardReceiver,
                block.timestamp
            );
        }
        else {
            ICoFiXRouter(exchange).swapExactTokensForTokens{value: data.networkFee}(
                address(fromToken),
                address(toToken),
                fromAmount,
                toAmount,
                address(this),
                rewardReceiver,
                block.timestamp
            );
        }
    }
}
