# Argent Trustlists

## Building trust on-chain

### DappRegistry

The goal of the Argent trustlist project is to provide an on-chain source of trust for smart-contract wallets like Argent
that need to interact with decentralized applications. This source of trust is provided on-chain by the `DappRegistry` contract whose only
function is to help wallets answer the question "Is it safe to call that smart-contract with that payload".

The role of the `DappRegistry` is therefore purely informative and it is the responsibility of each smart-contract wallet to act upon that information. For Argent wallets, only calls that are considered "safe" by the `DappRegistry` can be executed without the approval of guardians.

"Safe" is a broad term that can have many meanings depending on the context. Here we use a very constraining definition and the only one that is suitable to Argent wallets, namely that the total value of the wallet cannot decrease as a result of the interaction. For example it is "safe" to exchange tokens for one or more tokens of equivalent value, but it is "not safe" to transfer tokens out of the wallet with nothing in return. This strict definition is required for Argent wallets where the smart-contract must protect a user's assets even when the private key controlling the wallet is compromised.

Smart-contract wallets can leverage the `DappRegistry` via the `IAuthoriser` interface 

```Java
interface IAuthoriser {
    function isAuthorised(address _wallet, address _spender, address _to, bytes calldata _data) external view returns (bool);
}
```

### Trust lists

The `DappRegistry` contract consists of several lists of trusted dapps (aka trustlists). A wallet can decide to enable one or more trustlists based on its own usage and preferences, and the `DappRegistry` will authorise a transaction if and only if it is authorised in one of the trustlists enabled by the wallet starting the evaluation with the list at index 0.

There is currently 2 trustlists created and available to wallets , the **Argent trustlist** with ID 0 and the **Community trustlist** with ID 1.

The **Argent trustlist** contains the list of dapps (i.e. smart-contracts calls) that are natively integrated in the Argent client application. To save some gas it is enabled by default for all wallets but they can always opt-out at any time.

The **Community trustlist** is meant to contain a broader set of dapps that can be accessed via e.g. WalletConnect. It is disabled by default and wallets need to opt-in on-chain to add the dapps of this list to their trust zone.

### Filters

A trustlist is a mapping between the address of a dapp smart-contract and the address of a `Filter` contract containing the authorisation logic for that target contract. Authorisation is granted by inspecting the data that will be sent to the target contract. 

The `DappRegistry` may leverage a specific filter for authorisation in 2 situations: if the destination of the call to authorise is the target contract associated to the filter, or if the call to authorise is an ERC20/ERC721/ERC1155 standard method where the spender/recipient is the target contract. The latter situation is needed when the dapp contract needs access to a wallet's tokens, and the `Filter` must make sure that this cannot be abused by the dapp. 

In practice each filter implements the `IFilter` interface:

```Java
interface IFilter {
    function isValid(address _wallet, address _spender, address _to, bytes calldata _data) external view returns (bool valid);
}
```

### Deployments

The `DappRegistry` is currently deployed on the following networks:

| Network | Address |
| --------|---------|
| Ropsten | [0x72A813d9e451Bd2Af28269c35fc10c7DAeD21d7b](https://ropsten.etherscan.io/address/0x72A813d9e451Bd2Af28269c35fc10c7DAeD21d7b) |
| Mainnet | [0xB5ecC8ab46e2E20573C2e57C865F7c97f58c2798](https://etherscan.io/address/0xB5ecC8ab46e2E20573C2e57C865F7c97f58c2798) |

The status of the `DappRegistry`, Argent trustlist and Community trustlist on mainnet can be found at https://trustlists.argent.xyz/ .

## How to add your dapp

Please fork and open a pull request against the `develop` branch.

You PR should include
* A short explanation of your dapp and a list of all the methods that should be authorised.
* A new `Filter` contract under `contracts/myDapp/` that implements the `IFilter` interface and exposes a single `isValid` method

```Java

contract MyDappFilter is IFilter {

    function isValid(address _wallet, address _spender, address _to, bytes calldata _data) external view returns (bool valid) {
        if (_data.length == 0) {
            // the conditions for a secure ETH deposit
        }
        bytes4 method = getMethod(_data);
        if (_spender == _to) {
            // the conditions for a secure call to the target contract
        } else {
            // the conditions for a secure ERC20/ERC721/ERC1155 approve where the target contract is the spender
        }
    }
}
```
* A serie of unit tests under `test/myDapp` with 100% code coverage. Tests are executed against a fork of mainnet and should target your production contracts.

## Development

### Install
```
npm install
```

### Compile the contracts
```
npx hardhat compile
```

### Test the contracts
Add a `.env` file in the root of the directory with the `ALCHEMY_KEY` property set to your Alchemy API key then run 
```
npx hardhat test
````

### Run coverage
```
npx hardhat coverage
```

### Deploy
```
npx hardhat deploy-all --network [network]
```

## License

Released under [GPL-3.0](LICENSE)
