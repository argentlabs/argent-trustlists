pragma solidity 0.7.5;
pragma experimental ABIEncoderV2;

interface IAugustusSwapperV5 {
    function hasRole(bytes32 role, address account) external view returns (bool);
}