// Copyright (C) 2022  Argent Labs Ltd. <https://argent.xyz>

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

import "../../interfaces/IFilter.sol";

contract ParaswapV5Filter is IFilter {

    address private immutable masterSigner;

    constructor(address _masterSigner) {
        masterSigner = _masterSigner;
    }

    function isValid(address _wallet, address /*_spender*/, address /*_to*/, bytes calldata _data) external view override returns (bool valid) {
        // check that the data contains enough bytes for the method, the signature and the deadline.
        // 4 is the method, 65 is length of signature, 32 is length of deadline
        if (_data.length < 4 + 65 + 32) {
            return false;
        }

        uint256 dataLength = _data.length;
        bytes calldata swapData = _data[:dataLength - 65 - 32];
        uint256 deadline = abi.decode(_data[_data.length - 65 - 32: _data.length - 65], (uint256));
        bytes calldata signature = _data[dataLength - 65:];

        // make sure trade hasn't expired
        if (deadline < block.number) {
            return false;
        }

        bytes32 signedHash = getSignedHash(_wallet, deadline, swapData);
        return validateSignature(signedHash, signature, masterSigner);
    }

    function getSignedHash(address _wallet, uint256 _deadline, bytes calldata _swapData) internal pure returns (bytes32) {
        bytes32 message = keccak256(abi.encodePacked(_wallet, _deadline, _swapData));
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", message));
    }

    function validateSignature(bytes32 _signedHash, bytes calldata _signature, address _account) internal pure returns (bool) {
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
