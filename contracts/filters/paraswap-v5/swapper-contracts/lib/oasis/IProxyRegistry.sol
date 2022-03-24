pragma solidity 0.7.5;


interface IProxyRegistry {

    function proxies(address account) external view returns(address);
}
