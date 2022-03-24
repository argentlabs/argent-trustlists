pragma solidity 0.7.5;
pragma experimental ABIEncoderV2;

import "../AugustusStorage.sol";
import "./IRouter.sol";
import '../lib/weth/IWETH.sol';
import "../lib/zeroxv2/LibOrderV2.sol";
import "../lib/libraries/LibBytes.sol";
import "../lib/Utils.sol";


interface IZeroxV2 {

    function marketSellOrdersNoThrow(
        LibOrderV2.Order[] calldata orders,
        uint256 takerAssetFillAmount,
        bytes[] calldata signatures
    )
        external
        returns(LibOrderV2.FillResults memory);
}

contract ZeroxV2Router is AugustusStorage, IRouter {
    using LibBytes for bytes;

    address public immutable weth;
    address public immutable erc20Proxy;

    struct ZeroxV2Data {
        LibOrderV2.Order[] orders;
        bytes[] signatures;
    }

    constructor(address _erc20Proxy, address _weth) public {
        erc20Proxy = _erc20Proxy;
        weth = _weth;
    }

    function initialize(bytes calldata data) override external {
        revert("METHOD NOT IMPLEMENTED");
    }

    function getKey() override external pure returns(bytes32) {
        return keccak256(abi.encodePacked("ZEROX_V2_ROUTER", "1.0.0"));
    }

     function swapOnZeroXv2(
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

        if (_fromToken == Utils.ethAddress()) {
            require(fromAmount == msg.value, "Incorrect msg.value");
            IWETH(weth).deposit{value: fromAmount}();
            _fromToken = weth;
        } else {
            require(msg.value == 0, "Incorrect msg.value");
            transferTokensFromProxy(_fromToken, fromAmount);
        }

        if (_toToken == Utils.ethAddress()) {
            _toToken = weth;
        } 

        ZeroxV2Data memory data = abi.decode(payload, (ZeroxV2Data));

        for (uint256 i = 0; i < data.orders.length; i++) {
            address srcToken = data.orders[i].takerAssetData.readAddress(16);
            require(srcToken == address(_fromToken), "Invalid from token!!");

            address destToken = data.orders[i].makerAssetData.readAddress(16);
            require(destToken == address(_toToken), "Invalid to token!!");
        }


        Utils.approve(erc20Proxy, address(_fromToken), fromAmount);

        IZeroxV2(exchange).marketSellOrdersNoThrow(
            data.orders,
            fromAmount,
            data.signatures
        );

        uint256 receivedAmount = Utils.tokenBalance(address(_toToken), address(this));
        require(receivedAmount >= amountOutMin, "Slippage check failed");

        if (address(toToken) == Utils.ethAddress()) {
            IWETH(weth).withdraw(receivedAmount);
        }

        Utils.transferTokens(address(toToken), msg.sender, receivedAmount);
    }

    function swapOnZeroXv2WithPermit(
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

        if (_fromToken == Utils.ethAddress()) {
            require(fromAmount == msg.value, "Incorrect msg.value");
            IWETH(weth).deposit{value: fromAmount}();
            _fromToken = weth;
        } else {
            require(msg.value == 0, "Incorrect msg.value");
            Utils.permit(_fromToken, permit);
            transferTokensFromProxy(_fromToken, fromAmount);
        }

        if (_toToken == Utils.ethAddress()) {
            _toToken = weth;
        } 

        ZeroxV2Data memory data = abi.decode(payload, (ZeroxV2Data));

        for (uint256 i = 0; i < data.orders.length; i++) {
            address srcToken = data.orders[i].takerAssetData.readAddress(16);
            require(srcToken == address(_fromToken), "Invalid from token!!");

            address destToken = data.orders[i].makerAssetData.readAddress(16);
            require(destToken == address(_toToken), "Invalid to token!!");
        }


        Utils.approve(erc20Proxy, address(_fromToken), fromAmount);

        IZeroxV2(exchange).marketSellOrdersNoThrow(
            data.orders,
            fromAmount,
            data.signatures
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
