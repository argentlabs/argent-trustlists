pragma solidity >=0.5.0;

import "./IUniswapV2Pair.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";


library UniswapV2Lib {
    using SafeMath for uint256;

    function checkAndConvertETHToWETH(address token, address weth) internal pure returns(address) {

        if(token == address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE)) {
            return weth;
        }
        return token;
    }

    // returns sorted token addresses, used to handle return values from pairs sorted in this order
    function sortTokens(address tokenA, address tokenB) internal pure returns (address, address) {

        return(tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA));
    }

    // calculates the CREATE2 address for a pair without making any external calls
    function pairFor(
        address factory,
        address tokenA,
        address tokenB,
        bytes32 initCode
    )
        internal
        pure
        returns (address)
    {
        (address token0, address token1) = sortTokens(tokenA, tokenB);
        return(address(uint(keccak256(abi.encodePacked(
            hex"ff",
            factory,
            keccak256(abi.encodePacked(token0, token1)),
            initCode // init code hash
        )))));
    }

    function getReservesByPair(
        address pair,
        address tokenA,
        address tokenB
    )
        internal
        view
        returns (uint256 reserveA, uint256 reserveB)
    {
        (address token0,) = sortTokens(tokenA, tokenB);
        (uint256 reserve0, uint256 reserve1,) = IUniswapV2Pair(pair).getReserves();
        (reserveA, reserveB) = tokenA == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
    }

    // given an input amount of an asset and pair reserves, returns the maximum output amount of the other asset
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut,
        uint256 fee,
        uint256 feeFactor
    )
        internal
        pure
        returns (uint256 amountOut)
    {
        require(amountIn > 0, "UniswapV3Library: INSUFFICIENT_INPUT_AMOUNT");
        uint256 amountInWithFee = amountIn.mul(fee);
        uint256 numerator = amountInWithFee.mul(reserveOut);
        uint256 denominator = reserveIn.mul(feeFactor).add(amountInWithFee);
        amountOut = uint256(numerator / denominator);
    }

    // given an output amount of an asset and pair reserves, returns a required input amount of the other asset
    function getAmountInAndPair(
        address factory,
        uint amountOut,
        address tokenA,
        address tokenB,
        bytes32 initCode,
        uint256 fee,
        uint256 feeFactor,
        address weth
    )
        internal
        view
        returns (uint256 amountIn, address pair)
    {
        tokenA = checkAndConvertETHToWETH(tokenA, weth);
        tokenB = checkAndConvertETHToWETH(tokenB, weth);

        pair = pairFor(factory, tokenA, tokenB, initCode);
        (uint256 reserveIn, uint256 reserveOut) = getReservesByPair(pair, tokenA, tokenB);
        require(amountOut > 0, "UniswapV3Library: INSUFFICIENT_OUTPUT_AMOUNT");
        require(reserveOut > amountOut, "UniswapV3Library: reserveOut should be greater than amountOut");
        uint numerator = reserveIn.mul(amountOut).mul(feeFactor);
        uint denominator = reserveOut.sub(amountOut).mul(fee);
        amountIn = (numerator / denominator).add(1);
    }

    function getAmountOutByPair(
        uint256 amountIn,
        address pair,
        address tokenA,
        address tokenB,
        uint256 fee,
        uint256 feeFactor
    )
        internal
        view
        returns(uint256 amountOut)
    {
        (uint256 reserveIn, uint256 reserveOut) = getReservesByPair(pair, tokenA, tokenB);
        return (getAmountOut(amountIn, reserveIn, reserveOut, fee, feeFactor));
    }
}
