// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

contract PropertyRegistry {
    struct Property {
        address registrar;    // jis wallet ne register kiya
        uint256 registeredAt; // timestamp
    }

    // hash => property info
    mapping(bytes32 => Property) private properties;

    // quick existence check ke liye
    mapping(bytes32 => bool) public propertyExists;

    event PropertyRegistered(
        bytes32 indexed propertyHash,
        address indexed registrar,
        uint256 timestamp
    );

    function addProperty(bytes32 propertyHash) external {
        require(propertyHash != bytes32(0), "Invalid hash");
        require(!propertyExists[propertyHash], "Property already registered");

        properties[propertyHash] = Property({
            registrar: msg.sender,
            registeredAt: block.timestamp
        });

        propertyExists[propertyHash] = true;

        emit PropertyRegistered(propertyHash, msg.sender, block.timestamp);
    }

    function checkProperty(bytes32 propertyHash)
        external
        view
        returns (bool exists, address registrar, uint256 registeredAt)
    {
        exists = propertyExists[propertyHash];
        if (!exists) {
          return (false, address(0), 0);
        }
        Property memory p = properties[propertyHash];
        return (true, p.registrar, p.registeredAt);
    }
}
