// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title  BlueprnCheckout
 * @notice Single USDC checkout contract for Blueprnt on Base mainnet.
 *
 * All products are identified by an 8-bit SKU. Prices are enforced onchain —
 * the backend never has to infer purchase intent from transfer amount alone.
 *
 * SKU reference
 * ─────────────
 *   0  → 1 credit      $0.50   USDC  (500_000  raw)
 *   1  → 2 credits     $1.00   USDC  (1_000_000 raw)
 *   2  → 12 credits    $5.00   USDC  (5_000_000 raw)
 *   3  → 25 credits    $10.00  USDC  (10_000_000 raw)
 *  10  → 10 edits      $0.25   USDC  (250_000  raw)  ref = bytes32-encoded chatId
 *  20  → tip $5        $5.00   USDC  (5_000_000 raw)
 *  21  → tip $10       $10.00  USDC  (10_000_000 raw)
 *  22  → tip $15       $15.00  USDC  (15_000_000 raw)
 *
 * @dev    USDC on Base mainnet: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
 *         Chain ID 8453.
 */
contract BlueprnCheckout is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // ─── Immutables ────────────────────────────────────────────────────────────
    IERC20 public immutable usdc;

    // ─── Storage ───────────────────────────────────────────────────────────────
    address public treasury;

    /// @dev Maps SKU → price in USDC (6 decimals). Zero = SKU disabled.
    mapping(uint8 => uint256) public priceOf;

    // ─── Events ────────────────────────────────────────────────────────────────

    /**
     * @notice Emitted on every successful purchase.
     * @param buyer  Address that paid.
     * @param sku    Product identifier (see SKU reference above).
     * @param amount Exact USDC amount transferred (6 decimals).
     * @param ref    Arbitrary 32-byte context. For SKU 10 (edit refill), the
     *               backend decodes this as a UUID chatId (first 16 bytes,
     *               left-padded with zeros to bytes32).
     */
    event Purchase(
        address indexed buyer,
        uint8   indexed sku,
        uint256         amount,
        bytes32 indexed ref
    );

    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event PriceUpdated(uint8 indexed sku, uint256 newPrice);

    // ─── Errors ────────────────────────────────────────────────────────────────
    error InvalidSku(uint8 sku);
    error ZeroAddress();

    // ─── Constructor ───────────────────────────────────────────────────────────

    /**
     * @param _usdc      USDC contract on Base (0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
     * @param _treasury  Address that receives all USDC payments
     * @param _owner     Address that can update treasury and prices
     */
    constructor(address _usdc, address _treasury, address _owner) Ownable(_owner) {
        if (_usdc == address(0) || _treasury == address(0)) revert ZeroAddress();

        usdc     = IERC20(_usdc);
        treasury = _treasury;

        // Credit packs
        priceOf[0]  =  500_000;  // 1 credit   @ $0.50
        priceOf[1]  = 1_000_000; // 2 credits  @ $1.00
        priceOf[2]  = 5_000_000; // 12 credits @ $5.00
        priceOf[3]  = 10_000_000;// 25 credits @ $10.00

        // Edit refill
        priceOf[10] =  250_000;  // 10 edits   @ $0.25

        // Tips — no credits granted, just recorded
        priceOf[20] = 5_000_000; // tip $5
        priceOf[21] = 10_000_000;// tip $10
        priceOf[22] = 15_000_000;// tip $15
    }

    // ─── External ──────────────────────────────────────────────────────────────

    /**
     * @notice Purchase a product.
     *
     * The caller MUST have pre-approved this contract to spend at least
     * priceOf[sku] USDC before calling. The approved amount is pulled in a
     * single safeTransferFrom — no partial payments are possible.
     *
     * @param sku  Product identifier (see contract-level docs).
     * @param ref  32-byte reference. Pass bytes32(0) for credit packs and tips.
     *             For SKU 10 (edit refill), pass the chatId encoded as bytes32:
     *             strip UUID dashes, interpret as 16 bytes, left-pad to bytes32.
     */
    function purchase(uint8 sku, bytes32 ref) external nonReentrant {
        uint256 price = priceOf[sku];
        if (price == 0) revert InvalidSku(sku);

        // Pull payment atomically — reverts on any transfer failure.
        usdc.safeTransferFrom(msg.sender, treasury, price);

        emit Purchase(msg.sender, sku, price, ref);
    }

    // ─── Owner ─────────────────────────────────────────────────────────────────

    /// @notice Update the treasury address. Only callable by owner.
    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert ZeroAddress();
        emit TreasuryUpdated(treasury, newTreasury);
        treasury = newTreasury;
    }

    /// @notice Update the price for a SKU. Set to 0 to disable a SKU.
    function setPrice(uint8 sku, uint256 newPrice) external onlyOwner {
        priceOf[sku] = newPrice;
        emit PriceUpdated(sku, newPrice);
    }
}
