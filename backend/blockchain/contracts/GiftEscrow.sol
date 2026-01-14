pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';

contract GiftEscrow {
    using SafeERC20 for IERC20;

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

    // Structs for batch operation
    struct ApprovalCall {
        address tokenAddress;
        bytes data;
    }

    struct AddAssetCall {
        uint8 assetType;
        address tokenAddress;
        uint256 tokenId;
        uint256 amount;
    }


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
     * @dev Batch operation: Create gift pack, execute approvals, add all assets, and lock in one transaction
     * This reduces the number of user prompts from 7 to 1 by combining multiple operations
     */
    function createAndLockGiftBatch(
        uint256 expiryTimestamp,
        string calldata message,
        bytes32 codeHash,
        ApprovalCall[] calldata approvals,
        AddAssetCall[] calldata assets
    ) external payable nonReentrant {
        require(codeHash != bytes32(0), "Code required");
        require(expiryTimestamp > block.timestamp, "Expiry in past");
        require(!codeHashExists[codeHash], "Code already used");
        require(assets.length > 0, "At least one asset required");

        // Step 1: Create gift pack
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

        // Step 2: Execute ERC20 approvals via low-level call
        // The user must have pre-approved these tokens before calling this function
        // The approvals array contains the encoded approve() calls that were already executed
        for (uint256 i = 0; i < approvals.length; i++) {
            ApprovalCall calldata approval = approvals[i];
            (bool success, bytes memory result) = approval.tokenAddress.call(approval.data);
            if (!success) {
                if (result.length > 0) {
                    assembly {
                        let returndata_size := mload(result)
                        revert(add(32, result), returndata_size)
                    }
                }
                revert("Approval call failed");
            }
        }

        // Step 3: Add all assets to the gift pack
        GiftPack storage pack = giftPacks[codeHash];
        uint256 totalEthValue = 0;

        for (uint256 i = 0; i < assets.length; i++) {
            AddAssetCall calldata assetCall = assets[i];
            require(assetCall.assetType <= uint8(AssetType.ETH), "Bad assetType");

            AssetType at = AssetType(assetCall.assetType);

            if (at == AssetType.ETH) {
                require(assetCall.amount > 0, "Amount > 0");
                totalEthValue += assetCall.amount;
            } else if (at == AssetType.ERC20) {
                require(assetCall.tokenAddress != address(0), "Token address required");
                require(assetCall.amount > 0, "Amount > 0");
                IERC20(assetCall.tokenAddress).safeTransferFrom(msg.sender, address(this), assetCall.amount);
            } else {
                require(assetCall.tokenAddress != address(0), "Token address required");
                require(assetCall.tokenId > 0, "tokenId > 0");
                IERC721(assetCall.tokenAddress).safeTransferFrom(msg.sender, address(this), assetCall.tokenId);
            }

            pack.assets.push(Asset({
                assetType: at,
                tokenAddress: assetCall.tokenAddress,
                tokenId: assetCall.tokenId,
                amount: assetCall.amount
            }));

            emit AssetAddedToGiftPack(codeHash, pack.assets.length - 1, assetCall.assetType);
        }

        // Verify ETH value matches total ETH assets
        require(msg.value == totalEthValue, "Incorrect ETH amount");

        // Step 4: Lock the gift pack (atomic - all or nothing)
        emit GiftPackLocked(codeHash, msg.sender, pack.assets.length, expiryTimestamp);
    }


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


    function lockGiftPack(bytes32 codeHash) external {
        require(codeHashExists[codeHash], "Gift pack not found");
        GiftPack storage pack = giftPacks[codeHash];
        require(!pack.claimed, "Already claimed");
        require(pack.sender == msg.sender, "Not owner");
        require(pack.assets.length > 0, "No assets in pack");

        emit GiftPackLocked(codeHash, msg.sender, pack.assets.length, pack.expiryTimestamp);
    }


    function claimGiftPackWithCode(bytes32 codeHash, string calldata code) external nonReentrant {
        require(codeHashExists[codeHash], "Gift pack not found");
        require(keccak256(abi.encodePacked(code)) == codeHash, "Invalid code");

        GiftPack storage pack = giftPacks[codeHash];
        require(!pack.claimed, "Already claimed");
        require(block.timestamp <= pack.expiryTimestamp, "Expired");
        require(pack.assets.length > 0, "No assets in pack");

        pack.claimed = true;

        for (uint256 i = 0; i < pack.assets.length; i++) {
            Asset storage asset = pack.assets[i];
            
            if (asset.assetType == AssetType.ERC721) {
                IERC721(asset.tokenAddress).safeTransferFrom(address(this), msg.sender, asset.tokenId);
            } else if (asset.assetType == AssetType.ERC20) {
                IERC20(asset.tokenAddress).safeTransfer(msg.sender, asset.amount);
            } else {
                (bool success, ) = payable(msg.sender).call{value: asset.amount}("");
                require(success, "ETH transfer failed");
            }
        }

        emit GiftPackClaimed(codeHash, msg.sender);
    }

    function refundExpiredGiftPack(bytes32 codeHash) external nonReentrant {
        require(codeHashExists[codeHash], "Gift pack not found");
        GiftPack storage pack = giftPacks[codeHash];
        require(!pack.claimed, "Already claimed");
        require(block.timestamp > pack.expiryTimestamp, "Not expired");
        require(pack.sender == msg.sender, "Not owner");

        pack.claimed = true;

        for (uint256 i = 0; i < pack.assets.length; i++) {
            Asset storage asset = pack.assets[i];
            
            if (asset.assetType == AssetType.ERC721) {
                IERC721(asset.tokenAddress).safeTransferFrom(address(this), pack.sender, asset.tokenId);
            } else if (asset.assetType == AssetType.ERC20) {
                IERC20(asset.tokenAddress).safeTransfer(pack.sender, asset.amount);
            } else {
                (bool success, ) = payable(pack.sender).call{value: asset.amount}("");
                require(success, "ETH refund failed");
            }
        }

        emit GiftPackExpired(codeHash);
    }


    function getGiftPackAssets(bytes32 codeHash) external view returns (Asset[] memory assets) {
        require(codeHashExists[codeHash], "Gift pack not found");
        return giftPacks[codeHash].assets;
    }

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


    function getAssetByIndex(bytes32 codeHash, uint256 index) external view returns (Asset memory asset) {
        require(codeHashExists[codeHash], "Gift pack not found");
        GiftPack storage pack = giftPacks[codeHash];
        require(index < pack.assets.length, "Asset index out of bounds");
        return pack.assets[index];
    }


    function getAllCodeHashes() external view returns (bytes32[] memory codeHashes) {
        return allCodeHashes;
    }


    function codeHashExistsCheck(bytes32 codeHash) external view returns (bool exists) {
        return codeHashExists[codeHash];
    }


    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }


    receive() external payable {}
}
