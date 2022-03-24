# AugustusSwapper Contract Specification

## Introduction

Paraswap aggregates and structures the liquidity from dozens of decentralized exchanges & lending protocols, such as Uniswap, Kyber, Bancor, Aave etc., in order to facilitate token swaps on the Ethereum blockchain. Paraswap provides the best price and optimal execution, which means computing the prices and splitting orders across exchanges. Our users could end up paying 5 to 10% less than if they would do it themselves.

## Multi-path Swaps
To understand this better lets take an example. Suppose user wants to swap ETH -> DAI using paraswap.io.
    1. User goes to paraswap.io and chooses to swap 1 ETH for DAI
    2. paraswap.io Algo decides the best route to swap 1 ETH to DAI would be following which will result in 100 DAIs, better then any direct or single path swap-:
        1. Path 01- ETH -> BNT
            1. 30% of ETH(0.3) sent to Uniswap and get 20 BNT in return
            2. 50% of ETH(0.5) sent to Bancor and get 35 BNT in return
            3 20% of ETH(0.2) sent to Kyber and get 18 BNT in return
        2. Overall 73 BNTs are returned after path 01 is executed
        3. Path 02- BNT -> DAI
            1. 100% of BNT to 0x and get 100 DAIs
So this is an example of a multipath swap where a swap between 2 tokens can happen by multiple intermediary swaps via multiple exchanges in order to get the best exchange rate.

## Mega-path Swap
It's an extension of multi-path swap.
To understand this better lets take an example. Suppose user wants to swap ETH -> DAI using paraswap.io.
    1. User goes to paraswap.io and chooses to swap 1 ETH for DAI
    2. paraswap.io Algo decides the best route to swap 1 ETH to DAI would be following which will result in 100 DAIs, better then any direct/single or multi path swap-:
        1. Path 01- We use 80% of ETH used to convert to DAI using BNT- 80% ETH->BNT->DAI. Now this path is a multipath
        2. Path 02- We convert 20% of ETH directly to DAI- 20% ETH->DAI. This path is a multipath as well
So this is an example of a megapath swap where a swap between 2 tokens can happen by multiple intermediary swaps via multiple exchanges in order to get the best exchange rate.

## Single-path Swaps(Simple Swap)
In Multi-path swaps a complex data structure are defined to support multiple intermediary tokens for a particular swap, as described above. Single path swaps or simple swaps can also be executed using multi-path infrastructure. But due to the complexity of the data structures and logic involved
in multi-path swaps the gas costs involved are higher.
The higher gas costs make sense when we are executing swap through multi-path. But in case of single path swap this complexity and has overhead can be
avoided. Hence, we introduced a new mechanism to execute swaps which are going through a single path.

In single path swaps no intermediary tokens are involved. Suppose user wants to swap ETH -> DAI using paraswap.io.
1. User goes to paraswap.io and chooses to swap 1 ETH for DAI
2. paraswap.io Algo decides the best route to swap 1 ETH to DAI would be following which will result in 100 DAIs, which is a single path swap-:
    1. Path 01- ETH -> DAI
        1. 30% of ETH(0.3) sent to Uniswap and get 20 DAI in return
        2. 50% of ETH(0.5) sent to Bancor and get 62 DAI in return
        3. 20% of ETH(0.2) sent to Kyber and get 18 DAI in return



**IMPORTANT:** One important thing to keep in mind for each swap is that entire amount of source token must be consumed during the swap with no leftover after the transaction is complete. Similarly entire amount of destination token received should also be consumed, sent to the beneficiaries, with no leftover after the transaction is complete. This effectively means contract will never hold any user asset once the transaction is complete. So effectively the token balance of the contract must always be 0.
Any important point to keep in mind is that only whitelisted exchanges can be used in a swap.

## Fee
AugustusSwapper conract only supports partner fee for now and no other fee. The fee parameters are passed alongwith the call. By default partners share, paraswap's share and maximum fee percentage is set which will be used for most of the partners. Only registered partners can have different for these variables.

## Architecture
Main AugustusSwapper contract will act as a proxy contract. It will pass on calls to the respective routers as per the function signature. Each function call will have it's own specific router which needs to be registered by the admin.

## Router
For each specific trade type we will built a separate router. Right now we have routers for Multipath(megapath included), SimpleSwap and swapOnUniswap. Routers will delegate calls to the specific adapters


## Adapters
Adapters are a collection of different exchange handlers. Currently we have 2 adapters which clubs different exchange handlers together

![image](https://user-images.githubusercontent.com/1330744/119963571-87e0ce00-bfa8-11eb-8d36-9eab98361425.png)

