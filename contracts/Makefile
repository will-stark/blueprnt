# Blueprnt contract toolchain
# Requires: forge (https://getfoundry.sh)

.PHONY: install build test deploy verify clean

install:
	forge install OpenZeppelin/openzeppelin-contracts@v5.3.0
	forge install foundry-rs/forge-std

build:
	forge build

test:
	forge test -vvv

# Deploy to Base mainnet
# Requires: DEPLOYER_PRIVATE_KEY, TREASURY_ADDRESS, OWNER_ADDRESS, BASE_RPC_URL in .env.contract
deploy:
	@test -f .env.contract || (echo "Fill in .env.contract before deploying" && exit 1)
	forge script script/Deploy.s.sol:Deploy \
		--env-file .env.contract \
		--rpc-url base \
		--broadcast \
		--verify \
		-vvvv

# Verify only (if broadcast already happened)
verify:
	forge script script/Deploy.s.sol:Deploy \
		--env-file .env.contract \
		--rpc-url base \
		--verify \
		-vvvv

clean:
	forge clean
