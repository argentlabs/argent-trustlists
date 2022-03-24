pragma solidity =0.7.5;

import '@uniswap/lib/contracts/libraries/TransferHelper.sol';

import './UniswapV2Lib.sol';
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import '../weth/IWETH.sol';

contract UniswapV2ExchangeRouter {
    using SafeMath for uint;

    address public immutable factory;
    address public immutable WETH;
    address public constant ETH_IDENTIFIER = address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);
    bytes32 public immutable initCode;
    uint256 public immutable fee;
    uint256 public immutable feeFactor;

    constructor(
        address _factory,
        address _WETH,
        bytes32 _initCode,
        uint256 _fee,
        uint256 _feeFactor
    )
        public
    {
        factory = _factory;
        WETH = _WETH;
        initCode = _initCode;
        fee = _fee;
        feeFactor = _feeFactor;
    }

    receive() external payable {
    }

    function swap(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path
    )
        external
        payable
        returns (uint256 tokensBought)
    {
        require(path.length > 1, "More than 1 token required");
        uint8 pairs = uint8(path.length - 1);
        bool tokensBoughtEth;
        tokensBought = amountIn;
        address receiver;

        for(uint8 i = 0; i < pairs; i++) {
            address tokenSold = path[i];
            address tokenBought = path[i+1];

            address currentPair = receiver;

            if (i == pairs - 1) {
                if (tokenBought == ETH_IDENTIFIER) {
                    tokenBought = WETH;
                    tokensBoughtEth = true;
                }
            }
            if (i == 0) {
                if (tokenSold == ETH_IDENTIFIER) {
                    tokenSold = WETH;
                    currentPair = UniswapV2Lib.pairFor(factory, tokenSold, tokenBought, initCode);
                    uint256 amount = msg.value;
                    IWETH(WETH).deposit{value: amount}();
                    assert(IWETH(WETH).transfer(currentPair, amount));
                }
                else {
                    currentPair = UniswapV2Lib.pairFor(factory, tokenSold, tokenBought, initCode);
                    TransferHelper.safeTransferFrom(
                        tokenSold, msg.sender, currentPair, amountIn
                    );
                }
            }

            //AmountIn for this hop is amountOut of previous hop
            tokensBought = UniswapV2Lib.getAmountOutByPair(tokensBought, currentPair, tokenSold, tokenBought, fee, feeFactor);

            if ((i + 1) == pairs) {
                if ( tokensBoughtEth ) {
                    receiver = address(this);
                }
                else {
                    receiver = msg.sender;
                }
            }
            else {
                receiver = UniswapV2Lib.pairFor(factory, tokenBought, path[i+2] == ETH_IDENTIFIER ? WETH : path[i+2], initCode);
            }

            (address token0,) = UniswapV2Lib.sortTokens(tokenSold, tokenBought);
            (uint256 amount0Out, uint256 amount1Out) = tokenSold == token0 ? (uint256(0), tokensBought) : (tokensBought, uint256(0));
            IUniswapV2Pair(currentPair).swap(
                amount0Out, amount1Out, receiver, new bytes(0)
            );

        }

        if (tokensBoughtEth) {
            IWETH(WETH).withdraw(tokensBought);
            TransferHelper.safeTransferETH(msg.sender, tokensBought);
        }

        require(tokensBought >= amountOutMin, "UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT");

    }

    function buy(
        uint256 amountInMax,
        uint256 amountOut,
        address[] calldata path
    )
        external
        payable
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
                factory,
                amounts[i],
                path[i-1],
                path[i],
                initCode,
                fee,
                feeFactor,
                WETH
            );
        }

        tokensSold = amounts[0];
        require(tokensSold <= amountInMax, "UniswapV3Router: INSUFFICIENT_INPUT_AMOUNT");

        for(uint8 i = 0; i < length - 1; i++) {
            address tokenSold = path[i];
            address tokenBought = path[i+1];

            if (i == length - 2) {
                if (tokenBought == ETH_IDENTIFIER) {
                    tokenBought = WETH;
                    tokensBoughtEth = true;
                }
            }
            if (i == 0) {
                if (tokenSold == ETH_IDENTIFIER) {
                    tokenSold = WETH;
                    TransferHelper.safeTransferETH(msg.sender, msg.value.sub(tokensSold));
                    IWETH(WETH).deposit{value: tokensSold}();
                    assert(IWETH(WETH).transfer(pairs[i], tokensSold));
                }
                else {
                    TransferHelper.safeTransferFrom(
                        tokenSold, msg.sender, pairs[i], tokensSold
                    );
                }
            }

            address receiver;

            if (i == length - 2) {
                if (tokensBoughtEth) {
                    receiver = address(this);
                }
                else {
                    receiver = msg.sender;
                }
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
            TransferHelper.safeTransferETH(msg.sender, amountOut);
        }
    }
}
