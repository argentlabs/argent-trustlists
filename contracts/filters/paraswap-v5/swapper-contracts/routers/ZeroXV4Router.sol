pragma solidity 0.7.5;
pragma experimental ABIEncoderV2;

import "../AugustusStorage.sol";
import "./IRouter.sol";
import '../lib/weth/IWETH.sol';
import "../lib/zeroxv4/LibOrderV4.sol";
import "../lib/Utils.sol";


interface IZeroxV4 {

    function fillRfqOrder(
        // The order
        LibOrderV4.Order calldata order,
        // The signature
        LibOrderV4.Signature calldata signature,
        // How much taker token to fill the order with
        uint128 takerTokenFillAmount
    )
        external
        payable
        // How much maker token from the order the taker received.
        returns (uint128, uint128);
}

contract ZeroxV4Router is AugustusStorage, IRouter {

    address public immutable weth;

    struct ZeroxV4Data {
        LibOrderV4.Order order;
        LibOrderV4.Signature signature;
    }

    constructor(address _weth) public {
        weth = _weth;
    }

    function initialize(bytes calldata data) override external {
        revert("METHOD NOT IMPLEMENTED");
    }

    function getKey() override external pure returns(bytes32) {
        return keccak256(abi.encodePacked("ZEROX_V4_ROUTER", "1.0.0"));
    }

     function swapOnZeroXv4(
        IERC20 fromToken,
        IERC20 toToken,
        uint256 fromAmount,
        uint256 amountOutMin,
        address exchange,
        bytes calldata payload
    )
        external
        payable
    {
        address _fromToken = address(fromToken);
        address _toToken = address(toToken);

        if (address(fromToken) == Utils.ethAddress()) {
            require(fromAmount == msg.value, "Incorrect msg.value");
            IWETH(weth).deposit{value: fromAmount}();
            _fromToken = weth;
        } else {
            require(msg.value == 0, "Incorrect msg.value");
            transferTokensFromProxy(_fromToken, fromAmount);
        } 

        if (address(toToken) == Utils.ethAddress()) {
            _toToken = weth;
        }

        ZeroxV4Data memory data = abi.decode(payload, (ZeroxV4Data));
        require(address(data.order.takerToken) == address(_fromToken), "Invalid from token!!");
        require(address(data.order.makerToken) == address(_toToken), "Invalid to token!!");


        Utils.approve(exchange, address(_fromToken), fromAmount);
        IZeroxV4(exchange).fillRfqOrder(
            data.order,
            data.signature,
            uint128(fromAmount)
        );

        uint256 receivedAmount = Utils.tokenBalance(address(_toToken), address(this));
        require(receivedAmount >= amountOutMin, "Slippage check failed");

        if (address(toToken) == Utils.ethAddress()) {
            IWETH(weth).withdraw(receivedAmount);
        }

        Utils.transferTokens(address(toToken), msg.sender, receivedAmount);
    }

    function swapOnZeroXv4WithPermit(
        IERC20 fromToken,
        IERC20 toToken,
        uint256 fromAmount,
        uint256 amountOutMin,
        address exchange,
        bytes calldata payload,
        bytes calldata permit
    )
        external
        payable
    {
        address _fromToken = address(fromToken);
        address _toToken = address(toToken);

        if (address(fromToken) == Utils.ethAddress()) {
            require(fromAmount == msg.value, "Incorrect msg.value");
            IWETH(weth).deposit{value: fromAmount}();
            _fromToken = weth;
        } else {
            require(msg.value == 0, "Incorrect msg.value");
            Utils.permit(_fromToken, permit);
            transferTokensFromProxy(_fromToken, fromAmount);
        } 

        if (address(toToken) == Utils.ethAddress()) {
            _toToken = weth;
        }

        ZeroxV4Data memory data = abi.decode(payload, (ZeroxV4Data));
        require(address(data.order.takerToken) == address(_fromToken), "Invalid from token!!");
        require(address(data.order.makerToken) == address(_toToken), "Invalid to token!!");


        Utils.approve(exchange, address(_fromToken), fromAmount);
        IZeroxV4(exchange).fillRfqOrder(
            data.order,
            data.signature,
            uint128(fromAmount)
        );

        uint256 receivedAmount = Utils.tokenBalance(address(_toToken), address(this));
        require(receivedAmount >= amountOutMin, "Slippage check failed");

        if (address(toToken) == Utils.ethAddress()) {
            IWETH(weth).withdraw(receivedAmount);
        }

        Utils.transferTokens(address(toToken), msg.sender, receivedAmount);
    }

    function transferTokensFromProxy(
        address token,
        uint256 amount
    )
      private
    {
        if (token != Utils.ethAddress()) {
            tokenTransferProxy.transferFrom(
                token,
                msg.sender,
                address(this),
                amount
            );
        }
    }
}
