pragma solidity 0.7.5;

interface IBakeryPair {

    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
    function swap(
        uint amount0Out,
        uint amount1Out,
        address to
    )
    external;
}
