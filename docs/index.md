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




### lenderPool

```solidity
mapping(address &#x3D;&gt; bool) lenderPool
```

### constructor

```solidity
constructor(address _stableAddress, address _tStableAddress) public
```

### depositStable

```solidity
function depositStable(uint256 amount) external
```

Deposit stable token to smart contract

_Transfers the approved stable token from msg.sender to redeem pool_

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 |  |

### convertToStable

```solidity
function convertToStable(uint256 amount) external
```

exchange tStable token for the stable token

_users can directly call this function using EOA_

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 |  |

### toStable

```solidity
function toStable(uint256 amount, address account) external
```

exchange tStable token for the stable token

_this function can be called using another smart contract_

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 |  |
| account | address |  |

### _convertToStable

```solidity
function _convertToStable(uint256 amount, address account) private
```

exchange tStable token for the stable token

_Transfers the approved tStable token from account to redeem pool and burn it
Transfers the  equivalent amount of stable token from redeem pool to account_

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 |  |
| account | address |  |


## RedeemPool

### stable

```solidity
contract IToken stable
```

### tStable

```solidity
contract IToken tStable
```

### constructor

```solidity
constructor(address _stableAddress, address _tStableAddress) public
```

### depositStable

```solidity
function depositStable(uint256 amount) external
```

Deposit stable token to smart contract

_Transfers the approved stable token from msg.sender to redeem pool_

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 |  |

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

