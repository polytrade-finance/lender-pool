import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  Token,
  LenderPool,
  Verification,
  Reward,
  RewardManager,
  RedeemPool,
  Strategy,
} from "../typechain";

import { aUSDTAddress } from "./constants/constants.helpers";

import {
  increaseTime,
  n6,
  ONE_DAY,
  now,
  setNextBlockTimestamp,
} from "./helpers";

describe("Lender Pool", function () {
  let accounts: SignerWithAddress[];
  let addresses: string[];
  let stableToken: Token;
  let tStableToken: Token;
  let tradeToken: Token;
  let aStable: any;
  let redeemPool: RedeemPool;
  let stableReward: Reward;
  let tradeReward: Reward;
  let rewardManager: RewardManager;
  let verification: Verification;
  let lenderPool: LenderPool;
  let strategy: Strategy;
  let currentTime: number = 0;
  before(async () => {
    accounts = await ethers.getSigners();
    addresses = accounts.map((account: SignerWithAddress) => account.address);

    const Token = await ethers.getContractFactory("Token");
    stableToken = await Token.deploy("Tether", "USDT", 6);
    tStableToken = await Token.deploy("Tether derivative", "TUSDT", 6);
    tradeToken = await Token.deploy("PolyTrade", "poly", 6);
    expect(
      await ethers.provider.getCode(stableToken.address)
    ).to.be.length.above(10);
    expect(
      await ethers.provider.getCode(tStableToken.address)
    ).to.be.length.above(10);
    expect(
      await ethers.provider.getCode(tradeToken.address)
    ).to.be.length.above(10);

    const RedeemPool = await ethers.getContractFactory("RedeemPool");
    redeemPool = await RedeemPool.deploy(
      stableToken.address,
      tStableToken.address
    );
    expect(
      await ethers.provider.getCode(redeemPool.address)
    ).to.be.length.above(10);

    const Reward = await ethers.getContractFactory("Reward");
    stableReward = await Reward.deploy(stableToken.address);
    tradeReward = await Reward.deploy(tradeToken.address);
    expect(
      await ethers.provider.getCode(stableReward.address)
    ).to.be.length.above(10);
    expect(
      await ethers.provider.getCode(tradeReward.address)
    ).to.be.length.above(10);

    const RewardManager = await ethers.getContractFactory("RewardManager");
    rewardManager = await RewardManager.deploy(
      stableReward.address,
      tradeReward.address
    );
    expect(
      await ethers.provider.getCode(rewardManager.address)
    ).to.be.length.above(10);

    const LenderPool = await ethers.getContractFactory("LenderPool");
    lenderPool = await LenderPool.deploy(
      stableToken.address,
      tStableToken.address,
      redeemPool.address
    );
    expect(
      await ethers.provider.getCode(lenderPool.address)
    ).to.be.length.above(10);

    const Verification = await ethers.getContractFactory("Verification");
    verification = await Verification.deploy();
    expect(
      await ethers.provider.getCode(verification.address)
    ).to.be.length.above(10);

    aStable = await ethers.getContractAt("IERC20", aUSDTAddress, accounts[0]);
    const Strategy = await ethers.getContractFactory("Strategy");
    strategy = await Strategy.deploy(stableToken.address, aStable.address);
    await strategy.deployed();
    expect(await ethers.provider.getCode(strategy.address)).to.be.length.above(
      10
    );

    await stableReward.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("REWARD_MANAGER")),
      rewardManager.address
    );

    await stableReward.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("OWNER")),
      addresses[1]
    );

    await tradeReward.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("REWARD_MANAGER")),
      rewardManager.address
    );

    await tradeReward.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("OWNER")),
      addresses[1]
    );

    expect(
      await stableReward.hasRole(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("REWARD_MANAGER")),
        rewardManager.address
      )
    );

    expect(
      await stableReward.hasRole(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("OWNER")),
        addresses[1]
      )
    );

    expect(
      await tradeReward.hasRole(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("REWARD_MANAGER")),
        rewardManager.address
      )
    );

    expect(
      await tradeReward.hasRole(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("OWNER")),
        addresses[1]
      )
    );

    await rewardManager.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LENDER_POOL")),
      lenderPool.address
    );

    expect(
      await rewardManager.hasRole(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LENDER_POOL")),
        lenderPool.address
      )
    );

    await strategy.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LENDER_POOL")),
      lenderPool.address
    );

    expect(
      await strategy.hasRole(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LENDER_POOL")),
        lenderPool.address
      )
    );

    await redeemPool.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LENDER_POOL")),
      lenderPool.address
    );

    await redeemPool.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("OWNER")),
      addresses[1]
    );

    expect(
      await redeemPool.hasRole(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LENDER_POOL")),
        lenderPool.address
      )
    );

    expect(
      await redeemPool.hasRole(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("OWNER")),
        addresses[1]
      )
    );

    await tStableToken.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINTER_ROLE")),
      lenderPool.address
    );

    expect(
      await tStableToken.hasRole(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINTER_ROLE")),
        lenderPool.address
      )
    );
  });

  it("should transfer tokens (INITIAL SET UP)", async () => {
    await stableToken
      .connect(accounts[0])
      .transfer(stableReward.address, n6("10000"));
    expect(await stableToken.balanceOf(stableReward.address)).to.be.equal(
      n6("10000")
    );

    await tradeToken
      .connect(accounts[0])
      .transfer(tradeReward.address, n6("10000"));
    expect(await tradeToken.balanceOf(tradeReward.address)).to.be.equal(
      n6("10000")
    );

    await stableToken.
      connect(accounts[0])
      .transfer(redeemPool.address,n6("10000"));
      expect(await stableToken.balanceOf(redeemPool.address)).to.be.equal(
        n6("10000")
      );

    await stableToken.connect(accounts[0]).transfer(addresses[1], n6("1000"));
    expect(await stableToken.balanceOf(addresses[1])).to.be.equal(n6("1000"));

    await stableToken.connect(accounts[0]).transfer(addresses[2], n6("1000"));
    expect(await stableToken.balanceOf(addresses[2])).to.be.equal(n6("1000"));

    await stableToken.connect(accounts[0]).transfer(addresses[3], n6("1000"));
    expect(await stableToken.balanceOf(addresses[3])).to.be.equal(n6("1000"));

    await stableToken.connect(accounts[0]).transfer(addresses[4], n6("1000"));
    expect(await stableToken.balanceOf(addresses[4])).to.be.equal(n6("1000"));

    await stableToken.connect(accounts[0]).transfer(addresses[5], n6("1000"));
    expect(await stableToken.balanceOf(addresses[5])).to.be.equal(n6("1000"));

    await stableToken.connect(accounts[0]).transfer(addresses[6], n6("5000"));
    expect(await stableToken.balanceOf(addresses[6])).to.be.equal(n6("5000"));
  });

  it("Should set verification contract to LenderPool", async () => {
    await lenderPool.updateVerificationContract(verification.address);
    expect(await lenderPool.verification()).to.be.equal(verification.address);
  });

  it("should set RewardManager in LenderPool", async () => {
    await lenderPool.switchRewardManager(rewardManager.address);
    expect(await lenderPool.rewardManager()).to.be.equal(rewardManager.address);
  });

  it("should check deposit of account 2 is 0 in LenderPool", async () => {
    expect(await lenderPool.getDeposit(addresses[2])).to.be.equal(0);
  });

  it("should approve 100 stable token from account 2", async function () {
    await stableToken
      .connect(accounts[2])
      .approve(lenderPool.address, n6("100"));
    expect(
      await stableToken.allowance(addresses[2], lenderPool.address)
    ).to.be.equal(ethers.BigNumber.from(n6("100")));
  });

  it("should fail deposits stable token without KYC", async function () {
    await expect(
      lenderPool.connect(accounts[2]).deposit(n6("100"))
    ).to.be.revertedWith("Need to have valid KYC");
  });

  it("should increase the minimum deposit before KYC", async () => {
    await verification.updateValidationLimit(n6("5000"));
  });

  it("should deposit 100 stable token from account 2", async function () {
    await lenderPool.connect(accounts[2]).deposit(n6("100"));
    expect(await lenderPool.getDeposit(addresses[2])).to.be.equal(
      ethers.BigNumber.from(n6("100"))
    );
  });

  it("should revert, claimed amount is more than deposited", async function () {
    expect(
      lenderPool.connect(accounts[2]).withdrawDeposit(n6("1000"))
    ).to.be.revertedWith("Amount requested more than deposit made");
  });

  it("should claim 10 tStable from account 2", async function () {
    const balanceBefore = await tStableToken.balanceOf(addresses[2]);
    await lenderPool.connect(accounts[2]).withdrawDeposit(n6("10"));
    const balanceAfter = await tStableToken.balanceOf(addresses[2]);
    expect(balanceAfter.sub(balanceBefore)).to.be.equal(
      ethers.BigNumber.from(n6("10"))
    );
  });

  it("should claim the rest of tStable deposited", async function () {
    const balanceBefore = await tStableToken.balanceOf(addresses[2]);
    await lenderPool.connect(accounts[2]).withdrawAllDeposit();
    const balanceAfter = await tStableToken.balanceOf(addresses[2]);
    expect(balanceAfter.sub(balanceBefore)).to.be.equal(
      ethers.BigNumber.from(n6("90"))
    );
  });

  it("should revert if no amount is deposited", function async() {
    expect(
      lenderPool.connect(accounts[2]).withdrawAllDeposit()
    ).to.be.revertedWith("No amount deposited");
  });

  it("should revert if allowance is less than deposit amount", async function () {
    expect(
      lenderPool.connect(accounts[2]).deposit(n6("1000"))
    ).to.be.revertedWith("Not enough allowance");
  });

  it("should revert if deposit amount is zero", async function () {
    expect(lenderPool.connect(accounts[3]).deposit(n6("0"))).to.be.revertedWith(
      "Amount must be positive integer"
    );
  });

  it("should set stable apy to 10% and trade apy to 2", async function () {
    await tradeReward.connect(accounts[1]).setReward(200);
    await stableReward.connect(accounts[1]).setReward(1000);
    expect(await tradeReward.getReward()).to.be.equal(200);
    expect(await stableReward.getReward()).to.be.equal(1000);
  });

  it("should not be able to set trade apy", async function () {
    expect(tradeReward.connect(accounts[3]).setReward(20)).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
  });

  it("should deposit 100 token from account 3 at t = 0 year", async function () {
    await stableToken
      .connect(accounts[3])
      .approve(lenderPool.address, n6("100"));
    expect(n6("100")).to.be.equal(
      await stableToken.allowance(addresses[3], lenderPool.address)
    );
    currentTime = await now();
    await lenderPool.connect(accounts[3]).deposit(n6("100"));
    expect(await lenderPool.getDeposit(addresses[3])).to.be.equal(n6("100"));
  });

  it("should withdraw all reward at t = 1 year", async function () {
    const stableBefore = await stableToken.balanceOf(addresses[3]);
    const tradeBefore = await tradeToken.balanceOf(addresses[3]);
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365);
    await lenderPool.connect(accounts[3]).claimRewards();
    const stableAfter = await stableToken.balanceOf(addresses[3]);
    const tradeAfter = await tradeToken.balanceOf(addresses[3]);
    expect(stableAfter.sub(stableBefore)).to.be.equal(n6("10"));
    expect(tradeAfter.sub(tradeBefore)).to.be.equal(n6("2"));
  });

  it("should deposit 100 token from account 3 at t = 2 year", async function () {
    await stableToken
      .connect(accounts[3])
      .approve(lenderPool.address, n6("100"));
    expect(n6("100")).to.be.equal(
      await stableToken.allowance(addresses[3], lenderPool.address)
    );
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365 * 2);
    await lenderPool.connect(accounts[3]).deposit(n6("100"));
    expect(await lenderPool.getDeposit(addresses[3])).to.be.equal(n6("200"));
  });

  it("should withdraw all reward at t = 3 year", async function () {
    const balanceBefore = await stableToken.balanceOf(addresses[3]);
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365 * 3);
    await lenderPool.connect(accounts[3]).claimRewards();
    const balanceAfter = await stableToken.balanceOf(addresses[3]);
    expect(balanceAfter.sub(balanceBefore)).to.be.equal(n6("30"));
  });

  it("should withdraw 100 tStable and check reward after 1 year is 10 stable token", async function () {
    await lenderPool.connect(accounts[3]).withdrawDeposit(n6("100"));
    await increaseTime(ONE_DAY * 365);
    const balanceBefore = await stableToken.balanceOf(addresses[3]);
    await lenderPool.connect(accounts[3]).claimRewards();
    const balanceAfter = await stableToken.balanceOf(addresses[3]);
    expect(balanceAfter.sub(balanceBefore)).to.be.equal(n6("10"));
  });

  it("should check for no reward", async function () {
    expect(lenderPool.connect(accounts[3]).claimRewards()).to.be.revertedWith(
      "No pending reward"
    );
  });

  it("should withdraw all deposited", async function () {
    const balanceBefore = await tStableToken.balanceOf(addresses[3]);
    await lenderPool.connect(accounts[3]).withdrawAllDeposit();
    const balanceAfter = await tStableToken.balanceOf(addresses[3]);
    expect(balanceAfter.sub(balanceBefore)).to.be.equal(n6("100"));
  });

  it("should deposit 100 tokens from account 4 at t = 0 year", async function () {
    await stableToken
      .connect(accounts[4])
      .approve(lenderPool.address, n6("100"));
    expect(n6("100")).to.be.equal(
      await stableToken.allowance(addresses[4], lenderPool.address)
    );
    await lenderPool.connect(accounts[4]).deposit(n6("100"));
    currentTime = await now();
    expect(await lenderPool.getDeposit(addresses[4])).to.be.equal(n6("100"));
  });

  it("should set APY to 20% at t = 1 year", async function () {
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365);
    await stableReward.connect(accounts[1]).setReward(2000);
    expect(await stableReward.getReward()).to.be.equal(2000);
  });

  it("should check reward at t = 2 year", async function () {
    const balanceBefore = await stableToken.balanceOf(addresses[4]);
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365 * 2);
    await lenderPool.connect(accounts[4]).claimRewards();
    const balanceAfter = await stableToken.balanceOf(addresses[4]);
    expect(balanceAfter.sub(balanceBefore)).to.be.equal(n6("30"));
  });

  it("should set APY to 10% at t = 3 year", async function () {
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365 * 3);
    await stableReward.connect(accounts[1]).setReward(1000);
    expect(await stableReward.getReward()).to.be.equal(1000);
  });

  it("should set APY to 20% at t = 4 year", async function () {
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365 * 4);
    await stableReward.connect(accounts[1]).setReward(2000);
    expect(await stableReward.getReward()).to.be.equal(2000);
  });

  it("should claim reward at t = 5 year", async function () {
    const balanceBefore = await stableToken.balanceOf(addresses[4]);
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365 * 5);
    await lenderPool.connect(accounts[4]).claimRewards();
    const balanceAfter = await stableToken.balanceOf(addresses[4]);
    expect(balanceAfter.sub(balanceBefore)).to.be.equal(n6("50"));
  });

  it("should revert if no reward is pending", async function () {
    expect(lenderPool.connect(accounts[4]).claimRewards()).to.be.revertedWith(
      "No pending reward"
    );
  });

  it("should set APY to 100%", async function () {
    await stableReward.connect(accounts[1]).setReward(10000);
    expect(await stableReward.getReward()).to.be.equal(10000);
  });

  it("should deposit 1000 tokens from account 5 at t = 0 year", async function () {
    await stableToken
      .connect(accounts[5])
      .approve(lenderPool.address, n6("1000"));
    expect(n6("1000")).to.be.equal(
      await stableToken.allowance(addresses[5], lenderPool.address)
    );
    await lenderPool.connect(accounts[5]).deposit(n6("1000"));
    currentTime = await now();
    expect(await lenderPool.getDeposit(addresses[5])).to.be.equal(n6("1000"));
  });

  it("should check reward at t = 1 year total of 1000 tStable token", async function () {
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365);
    expect((await lenderPool.rewardOf(addresses[5]))[0]).to.be.equal(
      n6("1000")
    );
  });

  it("should approve 5000 stable to the Lender Pool", async () => {
    await stableToken
      .connect(accounts[6])
      .approve(lenderPool.address, n6("5000"));
    expect(n6("5000")).to.be.equal(
      await stableToken.allowance(addresses[6], lenderPool.address)
    );
  });

  it("should fail deposit if no valid KYC", async () => {
    await expect(
      lenderPool.connect(accounts[6]).deposit(n6("5000"))
    ).to.be.revertedWith("Need to have valid KYC");
  });

  it("should approve KYC for user3", async () => {
    await verification.setValidation(addresses[6], true);
    expect(await verification.isValid(addresses[6])).to.equal(true);
  });

  it("should deposit 5000 stable tokens successfully from account 6 at t = 0 year", async function () {
    await lenderPool.connect(accounts[6]).deposit(n6("5000"));
    currentTime = await now();
    expect(await lenderPool.getDeposit(addresses[6])).to.be.equal(n6("5000"));
  });

  it("should withdraw 1000 token from deposit at t = 1 year", async function () {
    const balanceBefore = await tStableToken.balanceOf(addresses[6]);
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365);
    await lenderPool.connect(accounts[6]).withdrawDeposit(n6("1000"));
    const balanceAfter = await tStableToken.balanceOf(addresses[6]);
    expect(balanceAfter.sub(balanceBefore)).to.be.equal(n6("1000"));
  });

  it("should set APY to 10%", async function () {
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365 * 2);
    await stableReward.connect(accounts[1]).setReward(1000);
    expect(await stableReward.getReward()).to.be.equal(1000);
  });

  it("should withdraw 1000 token from deposit at t = 3 year", async function () {
    const balanceBefore = await tStableToken.balanceOf(addresses[6]);
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365 * 3);
    await lenderPool.connect(accounts[6]).withdrawDeposit(n6("1000"));
    const balanceAfter = await tStableToken.balanceOf(addresses[6]);
    expect(balanceAfter.sub(balanceBefore)).to.be.equal(n6("1000"));
  });

  it("should set APY to 100%", async function () {
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365 * 4);
    await stableReward.connect(accounts[1]).setReward(10000);
    expect(await stableReward.getReward()).to.be.equal(10000);
  });

  it("should check reward at t = 4 year total of 9700 tStable token", async function () {
    expect(((await lenderPool.rewardOf(addresses[6]))[0]).sub(n6("9700")).toNumber()).to.be.lessThan(200);
  });

  it("should redeem all", async () => {
    const stableBefore = await stableToken.balanceOf(addresses[6]);
    const tradeBefore = await tradeToken.balanceOf(addresses[6]);
    await lenderPool.connect(accounts[6]).redeemAll();
    const stableAfter = await stableToken.balanceOf(addresses[6]);
    const tradeAfter = await tradeToken.balanceOf(addresses[6]);
    expect((stableAfter.sub(stableBefore)).sub(n6("12700")).toNumber()).to.be.lessThan(300);
    expect((tradeAfter.sub(tradeBefore)).sub(n6("9700")).toNumber()).to.be.lessThan(10);  });
});
