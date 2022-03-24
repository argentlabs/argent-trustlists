pragma solidity 0.7.5;

interface ICurveV1Fork {
    function swap(
        uint8 tokenIndexFrom,
        uint8 tokenIndexTo,
        uint256 dx,
        uint256 minDy,
        uint256 deadline
    )
    external;
}
