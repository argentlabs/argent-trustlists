// Copyright (C) 2020  Argent Labs Ltd. <https://argent.xyz>

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.3;

/**
 * @title ParaswapUtils
 * @notice Common methods used by Paraswap filters
 */
library ParaswapUtils {
    address constant internal ETH_TOKEN = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    // ERC20, ERC721 & ERC1155 transfers & approvals used by recoverSpender()
    bytes4 private constant ERC20_TRANSFER = bytes4(keccak256("transfer(address,uint256)"));
    bytes4 private constant ERC20_APPROVE = bytes4(keccak256("approve(address,uint256)"));
    bytes4 private constant ERC721_SET_APPROVAL_FOR_ALL = bytes4(keccak256("setApprovalForAll(address,bool)"));
    bytes4 private constant ERC721_TRANSFER_FROM = bytes4(keccak256("transferFrom(address,address,uint256)"));
    bytes4 private constant ERC721_SAFE_TRANSFER_FROM = bytes4(keccak256("safeTransferFrom(address,address,uint256)"));
    bytes4 private constant ERC721_SAFE_TRANSFER_FROM_BYTES = bytes4(keccak256("safeTransferFrom(address,address,uint256,bytes)"));
    bytes4 private constant ERC1155_SAFE_TRANSFER_FROM = bytes4(keccak256("safeTransferFrom(address,address,uint256,uint256,bytes)"));

    struct ZeroExV2Order {
        address makerAddress;
        address takerAddress;
        address feeRecipientAddress;
        address senderAddress;
        uint256 makerAssetAmount;
        uint256 takerAssetAmount;
        uint256 makerFee;
        uint256 takerFee;
        uint256 expirationTimeSeconds;
        uint256 salt;
        bytes makerAssetData;
        bytes takerAssetData;
    }

    struct ZeroExV2Data {
        ZeroExV2Order[] orders;
        bytes[] signatures;
    }

    struct ZeroExV4Order {
        address makerToken;
        address takerToken;
        uint128 makerAmount;
        uint128 takerAmount;
        address maker;
        address taker;
        address txOrigin;
        bytes32 pool;
        uint64 expiry;
        uint256 salt;
    }

    struct ZeroExV4Signature {
        uint8 signatureType;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    struct ZeroExV4Data {
        ZeroExV4Order order;
        ZeroExV4Signature signature;
    }

    /**
    * @notice Helper method to recover the spender from a contract call. 
    * The method returns the contract unless the call is to a standard method of a ERC20/ERC721/ERC1155 token
    * in which case the spender is recovered from the data.
    * @param _to The target contract.
    * @param _data The data payload.
    */
    function recoverSpender(address _to, bytes memory _data) internal pure returns (address spender) {
        if(_data.length >= 68) {
            bytes4 methodId;
            // solhint-disable-next-line no-inline-assembly
            assembly {
                methodId := mload(add(_data, 0x20))
            }
            if(
                methodId == ERC20_TRANSFER ||
                methodId == ERC20_APPROVE ||
                methodId == ERC721_SET_APPROVAL_FOR_ALL) 
            {
                // solhint-disable-next-line no-inline-assembly
                assembly {
                    spender := mload(add(_data, 0x24))
                }
                return spender;
            }
            if(
                methodId == ERC721_TRANSFER_FROM ||
                methodId == ERC721_SAFE_TRANSFER_FROM ||
                methodId == ERC721_SAFE_TRANSFER_FROM_BYTES ||
                methodId == ERC1155_SAFE_TRANSFER_FROM)
            {
                // solhint-disable-next-line no-inline-assembly
                assembly {
                    spender := mload(add(_data, 0x44))
                }
                return spender;
            }
        }

        spender = _to;
    }

    function hasValidUniV3Pool(
        address _fromToken,
        address _toToken,
        uint24 _fee,
        address _tokenRegistry,
        address _factory,
        bytes32 _initCode,
        address _weth
    )
        internal
        view
        returns (bool)
    {
        address poolToken = uniV3PoolFor(_fromToken, _toToken, _fee, _factory, _initCode, _weth);
        return hasTradableToken(_tokenRegistry, poolToken);
    }

    function hasValidUniV2Path(
        address[] memory _path,
        address _tokenRegistry,
        address _factory,
        bytes32 _initCode,
        address _weth
    )
        internal
        view
        returns (bool)
    {
        address[] memory lpTokens = new address[](_path.length - 1);
        for(uint i = 0; i < lpTokens.length; i++) {
            lpTokens[i] = uniV2PairFor(_path[i], _path[i+1], _factory, _initCode, _weth);
        }
        return hasTradableTokens(_tokenRegistry, lpTokens);
    }

    function uniV3PoolFor(
        address _tokenA,
        address _tokenB,
        uint24 _fee,
        address _factory,
        bytes32 _initCode,
        address _weth
    )
        internal
        pure
        returns (address)
    {
        (address tokenA, address tokenB) = (_tokenA == ETH_TOKEN ? _weth : _tokenA, _tokenB == ETH_TOKEN ? _weth : _tokenB);
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        return(address(uint160(uint(keccak256(abi.encodePacked(
            hex"ff",
            _factory,
            keccak256(abi.encode(token0, token1, _fee)),
            _initCode
        ))))));
    }

    function uniV2PairFor(address _tokenA, address _tokenB, address _factory, bytes32 _initCode, address _weth) internal pure returns (address) {
        (address tokenA, address tokenB) = (_tokenA == ETH_TOKEN ? _weth : _tokenA, _tokenB == ETH_TOKEN ? _weth : _tokenB);
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        return(address(uint160(uint(keccak256(abi.encodePacked(
            hex"ff",
            _factory,
            keccak256(abi.encodePacked(token0, token1)),
            _initCode
        ))))));
    }

    function hasTradableTokens(address _tokenRegistry, address[] memory _tokens) internal view returns (bool) {
        (bool success, bytes memory res) = _tokenRegistry.staticcall(abi.encodeWithSignature("areTokensTradable(address[])", _tokens));
        return success && abi.decode(res, (bool));
    
    }
    function hasTradableToken(address _tokenRegistry, address _token) internal view returns (bool) {
        (bool success, bytes memory res) = _tokenRegistry.staticcall(abi.encodeWithSignature("isTokenTradable(address)", _token));
        return success && abi.decode(res, (bool));
    }
}
