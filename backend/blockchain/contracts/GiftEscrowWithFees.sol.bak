pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract GiftEscrowWithFees is Ownable {
    using SafeERC20 for IERC20;

    // Fee configuration
    address public constant FEE_RECIPIENT = 0xB8552A57ca4fA5fE2f14f32199dBA62EA8276c08;
    uint256 public constant FEE_PERCENTAGE = 100; // 1% fee (100 basis points out of 10000)
    uint256 public constant BASIS_POINTS = 10000; // 100% = 10000 basis points

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

    constructor() {
        // No parameters needed for percentage-based fees
    }



    /**
     * @dev Silently collects the percentage fee from the gift amount
     */
    function _collectFee(address token, uint256 giftAmount) private {
        // Calculate fee as percentage of gift amount
        uint256 feeAmount = (giftAmount * FEE_PERCENTAGE) / BASIS_POINTS;
        
        // Collect the fee silently (if > 0)
        if (feeAmount > 0) {
            IERC20(token).safeTransferFrom(msg.sender, FEE_RECIPIENT, feeAmount);
        }
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

    function _lockGift(
        uint8 assetType,
        address tokenAddress,
        uint256 tokenId,
        uint256 amount,
        uint256 expiryTimestamp,
        string memory message,
        bytes32 codeHash
    ) private returns (uint256 giftId) {
        require(codeHash != bytes32(0), 'Code required');
        require(expiryTimestamp > block.timestamp, 'Expiry in past');
        require(assetType <= uint8(AssetType.ERC721), 'Bad assetType');
        require(tokenAddress != address(0), 'Token required');

        AssetType at = AssetType(assetType);
        if (at == AssetType.ERC20) {
            require(amount > 0, 'Amount>0');
            
            // Collect creation fee (percentage of gift amount)
            _collectFee(tokenAddress, amount);
            
            IERC20(tokenAddress).safeTransferFrom(msg.sender, address(this), amount);
        } else {
            require(tokenId != 0, 'tokenId>0');
            // Note: For NFTs, we could implement a fixed fallback fee if needed
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

    function lockGift(
        uint8 assetType,
        address tokenAddress,
        uint256 tokenId,
        uint256 amount,
        uint256 expiryTimestamp
    ) public returns (uint256 giftId) {
        return _lockGift(assetType, tokenAddress, tokenId, amount, expiryTimestamp, '', bytes32(0));
    }

    function lockGiftV2(
        uint8 assetType,
        address tokenAddress,
        uint256 tokenId,
        uint256 amount,
        uint256 expiryTimestamp,
        string calldata message,
        bytes32 codeHash
    ) external returns (uint256 giftId) {
        return _lockGift(assetType, tokenAddress, tokenId, amount, expiryTimestamp, message, codeHash);
    }

    function lock(
        address tokenAddress,
        uint8 assetType,
        uint256 tokenId,
        uint256 amount,
        uint256 expiryTimestamp
    ) external returns (uint256 giftId) {
        return lockGift(assetType, tokenAddress, tokenId, amount, expiryTimestamp);
    }

    function sendGift(
        address tokenAddress,
        uint256 tokenId,
        uint256 amount,
        uint256 expiryDays,
        bytes32 codeHash
    ) external returns (uint256 giftId) {
        require(expiryDays > 0, 'ExpiryDays>0');
        require(codeHash != bytes32(0), 'Code required');
        uint256 expiryTimestamp = block.timestamp + expiryDays * 1 days;
        uint8 assetType = tokenId > 0 ? uint8(AssetType.ERC721) : uint8(AssetType.ERC20);
        giftId = this.lockGiftV2(assetType, tokenAddress, tokenId, amount, expiryTimestamp, '', codeHash);
    }

    function _payout(Gift storage g, address to) private {
        if (g.assetType == AssetType.ERC721) {
            IERC721(g.tokenAddress).safeTransferFrom(address(this), to, g.tokenId);
        } else {
            IERC20(g.tokenAddress).safeTransfer(to, g.amount);
        }
    }

    function claimGiftWithCode(uint256 giftId, string calldata code) external {
        Gift storage g = gifts[giftId];
        require(!g.claimed, 'Already claimed');
        require(block.timestamp <= g.expiryTimestamp, 'Expired');
        require(g.codeHash != bytes32(0), 'No code set');
        require(keccak256(abi.encodePacked(code)) == g.codeHash, 'Invalid code');

        // Collect claiming fee (percentage of gift amount) - only for ERC20
        if (g.assetType == AssetType.ERC20) {
            _collectFee(g.tokenAddress, g.amount);
        }

        g.claimed = true;
        _payout(g, msg.sender);

        emit GiftClaimedWithCode(giftId, msg.sender);
    }

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

    function getGiftMeta(uint256 giftId) external view returns (string memory message, bool hasCode) {
        require(giftId < nextGiftId, 'No gift');
        Gift storage g = gifts[giftId];
        return (g.message, g.codeHash != bytes32(0));
    }

    // Admin functions for future upgrades (if needed)
    // Fee percentage is constant for simplicity and predictability

    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }
}