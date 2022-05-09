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
Staking Pool helps Lender Pool connect with other smart contracts such as AAVE, Compound(one at a time). The funds will be transferred to such protocol to earn reward. Later the funds will be withdrawn to the Lender Pool.

