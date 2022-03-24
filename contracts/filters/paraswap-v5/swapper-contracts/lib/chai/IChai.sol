pragma solidity 0.7.5;


interface IChai {

    function join(address dst, uint wad) external;

    function exit(address src, uint wad) external;
}
