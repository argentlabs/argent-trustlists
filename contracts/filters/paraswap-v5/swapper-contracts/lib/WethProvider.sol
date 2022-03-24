pragma solidity 0.7.5;


contract WethProvider {
    address public immutable WETH;

    constructor(address weth) public {
        WETH = weth;
    }
}