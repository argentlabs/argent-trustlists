// Copyright (C) 2021  Argent Labs Ltd. <https://argent.xyz>

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

import "../BaseFilter.sol";

contract ParaswapV5Filter is BaseFilter {

    bytes4 private constant DELEGATE_TO_PARASWAP = bytes4(keccak256("delegateToParaswap(bytes,bytes)"));

    address private immutable agsAddress;

    constructor(address _agsAddress) {
        agsAddress = _agsAddress;
    }

    function isValid(address /*_wallet*/, address /*_spender*/, address /*_to*/, bytes calldata _data) external view override returns (bool valid) {
        // disable ETH transfer
        if (_data.length < 4) {
            return false;
        }

        bytes4 method = getMethod(_data);
        if (method != DELEGATE_TO_PARASWAP) {
            return false;
        }

        // TODO: add checks on `_wallet` and a time to expiry

        bytes calldata signature = _data[4 + 3*32: 4 + 3*32 + 65];
        bytes calldata swapData = _data[4 + 7*32: 4 + 12*32 + 4];
        bytes32 signedHash = getSignedHash(swapData);

        return validateSignature(signedHash, signature, agsAddress);
    }

    function getSignedHash(bytes memory _data) internal view returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", keccak256(_data)));
    }

    function validateSignature(bytes32 _signedHash, bytes calldata _signature, address _account) internal view returns (bool) {
        require(_signature.length == 65, "invalid signature length");

        uint8 v;
        bytes32 r;
        bytes32 s;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            r := calldataload(_signature.offset)
            s := calldataload(add(_signature.offset, 0x20))
            v := byte(0, calldataload(add(_signature.offset, 0x40)))
        }

        return ecrecover(_signedHash, v, r, s) == _account;
    }
}
