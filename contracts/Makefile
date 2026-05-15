# Blueprnt contract toolchain
# Requires: forge (https://getfoundry.sh)

.PHONY: install build test deploy verify clean

install:
	forge install OpenZeppelin/openzeppelin-contracts@v5.3.0 --no-commit
	forge install foundry-rs/forge-std --no-commit

build:
	forge build

test:
	forge test -vvv

# Deploy to Base mainnet
# Requires in .env: DEPLOYER_PRIVATE_KEY, TREASURY_ADDRESS, OWNER_ADDRESS, BASE_RPC_URL
deploy:
	@test -f .env || (echo "Copy .env.example to .env and fill in values" && exit 1)
	forge script script/Deploy.s.sol:Deploy \
		--rpc-url base \
		--broadcast \
		--verify \
		-vvvv

# Verify only (if broadcast already happened)
verify:
	forge script script/Deploy.s.sol:Deploy \
		--rpc-url base \
		--verify \
		-vvvv

clean:
	forge clean
