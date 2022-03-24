pragma solidity 0.7.5;

interface ICurveV2Pool {
    function exchange_underlying(uint256 i, uint256 j, uint256 dx, uint256 minDy) external;
    function exchange(uint256 i, uint256 j, uint256 dx, uint256 minDy) external;
}
