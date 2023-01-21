## Lender Pool - Documentation

LenderPool is an endless pool allowing Lenders to supply capital.  
The Pool then automatically allocates that capital across a 3rd party Defi protocol to hold stable and earn extra yield.
When Lenders supply to the Pool, they receive an equivalent amount of T-stable coin, which they can stake to get interest on their investments. Additionally lenders will receive trade token reward.

### Interest Calculation

Interest is received in T-Stable tokens. Interest is calculated using the formula given below

interest = (amount deposited _ APY _ time duration)/100

### Stable Token

Stable ERC20 tokens like DAI, USDC, USDT (6 Decimal Places)

### TStable Token

TStable are ERC20 tokens that will be minted by LenderPool and transferred to the lender. Lender can exchange tStable tokens for the sTable tokens using Redeem Pool.

### Trade Reward

Lenders will receive an additional reward per token. Trade tokens will be distributed to users.

### Redeem Pool

Lenders can exchange T-stable received for stable token from redeem pool. Stable token will be added to Redeem Pool by the Polytrade team.

### Staking Pool

Staking Pool helps Lender Pool to put stable ERC20 token to work and earning passive income while funds are not used by polytrade.
Staking Pool helps Lender Pool connect with other smart contracts such as AAVE, Compound(one at a time).The funds will be transferred to such protocol to earn reward. Later the funds will be withdrawn to the Lender Pool.

### Verification

It is used to do the KYC.

### Step-By-Step Guide for developers

## LenderPool

### constructor

```solidity
constructor(address _stableAddress, address _tStableAddress, address _redeemPool) public
```

### deposit

```solidity
function deposit(uint256 amount) external
```

Deposit stable token to Lender Pool

_Transfers the approved stable token from msg.sender to lender pool_

| Name   | Type    | Description                                |
| ------ | ------- | ------------------------------------------ |
| amount | uint256 | the number of stable token to be deposited |

### withdrawAllTStable

```solidity
function withdrawAllTStable() external
```

converts all the deposited stable token into tStable token and transfers to the lender

_calculates the tStable token lender can claim and transfers it to the lender_

### withdrawTStable

```solidity
function withdrawTStable(uint256 amount) external
```

converts the given amount of stable token into tStable token and transfers to lender

_checks the required condition and converts stable token to tStable and transfers to lender_

| Name   | Type    | Description                                                   |
| ------ | ------- | ------------------------------------------------------------- |
| amount | uint256 | total amount of stable token to be converted to tStable token |

### claimRewards

```solidity
function claimRewards() external
```

send lender all the reward

update the pendingReward and mint tStable token and send to lender

Emits {Withdraw} event

### setAPY

```solidity
function setAPY(uint16 _rewardAPY) external
```

adds a new round

_increment currentRound and adds a new round, only owner can call_

| Name        | Type   | Description            |
| ----------- | ------ | ---------------------- |
| \_rewardAPY | uint16 | value of new round.apy |

### redeemAll

```solidity
function redeemAll() external
```

transfers user all the reward in stable token

\_calculates and mint the reward
calls redeemStableTo function from RedeemPool to convert tStable to stable

Requirements:

- total reward should be not more than stable tokens in RedeemPool

### getAPY

```solidity
function getAPY() external view returns (uint16)
```

returns value of APY of current round

| Name | Type   | Description                           |
| ---- | ------ | ------------------------------------- |
| [0]  | uint16 | returns value of APY of current round |

### getDeposit

```solidity
function getDeposit(address lender) external view returns (uint256)
```

returns amount of stable token deposited by the lender

| Name   | Type    | Description       |
| ------ | ------- | ----------------- |
| lender | address | address of lender |

| Name | Type    | Description                                            |
| ---- | ------- | ------------------------------------------------------ |
| [0]  | uint256 | returns amount of stable token deposited by the lender |

### rewardOf

```solidity
function rewardOf(address lender) external view returns (uint256)
```

returns the total pending reward

_returns the total pending reward of msg.sender_

| Name | Type    | Description                      |
| ---- | ------- | -------------------------------- |
| [0]  | uint256 | returns the total pending reward |

## RedeemPool

### constructor

```solidity
constructor(address _stableAddress, address _tStableAddress) public
```

### withdrawStuckToken

```solidity
function withdrawStuckToken(address tokenAddress, uint amount) external
```

withdraw any token sent to RedeemPool by mistake

callable by only owner

| Name         | Type    | Description                     |
| ------------ | ------- | ------------------------------- |
| tokenAddress | uint256 | address of the token            |
| amount       | uint256 | the number of tokens to be sent |

### redeemStable

```solidity
function redeemStable(uint amount) external
```

exchange tStable token for the stable token

users can directly call this function using EOA after approving `amount`
| Name | Type | Description |
| ---- | ---- | ----------- |
|amount|uint256| the number of tokens to be exchanged|

### redeemStableTo

```solidity
 function redeemStableTo(uint amount, address account) external
```

exchange tStable token for the stable token

burns the tStable from msg.sender and sends stable to `account`

| Name    | Type    | Description                                               |
| ------- | ------- | --------------------------------------------------------- |
| amount  | uint256 | the number of tokens to be exchanged                      |
| account | address | address of the account that will receive the stable token |

## Token

### \_decimals

```solidity
uint8 _decimals
```

### MINTER_ROLE

```solidity
bytes32 MINTER_ROLE
```

### constructor

```solidity
constructor(string name_, string symbol_, uint8 decimals_) public
```

### mint

```solidity
function mint(address to, uint256 amount) external
```

mints ERC20 token

_creates &#x60;amount&#x60; tokens and assigns them to &#x60;to&#x60;, increasing the total supply._

| Name   | Type    | Description                           |
| ------ | ------- | ------------------------------------- |
| to     | address | receiver address of the ERC20 address |
| amount | uint256 | amount of ERC20 token minted          |

### decimals

```solidity
function decimals() public view virtual returns (uint8)
```

_Returns the number of decimals used to get its user representation._

## Strategy

### constructor

```solidity
constructor(address _stable, address _aStable) public
```

### deposit

```solidity
function deposit(uint256 amount) external
```

transfer funds to aave lending pool

_accepts token from msg.sender and transfers to aave lending pool_

| Name   | Type    | Description                                             |
| ------ | ------- | ------------------------------------------------------- |
| amount | uint256 | total amount accepted from user and transferred to aave |

### withdraw

```solidity
function withdraw(uint256 amount) external
```

withdraw funds from aave and send to lending pool

_can be called by only lender pool_

| Name   | Type    | Description                                             |
| ------ | ------- | ------------------------------------------------------- |
| amount | uint256 | total amount accepted from user and transferred to aave |
