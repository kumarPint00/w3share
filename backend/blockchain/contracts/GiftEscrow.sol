pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';

// Lightweight Reentrancy protection (avoid external dependency mismatch)
contract GiftEscrow {
    using SafeERC20 for IERC20;

    // Reentrancy guard status
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    enum AssetType { ERC20, ERC721, ETH }

    struct Asset {
        AssetType assetType;
        address tokenAddress;
        uint256 tokenId;
        uint256 amount;
    }

    struct GiftPack {
        address sender;
        uint256 expiryTimestamp;
        bool claimed;
        string message;
        bytes32 codeHash;
        Asset[] assets;
    }

    mapping(bytes32 => GiftPack) public giftPacks;
    mapping(bytes32 => bool) public codeHashExists;
    bytes32[] public allCodeHashes;

    uint256 public nextGiftId;
    mapping(uint256 => bytes32) public giftIdToCodeHash;

    event GiftPackLocked(
        bytes32 indexed codeHash,
        address indexed sender,
        uint256 assetCount,
        uint256 expiryTimestamp
    );
    event GiftPackClaimed(bytes32 indexed codeHash, address indexed claimer);
    event GiftPackExpired(bytes32 indexed codeHash);
    event AssetAddedToGiftPack(bytes32 indexed codeHash, uint256 assetIndex, uint8 assetType);

    /**
     * @dev Validates parameters for locking a gift pack. Returns true if valid, false otherwise.
     */
    function validateGiftPackForLocking(
        uint256 expiryTimestamp,
        bytes32 codeHash
    ) external view returns (bool valid, string memory reason) {
        if (codeHash == bytes32(0)) {
            return (false, "Code required");
        }
        if (expiryTimestamp <= block.timestamp) {
            return (false, "Expiry in past");
        }
        if (codeHashExists[codeHash]) {
            return (false, "Code already used");
        }
        return (true, "");
    }

    /**
     * @notice Create a new gift pack with a code and optional message.
     * @param expiryTimestamp When the gift pack expires
     * @param message Optional message for the gift
     * @param codeHash The keccak256 hash of the secret code
     * @return codeHash The code hash that identifies this gift pack
     */
    function createGiftPack(
        uint256 expiryTimestamp,
        string calldata message,
        bytes32 codeHash
    ) external returns (bytes32) {
        require(codeHash != bytes32(0), "Code required");
        require(expiryTimestamp > block.timestamp, "Expiry in past");
        require(!codeHashExists[codeHash], "Code already used");

        giftPacks[codeHash] = GiftPack({
            sender: msg.sender,
            expiryTimestamp: expiryTimestamp,
            claimed: false,
            message: message,
            codeHash: codeHash,
            assets: new Asset[](0)
        });

        codeHashExists[codeHash] = true;
        allCodeHashes.push(codeHash);

        return codeHash;
    }

    /**
     * @notice Add an asset (ERC20, ERC721, or ETH) to an existing gift pack.
     * @param codeHash The code hash identifying the gift pack
     * @param assetType Type of asset (0=ERC20, 1=ERC721, 2=ETH)
     * @param tokenAddress Address of the token (ignored for ETH)
     * @param tokenId Token ID for ERC721 (0 for others)
     * @param amount Amount for ERC20 or ETH (0 for ERC721)
     */
    function addAssetToGiftPack(
        bytes32 codeHash,
        uint8 assetType,
        address tokenAddress,
        uint256 tokenId,
        uint256 amount
    ) external payable nonReentrant {
        require(codeHashExists[codeHash], "Gift pack not found");
        GiftPack storage pack = giftPacks[codeHash];
        require(!pack.claimed, "Already claimed");
        require(block.timestamp < pack.expiryTimestamp, "Expired");
        require(pack.sender == msg.sender, "Not owner");
        require(assetType <= uint8(AssetType.ETH), "Bad assetType");

        AssetType at = AssetType(assetType);

        if (at == AssetType.ETH) {
            require(amount > 0, "Amount > 0");
            require(msg.value == amount, "Incorrect ETH amount");
        } else if (at == AssetType.ERC20) {
            require(tokenAddress != address(0), "Token address required");
            require(amount > 0, "Amount > 0");
            IERC20(tokenAddress).safeTransferFrom(msg.sender, address(this), amount);
        } else {
            require(tokenAddress != address(0), "Token address required");
            require(tokenId > 0, "tokenId > 0");
            IERC721(tokenAddress).safeTransferFrom(msg.sender, address(this), tokenId);
        }

        pack.assets.push(Asset({
            assetType: at,
            tokenAddress: tokenAddress,
            tokenId: tokenId,
            amount: amount
        }));

        emit AssetAddedToGiftPack(codeHash, pack.assets.length - 1, assetType);
    }

    /**
     * @notice Finalize and lock a gift pack. Can only be called after all assets are added.
     * @param codeHash The code hash identifying the gift pack
     */
    function lockGiftPack(bytes32 codeHash) external {
        require(codeHashExists[codeHash], "Gift pack not found");
        GiftPack storage pack = giftPacks[codeHash];
        require(!pack.claimed, "Already claimed");
        require(pack.sender == msg.sender, "Not owner");
        require(pack.assets.length > 0, "No assets in pack");

        emit GiftPackLocked(codeHash, msg.sender, pack.assets.length, pack.expiryTimestamp);
    }

    /**
     * @notice Claim a gift pack by providing the secret code.
     * Transfers all assets in the pack to the caller.
     * @param codeHash The code hash identifying the gift pack
     * @param code The plaintext code
     */
    function claimGiftPackWithCode(bytes32 codeHash, string calldata code) external nonReentrant {
        require(codeHashExists[codeHash], "Gift pack not found");
        require(keccak256(abi.encodePacked(code)) == codeHash, "Invalid code");

        GiftPack storage pack = giftPacks[codeHash];
        require(!pack.claimed, "Already claimed");
        require(block.timestamp <= pack.expiryTimestamp, "Expired");
        require(pack.assets.length > 0, "No assets in pack");

        pack.claimed = true;

        // Transfer all assets to the claimer
        for (uint256 i = 0; i < pack.assets.length; i++) {
            Asset storage asset = pack.assets[i];
            
            if (asset.assetType == AssetType.ERC721) {
                IERC721(asset.tokenAddress).safeTransferFrom(address(this), msg.sender, asset.tokenId);
            } else if (asset.assetType == AssetType.ERC20) {
                IERC20(asset.tokenAddress).safeTransfer(msg.sender, asset.amount);
            } else {
                // ETH - send directly without wrapping
                (bool success, ) = payable(msg.sender).call{value: asset.amount}("");
                require(success, "ETH transfer failed");
            }
        }

        emit GiftPackClaimed(codeHash, msg.sender);
    }

    /**
     * @notice Refund an expired gift pack to the original sender.
     * @param codeHash The code hash identifying the gift pack
     */
    function refundExpiredGiftPack(bytes32 codeHash) external nonReentrant {
        require(codeHashExists[codeHash], "Gift pack not found");
        GiftPack storage pack = giftPacks[codeHash];
        require(!pack.claimed, "Already claimed");
        require(block.timestamp > pack.expiryTimestamp, "Not expired");
        require(pack.sender == msg.sender, "Not owner");

        pack.claimed = true;

        // Refund all assets to the sender
        for (uint256 i = 0; i < pack.assets.length; i++) {
            Asset storage asset = pack.assets[i];
            
            if (asset.assetType == AssetType.ERC721) {
                IERC721(asset.tokenAddress).safeTransferFrom(address(this), pack.sender, asset.tokenId);
            } else if (asset.assetType == AssetType.ERC20) {
                IERC20(asset.tokenAddress).safeTransfer(pack.sender, asset.amount);
            } else {
                // ETH - send directly
                (bool success, ) = payable(pack.sender).call{value: asset.amount}("");
                require(success, "ETH refund failed");
            }
        }

        emit GiftPackExpired(codeHash);
    }

    /**
     * @notice Get all assets in a gift pack
     * @param codeHash The code hash identifying the gift pack
     * @return assets Array of assets in the pack
     */
    function getGiftPackAssets(bytes32 codeHash) external view returns (Asset[] memory assets) {
        require(codeHashExists[codeHash], "Gift pack not found");
        return giftPacks[codeHash].assets;
    }

    /**
     * @notice Get gift pack details
     * @param codeHash The code hash identifying the gift pack
     * @return sender The address that created the gift pack
     * @return expiryTimestamp When the gift pack expires
     * @return claimed Whether the gift pack has been claimed
     * @return message The optional message
     * @return assetCount Number of assets in the pack
     */
    function getGiftPackDetails(bytes32 codeHash) external view returns (
        address sender,
        uint256 expiryTimestamp,
        bool claimed,
        string memory message,
        uint256 assetCount
    ) {
        require(codeHashExists[codeHash], "Gift pack not found");
        GiftPack storage pack = giftPacks[codeHash];
        return (pack.sender, pack.expiryTimestamp, pack.claimed, pack.message, pack.assets.length);
    }

    /**
     * @notice Get a specific asset from a gift pack
     * @param codeHash The code hash identifying the gift pack
     * @param index The index of the asset
     * @return asset The asset details
     */
    function getAssetByIndex(bytes32 codeHash, uint256 index) external view returns (Asset memory asset) {
        require(codeHashExists[codeHash], "Gift pack not found");
        GiftPack storage pack = giftPacks[codeHash];
        require(index < pack.assets.length, "Asset index out of bounds");
        return pack.assets[index];
    }

    /**
     * @notice Get all code hashes (pagination support)
     * @return codeHashes Array of all code hashes
     */
    function getAllCodeHashes() external view returns (bytes32[] memory codeHashes) {
        return allCodeHashes;
    }

    /**
     * @notice Check if a code hash exists
     * @param codeHash The code hash to check
     * @return exists Whether the code hash exists
     */
    function codeHashExistsCheck(bytes32 codeHash) external view returns (bool exists) {
        return codeHashExists[codeHash];
    }


    /**
     * @notice ERC721 token receiver callback
     */
    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }

    /**
     * @notice Allow contract to receive ETH directly
     */
    receive() external payable {}
}
