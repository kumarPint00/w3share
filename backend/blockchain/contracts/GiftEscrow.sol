// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title GiftEscrow
 * @notice Multi-asset gift pack system with code-based claiming
 */
contract GiftEscrow is IERC721Receiver, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum AssetType { ERC20, ERC721, ETH }

    struct Asset {
        AssetType assetType;
        address tokenAddress;
        uint256 tokenId;
        uint256 amount;
    }

    struct GiftPack {
        address sender;
        bool claimed;
        string message;
        bytes32 codeHash;
    }

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

    /**
     * @notice Pending claim commitment (commit-reveal MEV protection)
     * @dev value = keccak256(abi.encodePacked(claimer, code, nonce))
     */
    struct Commitment {
        bytes32 value;
        uint256 blockNumber;
        address claimer;
    }

    mapping(bytes32 => GiftPack) public giftPacks;
    mapping(bytes32 => Asset[]) private giftPackAssets;
    mapping(bytes32 => bool) public codeHashExists;
    mapping(uint256 => bytes32) public giftIdToCodeHash;
    
    bytes32[] public allCodeHashes;
    uint256 public nextGiftId = 1;

    /// @notice Pending commit-reveal commitments: codeHash => Commitment
    mapping(bytes32 => Commitment) public claimCommitments;

    /// @notice Minimum number of blocks that must pass between commit and reveal
    uint256 public constant COMMIT_REVEAL_DELAY = 1;
    /// @notice Maximum number of blocks before a commitment expires (~50 min on Sepolia)
    uint256 public constant COMMIT_EXPIRE_BLOCKS = 250;

    event GiftPackLocked(
        bytes32 indexed codeHash,
        address indexed sender,
        uint256 assetCount
    );

    event AssetAddedToGiftPack(
        bytes32 indexed codeHash,
        uint256 assetIndex,
        uint8 assetType
    );

    event GiftPackClaimed(
        bytes32 indexed codeHash,
        address indexed claimer
    );

    event ClaimCommitted(
        bytes32 indexed codeHash,
        address indexed claimer,
        uint256 blockNumber
    );

    event CommitmentWithdrawn(
        bytes32 indexed codeHash,
        address indexed claimer
    );

    receive() external payable {}

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    /**
     * @notice Create a new gift pack with message
     */
    function createGiftPack(
        string calldata message,
        bytes32 codeHash
    ) external returns (bytes32) {
        require(!codeHashExists[codeHash], "Code hash already exists");
        
        giftPacks[codeHash] = GiftPack({
            sender: msg.sender,
            claimed: false,
            message: message,
            codeHash: codeHash
        });

        codeHashExists[codeHash] = true;
        allCodeHashes.push(codeHash);
        giftIdToCodeHash[nextGiftId] = codeHash;
        nextGiftId++;

        return codeHash;
    }

    /**
     * @notice Add an asset to an existing gift pack
     */
    function addAssetToGiftPack(
        bytes32 codeHash,
        uint8 assetType,
        address tokenAddress,
        uint256 tokenId,
        uint256 amount
    ) external payable {
        require(codeHashExists[codeHash], "Gift pack not found");
        
        GiftPack storage pack = giftPacks[codeHash];
        require(pack.sender == msg.sender, "Not sender");
        require(!pack.claimed, "Already claimed");

        AssetType assetTypeEnum = AssetType(assetType);
        require(uint8(assetTypeEnum) <= 2, "Bad assetType");

        if (assetTypeEnum == AssetType.ETH) {
            require(msg.value > 0, "Amount > 0");
            require(msg.value == amount, "ETH value mismatch");
        } else if (assetTypeEnum == AssetType.ERC20) {
            require(tokenAddress != address(0), "Invalid token address");
            require(amount > 0, "Amount > 0");
            IERC20(tokenAddress).safeTransferFrom(msg.sender, address(this), amount);
        } else if (assetTypeEnum == AssetType.ERC721) {
            require(tokenAddress != address(0), "Invalid token address");
            require(tokenId > 0, "tokenId > 0");
            IERC721(tokenAddress).safeTransferFrom(msg.sender, address(this), tokenId);
        }

        giftPackAssets[codeHash].push(Asset({
            assetType: assetTypeEnum,
            tokenAddress: tokenAddress,
            tokenId: tokenId,
            amount: amount
        }));

        emit AssetAddedToGiftPack(codeHash, giftPackAssets[codeHash].length - 1, assetType);
    }

    /**
     * @notice Lock gift pack (finalizes it for claiming)
     */
    function lockGiftPack(bytes32 codeHash) external {
        require(codeHashExists[codeHash], "Gift pack not found");
        
        GiftPack storage pack = giftPacks[codeHash];
        require(pack.sender == msg.sender, "Not sender");
        require(!pack.claimed, "Already claimed");
        require(giftPackAssets[codeHash].length > 0, "No assets in pack");

        emit GiftPackLocked(
            codeHash,
            msg.sender,
            giftPackAssets[codeHash].length
        );
    }

    /**
     * @notice Phase 1 of MEV-resistant claiming: commit a blinded intention to claim.
     * @dev commitment = keccak256(abi.encodePacked(msg.sender, code, nonce))
     *      The code and nonce are never revealed on-chain at this stage.
     */
    function commitClaim(bytes32 codeHash, bytes32 commitment) external {
        require(codeHashExists[codeHash], "Gift pack not found");
        GiftPack storage pack = giftPacks[codeHash];
        require(!pack.claimed, "Already claimed");

        Commitment storage existing = claimCommitments[codeHash];
        // Allow the same claimer to re-commit (e.g. commitment expired); block others
        require(
            existing.claimer == address(0) || existing.claimer == msg.sender,
            "Another claim in progress"
        );

        claimCommitments[codeHash] = Commitment({
            value: commitment,
            blockNumber: block.number,
            claimer: msg.sender
        });

        emit ClaimCommitted(codeHash, msg.sender, block.number);
    }

    /**
     * @notice Phase 2 of MEV-resistant claiming: reveal the code and collect assets.
     * @dev Must be called at least COMMIT_REVEAL_DELAY blocks after commitClaim.
     *      The commitment binds msg.sender so front-running the reveal is impossible.
     */
    function revealAndClaim(bytes32 codeHash, string calldata code, bytes32 nonce) external nonReentrant {
        require(codeHashExists[codeHash], "Gift pack not found");
        GiftPack storage pack = giftPacks[codeHash];
        require(!pack.claimed, "Already claimed");

        Commitment storage commit = claimCommitments[codeHash];
        require(commit.claimer == msg.sender, "No commitment for caller");
        require(
            block.number >= commit.blockNumber + COMMIT_REVEAL_DELAY,
            "Too early: wait for next block"
        );
        require(
            block.number <= commit.blockNumber + COMMIT_EXPIRE_BLOCKS,
            "Commitment expired: please re-commit"
        );
        require(
            commit.value == keccak256(abi.encodePacked(msg.sender, code, nonce)),
            "Invalid commitment"
        );
        require(keccak256(abi.encodePacked(code)) == codeHash, "Invalid code");

        pack.claimed = true;
        delete claimCommitments[codeHash];

        Asset[] storage assets = giftPackAssets[codeHash];
        for (uint256 i = 0; i < assets.length; i++) {
            Asset storage asset = assets[i];

            if (asset.assetType == AssetType.ERC721) {
                IERC721(asset.tokenAddress).safeTransferFrom(
                    address(this),
                    msg.sender,
                    asset.tokenId
                );
            } else if (asset.assetType == AssetType.ERC20) {
                IERC20(asset.tokenAddress).safeTransfer(msg.sender, asset.amount);
            } else if (asset.assetType == AssetType.ETH) {
                (bool success,) = payable(msg.sender).call{value: asset.amount}("");
                require(success, "ETH transfer failed");
            }
        }

        emit GiftPackClaimed(codeHash, msg.sender);
    }

    /**
     * @notice Cancel a pending commitment (allows the claimer to retry with a fresh nonce).
     */
    function withdrawCommitment(bytes32 codeHash) external {
        Commitment storage commit = claimCommitments[codeHash];
        require(commit.claimer == msg.sender, "No commitment for caller");
        delete claimCommitments[codeHash];
        emit CommitmentWithdrawn(codeHash, msg.sender);
    }

    /**
     * @notice Batch create and lock gift pack in one transaction
     */
    function createAndLockGiftBatch(
        string calldata message,
        bytes32 codeHash,
        ApprovalCall[] calldata approvals,
        AddAssetCall[] calldata assets
    ) external payable nonReentrant {
        require(!codeHashExists[codeHash], "Code hash already exists");
        require(assets.length > 0, "At least one asset required");
        
        // Create gift pack
        giftPacks[codeHash] = GiftPack({
            sender: msg.sender,
            claimed: false,
            message: message,
            codeHash: codeHash
        });

        codeHashExists[codeHash] = true;
        allCodeHashes.push(codeHash);

        // Execute approvals (if any)
        for (uint256 i = 0; i < approvals.length; i++) {
            (bool success, bytes memory result) = approvals[i].tokenAddress.call(approvals[i].data);
            require(success, "Approval failed");
            if (result.length > 0) {
                require(abi.decode(result, (bool)), "Approval returned false");
            }
        }

        // Add assets
        uint256 totalETHRequired = 0;
        for (uint256 i = 0; i < assets.length; i++) {
            AddAssetCall memory asset = assets[i];
            require(uint8(asset.assetType) <= 2, "Bad assetType");
            
            AssetType assetTypeEnum = AssetType(asset.assetType);
            
            if (assetTypeEnum == AssetType.ETH) {
                require(asset.amount > 0, "Amount > 0");
                totalETHRequired += asset.amount;
            } else if (assetTypeEnum == AssetType.ERC20) {
                require(asset.tokenAddress != address(0), "Invalid token address");
                require(asset.amount > 0, "Amount > 0");
                IERC20(asset.tokenAddress).safeTransferFrom(msg.sender, address(this), asset.amount);
            } else if (assetTypeEnum == AssetType.ERC721) {
                require(asset.tokenAddress != address(0), "Invalid token address");
                require(asset.tokenId > 0, "tokenId > 0");
                IERC721(asset.tokenAddress).safeTransferFrom(msg.sender, address(this), asset.tokenId);
            }

            giftPackAssets[codeHash].push(Asset({
                assetType: assetTypeEnum,
                tokenAddress: asset.tokenAddress,
                tokenId: asset.tokenId,
                amount: asset.amount
            }));

            emit AssetAddedToGiftPack(codeHash, giftPackAssets[codeHash].length - 1, asset.assetType);
        }

        require(msg.value == totalETHRequired, "ETH value mismatch");

        emit GiftPackLocked(
            codeHash,
            msg.sender,
            assets.length
        );
    }

    // View functions
    function codeHashExistsCheck(bytes32 codeHash) external view returns (bool exists) {
        return codeHashExists[codeHash];
    }

    function getGiftPackDetails(bytes32 codeHash) external view returns (
        address sender,
        bool claimed,
        string memory message,
        uint256 assetCount
    ) {
        require(codeHashExists[codeHash], "Gift pack not found");
        GiftPack storage pack = giftPacks[codeHash];
        return (
            pack.sender,
            pack.claimed,
            pack.message,
            giftPackAssets[codeHash].length
        );
    }

    function getGiftPackAssets(bytes32 codeHash) external view returns (Asset[] memory assets) {
        require(codeHashExists[codeHash], "Gift pack not found");
        return giftPackAssets[codeHash];
    }

    function getAssetByIndex(bytes32 codeHash, uint256 index) external view returns (Asset memory asset) {
        require(codeHashExists[codeHash], "Gift pack not found");
        require(index < giftPackAssets[codeHash].length, "Asset index out of bounds");
        return giftPackAssets[codeHash][index];
    }

    function getAllCodeHashes() external view returns (bytes32[] memory codeHashes) {
        return allCodeHashes;
    }

    function validateGiftPackForLocking(
        bytes32 codeHash
    ) external view returns (bool valid, string memory reason) {
        if (codeHash == bytes32(0)) {
            return (false, "Code hash required");
        }
        if (codeHashExists[codeHash]) {
            return (false, "Code hash already exists");
        }
        return (true, "");
    }
}