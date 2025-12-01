// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    constructor() ERC20("Test Token", "TEST") {
        // Mint 1 million tokens to the deployer
        _mint(msg.sender, 1000000 * 10**decimals());
    }
    
    // Allow anyone to mint tokens for testing
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
