pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';

/**
 * @title SimplePriceOracle
 * @dev A simple price oracle for testing that allows owner to set token prices
 */
contract SimplePriceOracle is Ownable {
    // Token address => Price in USD (6 decimals, so $1.50 = 1500000)
    mapping(address => uint256) public tokenPrices;
    
    event PriceUpdated(address indexed token, uint256 price);
    
    constructor() {}
    
    /**
     * @dev Set the price of a token in USD (6 decimals)
     * @param token The token address
     * @param priceUSD The price in USD with 6 decimals (e.g., $1.50 = 1500000)
     */
    function setTokenPrice(address token, uint256 priceUSD) external onlyOwner {
        tokenPrices[token] = priceUSD;
        emit PriceUpdated(token, priceUSD);
    }
    
    /**
     * @dev Set multiple token prices at once
     */
    function setTokenPrices(address[] calldata tokens, uint256[] calldata prices) external onlyOwner {
        require(tokens.length == prices.length, "Arrays length mismatch");
        for (uint256 i = 0; i < tokens.length; i++) {
            tokenPrices[tokens[i]] = prices[i];
            emit PriceUpdated(tokens[i], prices[i]);
        }
    }
    
    /**
     * @dev Get the price of a token in USD (6 decimals)
     */
    function getTokenPriceInUSD(address token) external view returns (uint256) {
        return tokenPrices[token];
    }
}