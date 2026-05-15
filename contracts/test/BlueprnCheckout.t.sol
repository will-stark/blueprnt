// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Test, console} from "forge-std/Test.sol";
import {BlueprnCheckout} from "../src/BlueprnCheckout.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @dev Minimal USDC stand-in with 6 decimals.
contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {}

    function decimals() public pure override returns (uint8) { return 6; }
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

contract BlueprnCheckoutTest is Test {
    BlueprnCheckout checkout;
    MockUSDC usdc;

    address treasury = makeAddr("treasury");
    address owner    = makeAddr("owner");
    address buyer    = makeAddr("buyer");

    function setUp() public {
        usdc     = new MockUSDC();
        checkout = new BlueprnCheckout(address(usdc), treasury, owner);
    }

    // ─── Price table ───────────────────────────────────────────────────────────

    function test_all_sku_prices() public view {
        assertEq(checkout.priceOf(0),   500_000);
        assertEq(checkout.priceOf(1),  1_000_000);
        assertEq(checkout.priceOf(2),  5_000_000);
        assertEq(checkout.priceOf(3), 10_000_000);
        assertEq(checkout.priceOf(10),   250_000);
        assertEq(checkout.priceOf(20),  5_000_000);
        assertEq(checkout.priceOf(21), 10_000_000);
        assertEq(checkout.priceOf(22), 15_000_000);
    }

    function test_unknown_sku_price_is_zero() public view {
        assertEq(checkout.priceOf(99), 0);
        assertEq(checkout.priceOf(4),  0);
        assertEq(checkout.priceOf(11), 0);
    }

    // ─── Happy path purchases ──────────────────────────────────────────────────

    function test_purchase_sku0_single_credit() public {
        uint256 price = checkout.priceOf(0);
        usdc.mint(buyer, price);

        vm.startPrank(buyer);
        usdc.approve(address(checkout), price);

        vm.expectEmit(true, true, true, true);
        emit BlueprnCheckout.Purchase(buyer, 0, price, bytes32(0));
        checkout.purchase(0, bytes32(0));
        vm.stopPrank();

        assertEq(usdc.balanceOf(treasury), price);
        assertEq(usdc.balanceOf(buyer), 0);
    }

    function test_purchase_sku3_biggest_pack() public {
        uint256 price = checkout.priceOf(3);
        usdc.mint(buyer, price);

        vm.startPrank(buyer);
        usdc.approve(address(checkout), price);
        checkout.purchase(3, bytes32(0));
        vm.stopPrank();

        assertEq(usdc.balanceOf(treasury), price);
    }

    function test_purchase_sku10_edit_refill_with_chatid_ref() public {
        // chatId encoded as bytes32: strip dashes, pad to 32 bytes left-aligned
        bytes32 chatId = bytes32(hex"550e8400e29b41d4a716446655440000");
        uint256 price  = checkout.priceOf(10);
        usdc.mint(buyer, price);

        vm.startPrank(buyer);
        usdc.approve(address(checkout), price);

        vm.expectEmit(true, true, true, true);
        emit BlueprnCheckout.Purchase(buyer, 10, price, chatId);
        checkout.purchase(10, chatId);
        vm.stopPrank();

        assertEq(usdc.balanceOf(treasury), price);
    }

    function test_purchase_tip_sku20() public {
        uint256 price = checkout.priceOf(20);
        usdc.mint(buyer, price);

        vm.startPrank(buyer);
        usdc.approve(address(checkout), price);
        checkout.purchase(20, bytes32(0));
        vm.stopPrank();

        assertEq(usdc.balanceOf(treasury), price);
    }

    // ─── Failure cases ─────────────────────────────────────────────────────────

    function test_revert_invalid_sku() public {
        vm.expectRevert(abi.encodeWithSelector(BlueprnCheckout.InvalidSku.selector, uint8(99)));
        vm.prank(buyer);
        checkout.purchase(99, bytes32(0));
    }

    function test_revert_insufficient_approval() public {
        uint256 price = checkout.priceOf(0);
        usdc.mint(buyer, price);

        vm.startPrank(buyer);
        usdc.approve(address(checkout), price - 1); // one unit short
        vm.expectRevert();
        checkout.purchase(0, bytes32(0));
        vm.stopPrank();
    }

    function test_revert_insufficient_balance() public {
        uint256 price = checkout.priceOf(0);
        usdc.mint(buyer, price - 1); // not enough

        vm.startPrank(buyer);
        usdc.approve(address(checkout), price);
        vm.expectRevert();
        checkout.purchase(0, bytes32(0));
        vm.stopPrank();
    }

    // ─── Owner functions ───────────────────────────────────────────────────────

    function test_set_treasury_as_owner() public {
        address newTreasury = makeAddr("newTreasury");
        vm.prank(owner);
        checkout.setTreasury(newTreasury);
        assertEq(checkout.treasury(), newTreasury);
    }

    function test_revert_set_treasury_not_owner() public {
        vm.expectRevert();
        vm.prank(buyer);
        checkout.setTreasury(buyer);
    }

    function test_revert_set_treasury_zero_address() public {
        vm.expectRevert(BlueprnCheckout.ZeroAddress.selector);
        vm.prank(owner);
        checkout.setTreasury(address(0));
    }

    function test_set_price_as_owner() public {
        vm.prank(owner);
        checkout.setPrice(0, 1_000_000);
        assertEq(checkout.priceOf(0), 1_000_000);
    }

    function test_disable_sku_by_setting_price_zero() public {
        vm.prank(owner);
        checkout.setPrice(0, 0);
        vm.expectRevert(abi.encodeWithSelector(BlueprnCheckout.InvalidSku.selector, uint8(0)));
        vm.prank(buyer);
        checkout.purchase(0, bytes32(0));
    }

    // ─── Constructor guards ────────────────────────────────────────────────────

    function test_revert_zero_usdc_address() public {
        vm.expectRevert(BlueprnCheckout.ZeroAddress.selector);
        new BlueprnCheckout(address(0), treasury, owner);
    }

    function test_revert_zero_treasury_address() public {
        vm.expectRevert(BlueprnCheckout.ZeroAddress.selector);
        new BlueprnCheckout(address(usdc), address(0), owner);
    }
}
