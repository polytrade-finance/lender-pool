import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  Token,
  LenderPool,
  RedeemPool,
  Verification,
  StableReward,
  RewardManager,
  TradeReward,
} from "../typechain";
import {
  increaseTime,
  n6,
  ONE_DAY,
  now,
  setNextBlockTimestamp,
  f6,
  f18,
  n18,
} from "./helpers";

describe("LenderPool", function () {
  let accounts: SignerWithAddress[];
  let addresses: string[];
  let lenderPool: LenderPool;
  let stable: Token;
  let tStable: Token;
  let verification: Verification;
  let trade: Token;
  let stableReward: StableReward;
  let tradeReward: TradeReward;
  let rewardManager: RewardManager;
  let redeemPool: RedeemPool;

  before(async () => {
    accounts = await ethers.getSigners();
    addresses = accounts.map((account: SignerWithAddress) => account.address);
  });

  it("Should deploy Stable", async () => {
    const Token = await ethers.getContractFactory("Token");
    stable = await Token.deploy("Tether", "USDT", 6);
    await stable.deployed();
    console.log((await stable.balanceOf(addresses[0])).toString());

  });

  it("Should deploy TStable", async () => {
    const TStable = await ethers.getContractFactory("Token");
    tStable = await TStable.deploy("Tether derivative", "TUSDT", 6);
    await tStable.deployed();
  });

  it("Should deploy Trade Token", async () => {
    const TradeToken = await ethers.getContractFactory("Token");
    trade = await TradeToken.deploy("Polytrade", "TRADE", 18);
    await trade.deployed();
    console.log((await trade.balanceOf(addresses[0])).toString());
  });

  it("Should deploy RedeemPool", async () => {
    const RedeemPoolContract = await ethers.getContractFactory("RedeemPool");
    redeemPool = await RedeemPoolContract.deploy(
      stable.address,
      tStable.address
    );
    await redeemPool.deployed();
  });

  it("Should deploy Redeem", async () => {
    const LenderPool = await ethers.getContractFactory("LenderPool");
    lenderPool = await LenderPool.deploy(
      stable.address,
      tStable.address,
      redeemPool.address
    );
    await lenderPool.deployed();
  });

  it("Should deploy Verification", async () => {
    const Verification = await ethers.getContractFactory("Verification");
    verification = await Verification.deploy();
    await verification.deployed();
  });



  it("Should deploy StableReward", async () => {
    const Reward = await ethers.getContractFactory("StableReward");
    stableReward = await Reward.deploy(stable.address);
  });

  it("Should send Stable to stableReward", async () => {
    await stable.transfer(stableReward.address, n6("10000"));
    expect(await stable.balanceOf(stableReward.address)).to.equal(
      n6("10000")
    );
  });

  it("Should deploy TradeReward", async () => {
    const Reward = await ethers.getContractFactory("TradeReward");
    tradeReward = await Reward.deploy(trade.address);
  });

  it("Should send Stable to stableReward", async () => {
    await trade.transfer(tradeReward.address, n18("10000"));
    expect(await trade.balanceOf(tradeReward.address)).to.equal(
      n18("10000")
    );
  });

  it("Should deploy RewardManager", async () => {
    const RewardManagerContract = await ethers.getContractFactory(
      "RewardManager"
    );
    rewardManager = await RewardManagerContract.deploy(
      stableReward.address,
      tradeReward.address
    );
  });

  it("Should increase APR to 10% for stable", async () => {
    await stableReward.setReward("1000");
    await tradeReward.setReward("100000000000000000");
  });

  it("Should increase tradeRate to 0.02 per Stable", async () => {
    await stableReward.setReward("1000");
    await tradeReward.setReward("20000000000000000");
  });

  it("Should set verification contract to LenderPool", async () => {
    expect(await lenderPool.verification()).to.equal(
      ethers.constants.AddressZero
    );
    await lenderPool.switchVerification(verification.address);
    expect(await lenderPool.verification()).to.equal(verification.address);
  });

  it("Should increase Verification Limit to 5000", async () => {
    expect(await verification.validationLimit()).to.equal(n6("0"));

    await verification.updateValidationLimit(n6("5000"));

    expect(await verification.validationLimit()).to.equal(n6("5000"));
  });

  it("Should set RewardManager", async () => {
    expect(await lenderPool.rewardManager()).to.equal(
      ethers.constants.AddressZero
    );

    await lenderPool.switchRewardManager(rewardManager.address);

    expect(await lenderPool.rewardManager()).to.equal(rewardManager.address);
  });

  it("Should not be able to deposit more than the Validation Limit", async () => {
    await stable.approve(lenderPool.address, n6("5000"));
    await expect(lenderPool.deposit(n6("5000"))).to.revertedWith(
      "Need to have valid KYC"
    );
  });

  it("Should be able to deposit less than the Validation Limit", async () => {
    await stable.approve(lenderPool.address, n6("1000"));
    await lenderPool.deposit(n6("1000"));
    expect(await lenderPool.getDeposit(addresses[0])).to.equal(n6("1000"));
  });

  it("Should returns the rewards after 1 year", async () => {
    await increaseTime(ONE_DAY * 365);
    const amountReward = await lenderPool.getRewards(addresses[0]);
    expect(f6(amountReward[0])).to.equal("100.0");
    expect(f18(amountReward[1])).to.equal("20.0");
  });

  it("Should be able to deposit 1000 more Stable", async () => {
    await stable.approve(lenderPool.address, n6("1000"));
    await lenderPool.deposit(n6("1000"));
    expect(await lenderPool.getDeposit(addresses[0])).to.equal(n6("2000"));
  });

  it("Should returns the rewards after 1 year", async () => {
    await increaseTime(ONE_DAY * 365);
    const amountReward = await lenderPool.getRewards(addresses[0]);
    expect(f6(amountReward[0])).to.equal("300.000006");
    expect(f18(amountReward[1])).to.equal("60.00000126839167935");
  });

  it("Should claim rewards", async () => {
    await lenderPool.claimRewards();
  });

  //
  // it("should set minter", async function () {
  //   await tStable.grantRole(
  //     ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINTER_ROLE")),
  //     lenderPool.address
  //   );
  //
  //   expect(
  //     await tStable.hasRole(
  //       ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINTER_ROLE")),
  //       lenderPool.address
  //     )
  //   );
  // });
  //
  // it("should set LENDER_POOL and OWNER in TradeReward", async function () {
  //   await reward.grantRole(
  //     ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LENDER_POOL")),
  //     lenderPool.address
  //   );
  //
  //   await reward.grantRole(
  //     ethers.utils.keccak256(ethers.utils.toUtf8Bytes("OWNER")),
  //     addresses[0]
  //   );
  //
  //   expect(
  //     await reward.hasRole(
  //       ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LENDER_POOL")),
  //       lenderPool.address
  //     )
  //   );
  //
  //   expect(
  //     await reward.hasRole(
  //       ethers.utils.keccak256(ethers.utils.toUtf8Bytes("OWNER")),
  //       addresses[0]
  //     )
  //   );
  // });
  //
  // it("should set trade and tradeReward in LenderPool", async function () {
  //   await lenderPool.setTrade(trade.address);
  //   expect(await lenderPool.trade()).to.be.equal(trade.address);
  //   await lenderPool.setTradeReward(reward.address);
  //   expect(await lenderPool.tradeReward()).to.be.equal(reward.address);
  // });
  //
  // it("should approve stable token", async function () {
  //   await stable.connect(accounts[0]).approve(lenderPool.address, 100);
  //   expect(
  //     await stable.allowance(addresses[0], lenderPool.address)
  //   ).to.be.equal(ethers.BigNumber.from("100"));
  // });
  //
  // it("should transfer tStable to lender pool", async function () {
  //   await tStable
  //     .connect(accounts[0])
  //     .transfer(lenderPool.address, 100 * 10 ** 6);
  //   expect(await tStable.balanceOf(lenderPool.address)).to.be.equal(n6("100"));
  // });
  //
  // it("should check balance of user is zero", async function () {
  //   expect(await lenderPool.getDeposit(addresses[0])).to.be.equal(0);
  // });
  //
  // it("should fail deposits stable token without KYC", async function () {
  //   await expect(
  //     lenderPool.connect(accounts[0]).deposit(100)
  //   ).to.be.revertedWith("Need to have valid KYC");
  // });
  //
  // it("should increase the minimum deposit before KYC", async () => {
  //   await lenderPool.updateKYCLimit(n6("5000"));
  // });
  //
  // it("should deposit stable token successfully", async function () {
  //   await lenderPool.connect(accounts[0]).deposit(100);
  //   expect(await stable.balanceOf(lenderPool.address)).to.be.equal(
  //     ethers.BigNumber.from("100")
  //   );
  // });
  //
  // it("should check balance of user after deposit", async function () {
  //   expect(await lenderPool.getDeposit(addresses[0])).to.be.equal(100);
  // });
  //
  // it("should revert if tStable claimed is more than stable deposited", async function () {
  //   expect(
  //     lenderPool.connect(accounts[0]).withdrawTStable(1000)
  //   ).to.be.revertedWith("Amount requested more than deposit made");
  // });
  //
  // it("should claim tStable successfully", async function () {
  //   const balanceBefore = await tStable.balanceOf(addresses[0]);
  //   await lenderPool.connect(accounts[0]).withdrawTStable(1);
  //   const balanceAfter = await tStable.balanceOf(addresses[0]);
  //   expect(balanceAfter.sub(balanceBefore)).to.be.equal(
  //     ethers.BigNumber.from("1")
  //   );
  // });
  //
  // it("should claim all tStable successfully", async function () {
  //   const balanceBefore = await tStable.balanceOf(addresses[0]);
  //   await lenderPool.connect(accounts[0]).withdrawAllTStable();
  //   const balanceAfter = await tStable.balanceOf(addresses[0]);
  //   expect(balanceAfter.sub(balanceBefore)).to.be.equal(
  //     ethers.BigNumber.from("99")
  //   );
  // });
  //
  // it("should revert if all tStable is claimed", function async() {
  //   expect(
  //     lenderPool.connect(accounts[0]).withdrawAllTStable()
  //   ).to.be.revertedWith("tStable already claimed");
  // });
  //
  // it("should revert if allowance is less than lending amount", async function () {
  //   expect(lenderPool.connect(accounts[0]).deposit(100)).to.be.revertedWith(
  //     "Amount not approved"
  //   );
  // });
  //
  // it("should revert if amount is zero", async function () {
  //   expect(lenderPool.connect(accounts[0]).deposit(0)).to.be.revertedWith(
  //     "Lending amount invalid"
  //   );
  // });
  //
  // it("should revert if no amount is deposited", async function () {
  //   expect(
  //     lenderPool.connect(accounts[1]).withdrawAllTStable()
  //   ).to.be.revertedWith("No deposit made");
  // });
});
// describe("Rewards with multiple withdrawals and deposits on a single round", function () {
//   let accounts: SignerWithAddress[];
//   let addresses: string[];
//   let lenderPool: LenderPool;
//   let stable: Token;
//   let tStable: Token;
//   let verification: Verification;
//   let currentTime: number = 0;
//   let trade: Token;
//   let reward: Reward;
//   before(async () => {
//     accounts = await ethers.getSigners();
//     addresses = accounts.map((account: SignerWithAddress) => account.address);
//     const Token = await ethers.getContractFactory("Token");
//     stable = await Token.deploy("Tether", "USDT", 6);
//     await stable.deployed();
//     const TStable = await ethers.getContractFactory("Token");
//     tStable = await TStable.deploy("Tether derivative", "TUSDT", 6);
//     const LenderPool = await ethers.getContractFactory("LenderPool");
//     lenderPool = await LenderPool.deploy(
//       stable.address,
//       tStable.address,
//       ethers.constants.AddressZero
//     );
//     await lenderPool.deployed();
//
//     const Verification = await ethers.getContractFactory("Verification");
//     verification = await Verification.deploy();
//     await verification.deployed();
//
//     await lenderPool.updateVerificationContract(verification.address);
//     await lenderPool.updateKYCLimit(n6("5000"));
//
//     trade = await Token.deploy("Trade", "Trade", 6);
//     await trade.deployed();
//     const Reward = await ethers.getContractFactory("Reward");
//     reward = await Reward.deploy();
//   });
//
//   it("should transfer stable to others EOA's", async function () {
//     await stable.connect(accounts[0]).transfer(addresses[1], n6("10000"));
//     expect(await stable.balanceOf(addresses[1])).to.be.equal(n6("10000"));
//   });
//
//   it("should set minter", async function () {
//     tStable.grantRole(
//       ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINTER_ROLE")),
//       lenderPool.address
//     );
//
//     expect(
//       await tStable.hasRole(
//         ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINTER_ROLE")),
//         lenderPool.address
//       )
//     );
//   });
//
//   it("should set APY to 10%", async function () {
//     await lenderPool.setAPY(1000);
//     expect(await lenderPool.getAPY()).to.be.equal(1000);
//   });
//
//   it("should not be able to increase APY", async function () {
//     expect(lenderPool.connect(accounts[1]).setAPY(20)).to.be.revertedWith(
//       "Ownable: caller is not the owner"
//     );
//   });
//
//   it("should set LENDER_POOL and OWNER in TradeReward", async function () {
//     await reward.grantRole(
//       ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LENDER_POOL")),
//       lenderPool.address
//     );
//
//     await reward.grantRole(
//       ethers.utils.keccak256(ethers.utils.toUtf8Bytes("OWNER")),
//       addresses[0]
//     );
//
//     expect(
//       await reward.hasRole(
//         ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LENDER_POOL")),
//         lenderPool.address
//       )
//     );
//
//     expect(
//       await reward.hasRole(
//         ethers.utils.keccak256(ethers.utils.toUtf8Bytes("OWNER")),
//         addresses[0]
//       )
//     );
//   });
//
//   it("should set trade and tradeReward in LenderPool", async function () {
//     await lenderPool.setTrade(trade.address);
//     expect(await lenderPool.trade()).to.be.equal(trade.address);
//     await lenderPool.setTradeReward(reward.address);
//     expect(await lenderPool.tradeReward()).to.be.equal(reward.address);
//   });
//
//   it("should set trade rate", async function () {
//     await reward.setReward(100);
//   });
//
//   it("should deposit 100 stable tokens successfully from account 1 at t = 0 year", async function () {
//     await stable.connect(accounts[1]).approve(lenderPool.address, n6("100"));
//     expect(n6("100")).to.be.equal(
//       await stable.allowance(addresses[1], lenderPool.address)
//     );
//     currentTime = await now();
//     await lenderPool.connect(accounts[1]).deposit(n6("100"));
//
//     expect(await lenderPool.getDeposit(addresses[1])).to.be.equal(n6("100"));
//   });
//
//   it("should withdraw reward at t = 1 year total of 10 tStable token", async function () {
//     const balanceBefore = await tStable.balanceOf(addresses[1]);
//     await setNextBlockTimestamp(currentTime + ONE_DAY * 365);
//     await lenderPool.connect(accounts[1]).claimRewards();
//     const balanceAfter = await tStable.balanceOf(addresses[1]);
//     expect(balanceAfter.sub(balanceBefore)).to.be.equal(n6("10"));
//   });
//
//   it("should deposit 100 stable token from account 1 at t = 2 year", async function () {
//     await stable.connect(accounts[1]).approve(lenderPool.address, n6("100"));
//     expect(n6("100")).to.be.equal(
//       await stable.allowance(addresses[1], lenderPool.address)
//     );
//     await setNextBlockTimestamp(currentTime + ONE_DAY * 365 * 2);
//     await lenderPool.connect(accounts[1]).deposit(n6("100"));
//     expect(await lenderPool.getDeposit(addresses[1])).to.be.equal(n6("200"));
//   });
//
//   it("should withdraw reward at t = 3 year is 30 tStable token", async function () {
//     const balanceBefore = await tStable.balanceOf(addresses[1]);
//     await setNextBlockTimestamp(currentTime + ONE_DAY * 365 * 3);
//     await lenderPool.connect(accounts[1]).claimRewards();
//     const balanceAfter = await tStable.balanceOf(addresses[1]);
//     expect(balanceAfter.sub(balanceBefore)).to.be.equal(n6("30"));
//   });
//
//   it("should withdraw 100 tStable and check reward after 1 year is 10 tStable token", async function () {
//     await lenderPool.connect(accounts[1]).withdrawTStable(n6("100"));
//     await increaseTime(ONE_DAY * 365);
//     const balanceBefore = await tStable.balanceOf(addresses[1]);
//     await lenderPool.connect(accounts[1]).claimRewards();
//     const balanceAfter = await tStable.balanceOf(addresses[1]);
//     expect(balanceAfter.sub(balanceBefore)).to.be.equal(n6("10"));
//   });
//
//   it("should check for no reward", async function () {
//     expect(lenderPool.connect(accounts[1]).claimRewards()).to.be.revertedWith(
//       "No pending reward"
//     );
//   });
//
//   it("should withdraw all funds", async function () {
//     const balanceBefore = await tStable.balanceOf(addresses[1]);
//     await lenderPool.connect(accounts[1]).withdrawAllTStable();
//     const balanceAfter = await tStable.balanceOf(addresses[1]);
//     expect(balanceAfter.sub(balanceBefore)).to.be.equal(n6("100"));
//   });
// });
