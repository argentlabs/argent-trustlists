pragma solidity 0.7.5;
pragma experimental ABIEncoderV2;


import "openzeppelin-solidity/contracts/access/Ownable.sol";
import "./IAugustusRegistry.sol";

contract AugustusRegistry is IAugustusRegistry, Ownable {

    mapping(bytes32 => address) private versionVsAugustus;

    mapping(address => bool) private augustusVsValid;

    //mapping of banned Augustus
    mapping(address => bool) private banned;

    string private latestVersion;

    uint256 private count;

    event AugustusAdded(string version, address indexed augustus, bool isLatest);
    event AugustusBanned(address indexed augustus);

    function addAugustus(
        string calldata version,
        address augustus,
        bool isLatest
    )
        external
        override
        onlyOwner
    {   
        bytes32 keccakedVersion = keccak256(abi.encodePacked(version));
        require(augustus != address(0), "Invalid augustus address");
        require(versionVsAugustus[keccakedVersion] == address(0), "Version already exists");
        require(!augustusVsValid[augustus], "Augustus already exists");

        versionVsAugustus[keccakedVersion] = augustus;
        augustusVsValid[augustus] = true;
        count = count + 1;

        if (isLatest) {
            latestVersion = version;
        }

        emit AugustusAdded(version, augustus, isLatest);
    }

    function banAugustus(address augustus) external override onlyOwner {
        banned[augustus] = true;
        emit AugustusBanned(augustus);
    }

    function isValidAugustus(address augustus) external override view returns (bool) {
        if (augustusVsValid[augustus] && !banned[augustus]) {
            return true;
        }
        else {
            return false;
        }
    }

    function getAugustusCount() external override view returns (uint256) {
        return count;
    }

    function getLatestVersion() external override view returns (string memory) {
        return latestVersion;
    }

    function getLatestAugustus() external override view returns (address) {
        return versionVsAugustus[keccak256(abi.encodePacked(latestVersion))];
    }

    function getAugustusByVersion(string calldata version) external override view returns (address) {
        return versionVsAugustus[keccak256(abi.encodePacked(version))];
    }
}