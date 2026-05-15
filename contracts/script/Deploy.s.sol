// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Script, console} from "forge-std/Script.sol";
import {BlueprnCheckout} from "../src/BlueprnCheckout.sol";

contract Deploy is Script {
    // Base mainnet USDC — canonical address, never changes
    address constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    function run() external {
        // Read from .env (never hardcode these)
        address treasury = vm.envAddress("TREASURY_ADDRESS");
        address owner    = vm.envAddress("OWNER_ADDRESS");

        require(treasury != address(0), "Deploy: TREASURY_ADDRESS not set");
        require(owner    != address(0), "Deploy: OWNER_ADDRESS not set");

        uint256 deployerPk = vm.envUint("DEPLOYER_PRIVATE_KEY");

        console.log("Deploying BlueprnCheckout...");
        console.log("  USDC:     ", USDC);
        console.log("  treasury: ", treasury);
        console.log("  owner:    ", owner);

        vm.startBroadcast(deployerPk);
        BlueprnCheckout checkout = new BlueprnCheckout(USDC, treasury, owner);
        vm.stopBroadcast();

        console.log("");
        console.log("Deployed BlueprnCheckout:", address(checkout));
        console.log("");
        console.log("Add to blueprnt_app/.env.local:");
        console.log("  NEXT_PUBLIC_CHECKOUT_ADDRESS=", address(checkout));
        console.log("  NEXT_PUBLIC_TREASURY_ADDRESS=", treasury);
    }
}
