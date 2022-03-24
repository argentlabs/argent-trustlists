pragma solidity 0.7.5;

interface IBProtocolAMM {
    function swap(
        uint lusdAmount,
        uint minEthReturn,
        address payable dest
    ) external returns(uint);
}
