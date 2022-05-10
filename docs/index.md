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

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 |  |

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

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | total amount of stable token to be converted to tStable token |

### claimRewards

```solidity
function claimRewards() external
```

send lender all the reward

_update the pendingReward and mint tStable token and send to lender

Emits {Withdraw} event

### setAPY

```solidity
function setAPY(uint16 _rewardAPY) external
```

adds a new round

_increment currentRound and adds a new round, only owner can call_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _rewardAPY | uint16 | value of new round.apy |

### redeemAll

```solidity
function redeemAll() external
```

transfers user all the reward in stable token

_calculates and mint the reward
calls redeemStableTo function from RedeemPool to convert tStable to stable

Requirements:

- total reward should be not more than stable tokens in RedeemPool

### getAPY

```solidity
function getAPY() external view returns (uint16)
```

returns value of APY of current round

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint16 | returns value of APY of current round |

### getDeposit

```solidity
function getDeposit(address lender) external view returns (uint256)
```

returns amount of stable token deposited by the lender

| Name | Type | Description |
| ---- | ---- | ----------- |
| lender | address |   address of lender|

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | returns amount of stable token deposited by the lender |

### rewardOf

```solidity
function rewardOf(address lender) external view returns (uint256)
```

returns the total pending reward

_returns the total pending reward of msg.sender_

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | returns the total pending reward |

### _withdraw

```solidity
function _withdraw(uint256 amount) private
```

converts the deposited stable token of quantity &#x60;amount&#x60; into tStable token and send to the lender

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | to be sent to the msg.sender |

### _updatePendingReward

```solidity
function _updatePendingReward(address lender) private
```

updates round, pendingRewards and startTime of the lender

_compares the lender round with currentRound and updates _lender accordingly_

| Name | Type | Description |
| ---- | ---- | ----------- |
| lender | address | address of the lender |

### _calculateCurrentRound

```solidity
function _calculateCurrentRound(address lender) private view returns (uint256)
```

return the total reward when lender round is equal to currentRound

| Name | Type | Description |
| ---- | ---- | ----------- |
| lender | address | address of the lender |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | returns total pending reward |

### _calculateFromPreviousRounds

```solidity
function _calculateFromPreviousRounds(address lender) private view returns (uint256)
```

return the total reward when lender round is less than currentRound

| Name | Type | Description |
| ---- | ---- | ----------- |
| lender | address | address of the lender |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | returns total pending reward |

### _calculateReward

```solidity
function _calculateReward(uint256 amount, uint40 start, uint40 end, uint16 apy) private pure returns (uint256)
```

calculates the reward

_calculates the reward using simple interest formula_

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | principal amount |
| start | uint40 | of the tenure for reward |
| end | uint40 | of the tenure for reward |
| apy | uint16 | Annual percentage yield received during the tenure |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | returns reward |

### _max

```solidity
function _max(uint40 a, uint40 b) private pure returns (uint40)
```

returns maximum among two uint40 variables

_compares two uint40 variables a and b and return maximum between them_

| Name | Type | Description |
| ---- | ---- | ----------- |
| a | uint40 | value of uint40 variable |
| b | uint40 |  value of uint40 variable|

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint40 | returns maximum between a and b |

### _min

```solidity
function _min(uint40 a, uint40 b) private pure returns (uint40)
```

returns minimum among two uint40 variables

_compares two uint40 variables a and b and return minimum between them_

| Name | Type | Description |
| ---- | ---- | ----------- |
| a | uint40 | value of uint40 variable |
| b | uint40 | value of uint40 variable |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint40 | returns minimum between a and b |


## RedeemPool

### constructor

```solidity
constructor(address _stableAddress, address _tStableAddress) public
```


### convertToStable

```solidity
function convertToStable(uint256 amount) external
```

exchange tStable token for the stable token

_Transfers the approved tStable token from msg.sender to redeem pool and burn it
Transfers the  equivalent amount of stable token from redeem pool to msg.sender_

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 |  |

## Token

### _decimals

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

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address |  |
| amount | uint256 | of ERC20 token minted Emits a {Transfer} event with &#x60;from&#x60; set to the zero address. Requirements: - &#x60;to&#x60; cannot be the zero address. |

### decimals

```solidity
function decimals() public view virtual returns (uint8)
```

_Returns the number of decimals used to get its user representation._

## StakingPool

### stable

```solidity
contract IToken stable
```

### aStable

```solidity
contract IToken aStable
```

### aave

```solidity
contract IAaveLendingPool aave
```

### LENDER_POOL

```solidity
bytes32 LENDER_POOL
```

### LENDING_POOL

```solidity
bytes32 LENDING_POOL
```

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

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 |  |

### withdraw

```solidity
function withdraw(uint256 amount) external
```

withdraw funds from aave and send to lending pool

_can be called by only lender pool_

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 |  |


