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
    address private immutable augustusAddress;

    constructor(address _agsAddress, address _augustusAddress) {
        agsAddress = _agsAddress;
        augustusAddress = _augustusAddress;
    }

    function isValid(address _wallet, address /*_spender*/, address _to, bytes calldata _data) external view override returns (bool valid) {
        // disable ETH transfer
        if (_data.length < 4) {
            return false;
        }

        // only allow calls to AugustusSwapper
        if (_to != augustusAddress) {
            return false;
        }

        bytes calldata swapData = _data[:_data.length - 65 - 32];
        bytes calldata deadline = _data[_data.length - 65 - 32: _data.length - 65];
        bytes calldata signature = _data[_data.length - 65:];

        uint256 deadlineTimestamp;
        assembly {
            deadlineTimestamp := calldataload(deadline.offset)
        }

        // make sure trade hasn't expired
        if (block.timestamp >= deadlineTimestamp) {
            return false;
        }

        bytes32 signedHash = getSignedHash(_wallet, deadline, swapData);
        return validateSignature(signedHash, signature, agsAddress);
    }

    function getSignedHash(address _wallet, bytes calldata _deadline, bytes calldata _swapData) internal pure returns (bytes32) {
        bytes32 message = keccak256(abi.encodePacked(_wallet, _deadline, _swapData));
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", message));
    }

    function validateSignature(bytes32 _signedHash, bytes calldata _signature, address _account) internal pure returns (bool) {
        require(_signature.length == 65, "invalid signature length");

        uint8 v;
        bytes32 r;
        bytes32 s;
        assembly {
            r := calldataload(_signature.offset)
            s := calldataload(add(_signature.offset, 0x20))
            v := byte(0, calldataload(add(_signature.offset, 0x40)))
        }

        return ecrecover(_signedHash, v, r, s) == _account;
    }
}
