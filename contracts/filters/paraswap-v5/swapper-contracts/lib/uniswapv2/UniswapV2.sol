pragma solidity 0.7.5;
pragma experimental ABIEncoderV2;


import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import '@uniswap/lib/contracts/libraries/TransferHelper.sol';

import './UniswapV2Lib.sol';
import "../Utils.sol";
import '../weth/IWETH.sol';
import "../WethProvider.sol";


abstract contract UniswapV2 is WethProvider {
    using SafeMath for uint256;

    address immutable public factory;
    bytes32 immutable public initCode;
    uint256 immutable public fee;
    uint256 immutable public feeFactor;

    struct UniswapV2Data {
        address[] path;
    }

    struct UniswapV2ForkData {
        address[] path;
        uint256 fee;
        uint256 feeFactor;
        address factory;
        bytes32 initCode;
    }

    constructor(
        address _factory,
        bytes32 _initCode,
        uint256 _fee,
        uint256 _feeFactor
    )
    {
       factory = _factory;
       initCode = _initCode;
       fee = _fee;
       feeFactor = _feeFactor;
    }

    function swapOnUniswap(
        IERC20 fromToken,
        IERC20 toToken,
        uint256 fromAmount,
        bytes calldata payload
    )
        internal
    {

        UniswapV2Data memory data = abi.decode(payload, (UniswapV2Data));
        _swapOnUniswapV2(
            fromAmount,
            data.path
        );

    }

    function buyOnUniswap(
        IERC20 fromToken,
        IERC20 toToken,
        uint256 fromAmount,
        uint256 toAmount,
        bytes calldata payload
    )
        internal
    {

        UniswapV2Data memory data = abi.decode(payload, (UniswapV2Data));

        _buyOnUniswapV2(
            fromAmount,
            toAmount,
            fee,
            feeFactor,
            factory,
            initCode,
            data.path
        );
    }

    function swapOnUniswapFork(
        IERC20 fromToken,
        IERC20 toToken,
        uint256 fromAmount,
        bytes calldata payload
    )
        internal
    {

        UniswapV2ForkData memory data = abi.decode(payload, (UniswapV2ForkData));
        _swapOnUniswapV2Fork(
            fromAmount,
            data.path,
            data
        );

    }

    function buyOnUniswapFork(
        IERC20 fromToken,
        IERC20 toToken,
        uint256 fromAmount,
        uint256 toAmount,
        bytes calldata payload
    )
        internal
    {

        UniswapV2ForkData memory data = abi.decode(payload, (UniswapV2ForkData));

        _buyOnUniswapV2(
            fromAmount,
            toAmount,
            data.fee,
            data.feeFactor,
            data.factory,
            data.initCode,
            data.path
        );
    }

    function _buyOnUniswapV2(
        uint256 amountInMax,
        uint256 amountOut,
        uint256 _fee,
        uint256 _feeFactor,
        address _factory,
        bytes32 _initCode,
        address[] memory path
    )
        private
        returns (uint256 tokensSold)
    {

        require(path.length > 1, "More than 1 token required");
        bool tokensBoughtEth;
        uint8 length = uint8(path.length);

        uint256[] memory amounts = new uint256[](length);
        address[] memory pairs = new address[](length - 1);

        amounts[length - 1] = amountOut;

        for (uint8 i = length - 1; i > 0; i--) {
            (amounts[i - 1], pairs[i - 1]) = UniswapV2Lib.getAmountInAndPair(
                _factory,
                amounts[i],
                path[i-1],
                path[i],
                _initCode,
                _fee,
                _feeFactor,
                WETH
            );
        }

        tokensSold = amounts[0];
        require(tokensSold <= amountInMax, "UniswapV3Router: INSUFFICIENT_INPUT_AMOUNT");

        for(uint8 i = 0; i < length - 1; i++) {
            address tokenSold = path[i];
            address tokenBought = path[i+1];

            if (i == length - 2) {
                if (tokenBought == Utils.ethAddress()) {
                    tokenBought = WETH;
                    tokensBoughtEth = true;
                }
            }
            if (i == 0) {
                if (tokenSold == Utils.ethAddress()) {
                    tokenSold = WETH;
                    IWETH(WETH).deposit{value: tokensSold}();
                    assert(IWETH(WETH).transfer(pairs[i], tokensSold));
                }
                else {
                    TransferHelper.safeTransfer(
                        tokenSold, pairs[i], tokensSold
                    );
                }
            }

            address receiver;

            if (i == length - 2) {

                receiver = address(this);

            }
            else {
                receiver = pairs[i+1];
            }

            (address token0,) = UniswapV2Lib.sortTokens(tokenSold, tokenBought);
            (uint256 amount0Out, uint256 amount1Out) = tokenSold == token0 ? (uint256(0), amounts[i+1]) : (amounts[i+1], uint256(0));
            IUniswapV2Pair(pairs[i]).swap(
                amount0Out, amount1Out, receiver, new bytes(0)
            );

        }
        if (tokensBoughtEth) {
            IWETH(WETH).withdraw(amountOut);
        }
    }

    function _swapOnUniswapV2Fork(
        uint256 fromAmount,
        address[] memory path,
        UniswapV2ForkData memory data
    )
        private
        returns(uint256 tokensBought)
    {
        require(path.length > 1, "More than 1 token required");
        uint8 pairs = uint8(path.length - 1);
        bool tokensBoughtEth;
        tokensBought = fromAmount;
        address receiver;

        for(uint8 i = 0; i < pairs; i++) {
            address tokenSold = path[i];
            address tokenBought = path[i+1];

            address currentPair = receiver;
            if (i == pairs - 1) {
                if (tokenBought == Utils.ethAddress()) {
                    tokenBought = WETH;
                    tokensBoughtEth = true;
                }
            }
            if (i == 0) {
                if (tokenSold == Utils.ethAddress()) {
                    tokenSold = WETH;
                    currentPair = UniswapV2Lib.pairFor(data.factory, tokenSold, tokenBought, data.initCode);
                    IWETH(WETH).deposit{value: fromAmount}();
                    assert(IWETH(WETH).transfer(currentPair, fromAmount));
                }
                else {
                    currentPair = UniswapV2Lib.pairFor(data.factory, tokenSold, tokenBought, data.initCode);
                    TransferHelper.safeTransfer(
                        tokenSold, currentPair, fromAmount
                    );
                }
            }

            tokensBought = UniswapV2Lib.getAmountOutByPair(tokensBought, currentPair, tokenSold, tokenBought, data.fee, data.feeFactor);

            if ((i + 1) == pairs) {
                receiver = address(this);
            }
            else {
                receiver = UniswapV2Lib.pairFor(data.factory, tokenBought, path[i+2] == Utils.ethAddress() ? WETH : path[i+2], data.initCode);
            }

            (address token0,) = UniswapV2Lib.sortTokens(tokenSold, tokenBought);
            (uint256 amount0Out, uint256 amount1Out) = tokenSold == token0 ? (uint256(0), tokensBought) : (tokensBought, uint256(0));
            IUniswapV2Pair(currentPair).swap(
                amount0Out, amount1Out, receiver, new bytes(0)
            );

        }

        if (tokensBoughtEth) {
            IWETH(WETH).withdraw(tokensBought);
        }
    }

    function _swapOnUniswapV2(
        uint256 fromAmount,
        address[] memory path
    )
        private
        returns(uint256 tokensBought)
    {
        require(path.length > 1, "More than 1 token required");
        uint8 pairs = uint8(path.length - 1);
        bool tokensBoughtEth;
        tokensBought = fromAmount;
        address receiver;

        for(uint8 i = 0; i < pairs; i++) {
            address tokenSold = path[i];
            address tokenBought = path[i+1];

            address currentPair = receiver;
            if (i == pairs - 1) {
                if (tokenBought == Utils.ethAddress()) {
                    tokenBought = WETH;
                    tokensBoughtEth = true;
                }
            }
            if (i == 0) {
                if (tokenSold == Utils.ethAddress()) {
                    tokenSold = WETH;
                    currentPair = UniswapV2Lib.pairFor(factory, tokenSold, tokenBought, initCode);
                    IWETH(WETH).deposit{value: fromAmount}();
                    assert(IWETH(WETH).transfer(currentPair, fromAmount));
                }
                else {
                    currentPair = UniswapV2Lib.pairFor(factory, tokenSold, tokenBought, initCode);
                    TransferHelper.safeTransfer(
                        tokenSold, currentPair, fromAmount
                    );
                }
            }

            tokensBought = UniswapV2Lib.getAmountOutByPair(tokensBought, currentPair, tokenSold, tokenBought, fee, feeFactor);

            if ((i + 1) == pairs) {
                receiver = address(this);
            }
            else {
                receiver = UniswapV2Lib.pairFor(factory, tokenBought, path[i+2] == Utils.ethAddress() ? WETH : path[i+2], initCode);
            }

            (address token0,) = UniswapV2Lib.sortTokens(tokenSold, tokenBought);
            (uint256 amount0Out, uint256 amount1Out) = tokenSold == token0 ? (uint256(0), tokensBought) : (tokensBought, uint256(0));
            IUniswapV2Pair(currentPair).swap(
                amount0Out, amount1Out, receiver, new bytes(0)
            );

        }

        if (tokensBoughtEth) {
            IWETH(WETH).withdraw(tokensBought);
        }
    }
}
