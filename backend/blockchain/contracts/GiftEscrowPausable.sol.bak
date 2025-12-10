// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/security/Pausable.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

/**
 * @title GiftEscrowPausable
 * @dev Enhanced version of GiftEscrow with pause/resume functionality and timing controls
 */
contract GiftEscrowPausable is Pausable, Ownable {
    using SafeERC20 for IERC20;

    enum AssetType { ERC20, ERC721 }

    struct Gift {
        AssetType assetType;
        address tokenAddress;
        uint256 tokenId;
        uint256 amount;
        address sender;
        uint256 expiryTimestamp;
        bool claimed;
        string message;
        bytes32 codeHash;
    }

    mapping(uint256 => Gift) public gifts;
    uint256 public nextGiftId;
    uint256 public contractActiveUntil; // Timestamp until which the contract will remain active

    event GiftLocked(
        uint256 indexed giftId,
        address indexed sender,
        AssetType assetType,
        address tokenAddress,
        uint256 tokenId,
        uint256 amount,
        uint256 expiryTimestamp
    );
    event GiftClaimed(uint256 indexed giftId, address indexed claimer);
    event GiftExpired(uint256 indexed giftId);
    event GiftMetaSet(uint256 indexed giftId, string message, bool hasCode);
    event GiftClaimedWithCode(uint256 indexed giftId, address indexed claimer);
    event GiftSent(uint256 indexed giftId, address indexed sender);
    event ContractTimerUpdated(uint256 activeUntil);

    /**
     * @dev Constructor that initializes the contract with a default active period of 365 days
     */
    constructor() Ownable(msg.sender) {
        contractActiveUntil = block.timestamp + 365 days;
    }

    /**
     * @dev Modifier to check if the contract is still active based on the timer
     */
    modifier whenActive() {
        require(block.timestamp <= contractActiveUntil, "Contract operation period has ended");
        _;
    }

    /**
     * @dev Allows contract owner to pause all contract operations
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Allows contract owner to resume all contract operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Extends the contract active period
     * @param extensionDays Number of days to extend the contract active period
     */
    function extendActiveTimer(uint256 extensionDays) external onlyOwner {
        require(extensionDays > 0, "Extension days must be greater than 0");
        contractActiveUntil = contractActiveUntil + (extensionDays * 1 days);
        emit ContractTimerUpdated(contractActiveUntil);
    }

    /**
     * @dev Sets a specific end date for the contract active period
     * @param timestamp Unix timestamp when the contract will cease operations
     */
    function setActiveTimerEnd(uint256 timestamp) external onlyOwner {
        require(timestamp > block.timestamp, "End time must be in the future");
        contractActiveUntil = timestamp;
        emit ContractTimerUpdated(contractActiveUntil);
    }

    /**
     * @dev Returns the remaining time until the contract becomes inactive
     * @return Seconds remaining until contract becomes inactive, or 0 if already inactive
     */
    function getActiveTimeRemaining() external view returns (uint256) {
        if (block.timestamp >= contractActiveUntil) {
            return 0;
        }
        return contractActiveUntil - block.timestamp;
    }

    /**
     * @dev Validates parameters for locking a gift
     */
    function validateGiftForLocking(
        uint8 assetType,
        address tokenAddress,
        uint256 tokenId,
        uint256 amount,
        uint256 expiryTimestamp,
        string calldata message,
        bytes32 codeHash
    ) external view returns (bool valid, string memory reason) {
        if (paused()) {
            return (false, "Contract is paused");
        }
        
        if (block.timestamp > contractActiveUntil) {
            return (false, "Contract is no longer active");
        }
        
        if (codeHash == bytes32(0)) {
            return (false, "Code required");
        }
        
        if (expiryTimestamp <= block.timestamp) {
            return (false, "Expiry in past");
        }
        
        if (assetType > uint8(AssetType.ERC721)) {
            return (false, "Bad assetType");
        }
        
        if (tokenAddress == address(0)) {
            return (false, "Token required");
        }
        
        AssetType at = AssetType(assetType);
        if (at == AssetType.ERC20) {
            if (amount == 0) {
                return (false, "Amount>0");
            }
        } else {
            if (tokenId == 0) {
                return (false, "tokenId>0");
            }
        }
        
        return (true, "");
    }

    /**
     * @dev Internal function to lock a gift in escrow
     */
    function _lockGift(
        uint8 assetType,
        address tokenAddress,
        uint256 tokenId,
        uint256 amount,
        uint256 expiryTimestamp,
        string memory message,
        bytes32 codeHash
    ) private whenNotPaused whenActive returns (uint256 giftId) {
        require(codeHash != bytes32(0), 'Code required');
        require(expiryTimestamp > block.timestamp, 'Expiry in past');
        require(assetType <= uint8(AssetType.ERC721), 'Bad assetType');
        require(tokenAddress != address(0), 'Token required');

        AssetType at = AssetType(assetType);
        if (at == AssetType.ERC20) {
            require(amount > 0, 'Amount>0');
            IERC20(tokenAddress).safeTransferFrom(msg.sender, address(this), amount);
        } else {
            require(tokenId != 0, 'tokenId>0');
            IERC721(tokenAddress).safeTransferFrom(msg.sender, address(this), tokenId);
        }

        giftId = nextGiftId++;
        gifts[giftId] = Gift({
            assetType: at,
            tokenAddress: tokenAddress,
            tokenId: tokenId,
            amount: amount,
            sender: msg.sender,
            expiryTimestamp: expiryTimestamp,
            claimed: false,
            message: message,
            codeHash: codeHash
        });

        emit GiftLocked(giftId, msg.sender, at, tokenAddress, tokenId, amount, expiryTimestamp);
        emit GiftSent(giftId, msg.sender);
        if (bytes(message).length > 0 || codeHash != bytes32(0)) {
            emit GiftMetaSet(giftId, message, codeHash != bytes32(0));
        }
    }

    /**
     * @dev Legacy function to lock a gift (maintained for compatibility)
     */
    function lockGift(
        uint8 assetType,
        address tokenAddress,
        uint256 tokenId,
        uint256 amount,
        uint256 expiryTimestamp
    ) public whenNotPaused whenActive returns (uint256 giftId) {
        return _lockGift(assetType, tokenAddress, tokenId, amount, expiryTimestamp, '', bytes32(0));
    }

    /**
     * @dev Enhanced function to lock a gift with message and code
     */
    function lockGiftV2(
        uint8 assetType,
        address tokenAddress,
        uint256 tokenId,
        uint256 amount,
        uint256 expiryTimestamp,
        string calldata message,
        bytes32 codeHash
    ) external whenNotPaused whenActive returns (uint256 giftId) {
        return _lockGift(assetType, tokenAddress, tokenId, amount, expiryTimestamp, message, codeHash);
    }

    /**
     * @dev Legacy function to lock a gift (maintained for compatibility)
     */
    function lock(
        address tokenAddress,
        uint8 assetType,
        uint256 tokenId,
        uint256 amount,
        uint256 expiryTimestamp
    ) external whenNotPaused whenActive returns (uint256 giftId) {
        return lockGift(assetType, tokenAddress, tokenId, amount, expiryTimestamp);
    }

    /**
     * @dev Send gift with simplified parameters
     */
    function sendGift(
        address tokenAddress,
        uint256 tokenId,
        uint256 amount,
        uint256 expiryDays,
        bytes32 codeHash
    ) external whenNotPaused whenActive returns (uint256 giftId) {
        require(expiryDays > 0, 'ExpiryDays>0');
        require(codeHash != bytes32(0), 'Code required');
        uint256 expiryTimestamp = block.timestamp + expiryDays * 1 days;
        uint8 assetType = tokenId > 0 ? uint8(AssetType.ERC721) : uint8(AssetType.ERC20);
        giftId = this.lockGiftV2(assetType, tokenAddress, tokenId, amount, expiryTimestamp, '', codeHash);
    }

    /**
     * @dev Internal function to transfer assets
     */
    function _payout(Gift storage g, address to) private {
        if (g.assetType == AssetType.ERC721) {
            IERC721(g.tokenAddress).safeTransferFrom(address(this), to, g.tokenId);
        } else {
            IERC20(g.tokenAddress).safeTransfer(to, g.amount);
        }
    }

    /**
     * @dev Claim a gift using a code (even if contract is paused)
     * This allows claiming to continue during pause to prevent locking user funds
     */
    function claimGiftWithCode(uint256 giftId, string calldata code) external whenActive {
        Gift storage g = gifts[giftId];
        require(!g.claimed, 'Already claimed');
        require(block.timestamp <= g.expiryTimestamp, 'Expired');
        require(g.codeHash != bytes32(0), 'No code set');
        require(keccak256(abi.encodePacked(code)) == g.codeHash, 'Invalid code');

        g.claimed = true;
        _payout(g, msg.sender);

        emit GiftClaimedWithCode(giftId, msg.sender);
    }

    /**
     * @dev Refund expired gifts to senders (even if contract is paused)
     * This allows refunds to continue during pause to prevent locking user funds
     */
    function refundExpired(uint256[] calldata ids) external {
        for (uint256 i = 0; i < ids.length; i++) {
            uint256 id = ids[i];
            Gift storage g = gifts[id];
            if (!g.claimed && block.timestamp > g.expiryTimestamp) {
                g.claimed = true; 
                if (g.assetType == AssetType.ERC721) {
                    IERC721(g.tokenAddress).safeTransferFrom(address(this), g.sender, g.tokenId);
                } else {
                    IERC20(g.tokenAddress).safeTransfer(g.sender, g.amount);
                }
                emit GiftExpired(id);
            }
        }
    }

    /**
     * @dev Emergency withdrawal function for contract owner in case of critical issues
     * @param tokenAddress The address of the ERC20 token to withdraw
     * @param to The address to send tokens to
     * @param amount The amount of tokens to withdraw
     */
    function emergencyWithdraw(address tokenAddress, address to, uint256 amount) external onlyOwner {
        IERC20(tokenAddress).safeTransfer(to, amount);
    }

    /**
     * @dev Emergency withdrawal function for contract owner in case of critical issues with ERC721
     * @param tokenAddress The address of the ERC721 token to withdraw
     * @param to The address to send tokens to
     * @param tokenId The ID of the token to withdraw
     */
    function emergencyWithdrawERC721(address tokenAddress, address to, uint256 tokenId) external onlyOwner {
        IERC721(tokenAddress).safeTransferFrom(address(this), to, tokenId);
    }

    /**
     * @dev Get gift status information
     */
    function getGiftStatus(uint256 giftId) external view returns (
        bool exists,
        bool claimed,
        address sender,
        uint256 expiryTimestamp
    ) {
        if (giftId >= nextGiftId) return (false, false, address(0), 0);
        Gift storage g = gifts[giftId];
        return (true, g.claimed, g.sender, g.expiryTimestamp);
    }

    /**
     * @dev Get detailed gift information
     */
    function getGift(uint256 giftId) external view returns (
        AssetType assetType,
        address tokenAddress,
        uint256 tokenId,
        uint256 amount,
        address sender,
        uint256 expiryTimestamp,
        bool claimed
    ) {
        require(giftId < nextGiftId, 'No gift');
        Gift storage g = gifts[giftId];
        return (g.assetType, g.tokenAddress, g.tokenId, g.amount, g.sender, g.expiryTimestamp, g.claimed);
    }

    /**
     * @dev Get gift metadata information
     */
    function getGiftMeta(uint256 giftId) external view returns (string memory message, bool hasCode) {
        require(giftId < nextGiftId, 'No gift');
        Gift storage g = gifts[giftId];
        return (g.message, g.codeHash != bytes32(0));
    }

    /**
     * @dev Required callback for ERC721 token transfers
     */
    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }

    /**
     * @dev Returns contract status information
     */
    function getContractStatus() external view returns (
        bool isPaused,
        uint256 activeUntil,
        bool isActive
    ) {
        return (paused(), contractActiveUntil, block.timestamp <= contractActiveUntil);
    }
}
