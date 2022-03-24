pragma solidity 0.7.5;
pragma experimental ABIEncoderV2;


interface ITokenTransferProxy {

    function transferFrom(
        address token,
        address from,
        address to,
        uint256 amount
    )
        external;
}
