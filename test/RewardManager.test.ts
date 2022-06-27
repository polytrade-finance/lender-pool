import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  LenderPool,
  RedeemPool,
  Reward,
  RewardManager,
  Strategy,
  Token,
  Verification,
} from "../typechain";

import {
  AccountToImpersonateUSDT,
  aUSDTAddress,
  USDTAddress,
} from "./constants/constants.helpers";

import { n6, now, ONE_DAY, setNextBlockTimestamp } from "./helpers";
import { constants } from "ethers";

describe("Lender Pool - Switch Reward Manager", function () {
  let accounts: SignerWithAddress[];
  let addresses: string[];
  let stableToken1: any;
  let tStableToken: Token;
  let tradeToken1: Token;
  let tradeToken2: Token;
  let aStable: any;
  let redeemPool: RedeemPool;
  let stableReward1: Reward;
  let stableReward2: Reward;
  let stableReward3: Reward;
  let tradeReward1: Reward;
  let tradeReward2: Reward;
  let tradeReward3: Reward;
  let rewardManager1: RewardManager;
  let rewardManager2: RewardManager;
  let rewardManager3: RewardManager;
  let verification: Verification;
  let lenderPool: LenderPool;
  let strategy: Strategy;
  let currentTime: number = 0;
  before(async () => {
    accounts = await ethers.getSigners();
    addresses = accounts.map((account: SignerWithAddress) => account.address);

    const Token = await ethers.getContractFactory("Token");
    stableToken1 = await ethers.getContractAt(
      "IERC20",
      USDTAddress,
      accounts[0]
    );
    tStableToken = await Token.deploy("Tether derivative", "TUSDT", 6);
    tradeToken1 = await Token.deploy("PolyTrade", "poly", 6);
    expect(
      await ethers.provider.getCode(stableToken1.address)
    ).to.be.length.above(10);
    expect(
      await ethers.provider.getCode(tStableToken.address)
    ).to.be.length.above(10);
    expect(
      await ethers.provider.getCode(tradeToken1.address)
    ).to.be.length.above(10);

    const RedeemPool = await ethers.getContractFactory("RedeemPool");
    redeemPool = await RedeemPool.deploy(
      stableToken1.address,
      tStableToken.address
    );
    expect(
      await ethers.provider.getCode(redeemPool.address)
    ).to.be.length.above(10);

    const Reward = await ethers.getContractFactory("Reward");
    stableReward1 = await Reward.deploy(stableToken1.address);
    tradeReward1 = await Reward.deploy(tradeToken1.address);
    expect(
      await ethers.provider.getCode(stableReward1.address)
    ).to.be.length.above(10);
    expect(
      await ethers.provider.getCode(tradeReward1.address)
    ).to.be.length.above(10);

    const RewardManager = await ethers.getContractFactory("RewardManager");
    rewardManager1 = await RewardManager.deploy(
      stableReward1.address,
      tradeReward1.address,
      ethers.constants.AddressZero
    );
    expect(
      await ethers.provider.getCode(rewardManager1.address)
    ).to.be.length.above(10);

    const LenderPool = await ethers.getContractFactory("LenderPool");
    lenderPool = await LenderPool.deploy(
      stableToken1.address,
      tStableToken.address,
      redeemPool.address,
      constants.AddressZero
    );
    expect(
      await ethers.provider.getCode(lenderPool.address)
    ).to.be.length.above(10);

    const Verification = await ethers.getContractFactory("Verification");
    verification = await Verification.deploy(lenderPool.address);
    expect(
      await ethers.provider.getCode(verification.address)
    ).to.be.length.above(10);

    aStable = await ethers.getContractAt("IERC20", aUSDTAddress, accounts[0]);
    const Strategy = await ethers.getContractFactory("Strategy");
    strategy = await Strategy.deploy(
      "0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf",
      stableToken1.address,
      aStable.address
    );
    await strategy.deployed();
    expect(await ethers.provider.getCode(strategy.address)).to.be.length.above(
      10
    );

    await stableReward1.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("REWARD_MANAGER")),
      rewardManager1.address
    );

    await stableReward1.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("OWNER")),
      addresses[1]
    );

    await tradeReward1.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("REWARD_MANAGER")),
      rewardManager1.address
    );

    await tradeReward1.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("OWNER")),
      addresses[1]
    );

    expect(
      await stableReward1.hasRole(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("REWARD_MANAGER")),
        rewardManager1.address
      )
    );

    expect(
      await stableReward1.hasRole(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("OWNER")),
        addresses[1]
      )
    );

    expect(
      await tradeReward1.hasRole(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("REWARD_MANAGER")),
        rewardManager1.address
      )
    );

    expect(
      await tradeReward1.hasRole(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("OWNER")),
        addresses[1]
      )
    );

    await rewardManager1.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LENDER_POOL")),
      lenderPool.address
    );

    expect(
      await rewardManager1.hasRole(
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
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("REWARD_MANAGER")),
        rewardManager1.address
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

    await lenderPool.switchVerification(verification.address);
    expect(await lenderPool.verification()).to.be.equal(verification.address);

    await lenderPool.switchRewardManager(rewardManager1.address);
    expect(await lenderPool.rewardManager()).to.be.equal(
      rewardManager1.address
    );

    await verification.updateValidationLimit(n6("5000"));

    lenderPool.switchStrategy(strategy.address);
  });

  it("should impersonate account", async function () {
    const hre = require("hardhat");
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [AccountToImpersonateUSDT],
    });
    accounts[9] = await ethers.getSigner(AccountToImpersonateUSDT);
    addresses[9] = accounts[9].address;
    await hre.network.provider.send("hardhat_setBalance", [
      addresses[9],
      "0x100000000000000000000000",
    ]);
  });

  it("should transfer tokens (INITIAL SET UP)", async () => {
    await stableToken1
      .connect(accounts[9])
      .transfer(addresses[0], n6("1000000"));

    await stableToken1
      .connect(accounts[0])
      .transfer(stableReward1.address, n6("10000"));

    await tradeToken1
      .connect(accounts[0])
      .transfer(tradeReward1.address, n6("10000"));

    await stableToken1.connect(accounts[0]).transfer(addresses[1], n6("1000"));

    await stableToken1.connect(accounts[0]).transfer(addresses[2], n6("1000"));

    await stableToken1.connect(accounts[0]).transfer(addresses[3], n6("1000"));

    await stableToken1.connect(accounts[0]).transfer(addresses[4], n6("1000"));

    await stableToken1.connect(accounts[0]).transfer(addresses[5], n6("1000"));

    await stableToken1.connect(accounts[0]).transfer(addresses[6], n6("5000"));

    await stableToken1.connect(accounts[0]).transfer(addresses[7], n6("1000"));
  });

  it("should register in reward manager 1", async () => {
    await lenderPool.connect(accounts[2]).registerUser();
    await lenderPool.connect(accounts[3]).registerUser();
    await lenderPool.connect(accounts[4]).registerUser();
    await lenderPool.connect(accounts[5]).registerUser();
    await lenderPool.connect(accounts[6]).registerUser();
    await lenderPool.connect(accounts[7]).registerUser();
  });

  it("should set stable apy to 25% and trade apy to 5", async function () {
    await tradeReward1.connect(accounts[1]).setReward(500);
    await stableReward1.connect(accounts[1]).setReward(2500);
    expect(await tradeReward1.getReward()).to.be.equal(500);
    expect(await stableReward1.getReward()).to.be.equal(2500);
  });

  it("should approve 100 stable token from account 2, 3, 6, 7", async function () {
    await stableToken1
      .connect(accounts[2])
      .approve(lenderPool.address, n6("100"));
    expect(
      await stableToken1.allowance(addresses[2], lenderPool.address)
    ).to.be.equal(ethers.BigNumber.from(n6("100")));

    await stableToken1
      .connect(accounts[3])
      .approve(lenderPool.address, n6("100"));
    expect(
      await stableToken1.allowance(addresses[3], lenderPool.address)
    ).to.be.equal(ethers.BigNumber.from(n6("100")));

    await stableToken1
      .connect(accounts[6])
      .approve(lenderPool.address, n6("1000"));
    expect(
      await stableToken1.allowance(addresses[6], lenderPool.address)
    ).to.be.equal(ethers.BigNumber.from(n6("1000")));

    await stableToken1
      .connect(accounts[7])
      .approve(lenderPool.address, n6("1000"));
    expect(
      await stableToken1.allowance(addresses[7], lenderPool.address)
    ).to.be.equal(ethers.BigNumber.from(n6("1000")));
  });

  it("should deposit 100 stable token from account 2 at t = 0", async function () {
    currentTime = await now();
    await lenderPool.connect(accounts[2]).deposit(n6("100"));
    await lenderPool.getDeposit(addresses[2]).then((result) => {
      expect(result).to.be.equal(ethers.BigNumber.from(n6("100")));
    });
  });

  it("should deposit 100 stable token from account 3 at t = 0", async function () {
    await lenderPool.connect(accounts[3]).deposit(n6("100"));
    await lenderPool.getDeposit(addresses[3]).then((result) => {
      expect(result).to.be.equal(ethers.BigNumber.from(n6("100")));
    });
  });

  it("should deposit 100 stable token from account 6 at t = 0", async function () {
    await lenderPool.connect(accounts[6]).deposit(n6("100"));
    await lenderPool.getDeposit(addresses[6]).then((result) => {
      expect(result).to.be.equal(ethers.BigNumber.from(n6("100")));
    });
  });

  it("should check reward at t = 1 year for account 2", async () => {
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365);
    expect(
      (await lenderPool.rewardOf(addresses[2], stableToken1.address))
        .sub(n6("25"))
        .toNumber()
    ).to.be.lessThan(20);
    expect(
      (await lenderPool.rewardOf(addresses[2], tradeToken1.address))
        .sub(n6("5"))
        .toNumber()
    ).to.be.lessThan(20);
  });

  it("should check reward at t = 1 year for account 3", async () => {
    expect(
      (await lenderPool.rewardOf(addresses[3], stableToken1.address))
        .sub(n6("25"))
        .toNumber()
    ).to.be.lessThan(20);
    expect(
      (await lenderPool.rewardOf(addresses[3], tradeToken1.address))
        .sub(n6("5"))
        .toNumber()
    ).to.be.lessThan(20);
  });

  it("should check reward at t = 1 year for account 6", async () => {
    expect(
      (await lenderPool.rewardOf(addresses[6], stableToken1.address))
        .sub(n6("25"))
        .toNumber()
    ).to.be.lessThan(20);
    expect(
      (await lenderPool.rewardOf(addresses[6], tradeToken1.address))
        .sub(n6("5"))
        .toNumber()
    ).to.be.lessThan(20);
  });

  it("should withdraw 50 token from account 6 at t = 1 year", async () => {
    const stable1Before = await tStableToken.balanceOf(addresses[6]);
    await lenderPool.connect(accounts[6]).withdrawDeposit(n6("50"));
    const stable1After = await tStableToken.balanceOf(addresses[6]);
    expect(stable1After.sub(stable1Before)).to.be.equal(n6("50"));
  });

  it("SETUP FOR REWARD MANAGER 2", async () => {
    const Token = await ethers.getContractFactory("Token");
    tradeToken2 = await Token.deploy("Tether", "USDT", 6);
    expect(
      await ethers.provider.getCode(tradeToken2.address)
    ).to.be.length.above(10);

    const Reward = await ethers.getContractFactory("Reward");
    stableReward2 = await Reward.deploy(stableToken1.address);
    tradeReward2 = await Reward.deploy(tradeToken2.address);
    expect(
      await ethers.provider.getCode(stableReward2.address)
    ).to.be.length.above(10);
    expect(
      await ethers.provider.getCode(tradeReward2.address)
    ).to.be.length.above(10);

    await stableToken1
      .connect(accounts[0])
      .transfer(stableReward2.address, n6("10000"));
    expect(await stableToken1.balanceOf(stableReward2.address)).to.be.equal(
      n6("10000")
    );

    await tradeToken2
      .connect(accounts[0])
      .transfer(tradeReward2.address, n6("10000"));
    expect(await tradeToken2.balanceOf(tradeReward2.address)).to.be.equal(
      n6("10000")
    );

    const RewardManager = await ethers.getContractFactory("RewardManager");
    rewardManager2 = await RewardManager.deploy(
      stableReward2.address,
      tradeReward2.address,
      rewardManager1.address
    );
    expect(
      await ethers.provider.getCode(rewardManager2.address)
    ).to.be.length.above(10);

    await stableReward2.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("REWARD_MANAGER")),
      rewardManager2.address
    );

    await stableReward2.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("OWNER")),
      addresses[1]
    );

    await tradeReward2.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("REWARD_MANAGER")),
      rewardManager2.address
    );

    await tradeReward2.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("OWNER")),
      addresses[1]
    );

    expect(
      await stableReward2.hasRole(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("REWARD_MANAGER")),
        rewardManager2.address
      )
    );

    expect(
      await stableReward2.hasRole(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("OWNER")),
        addresses[1]
      )
    );

    expect(
      await tradeReward2.hasRole(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("REWARD_MANAGER")),
        rewardManager2.address
      )
    );

    expect(
      await tradeReward2.hasRole(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("OWNER")),
        addresses[1]
      )
    );

    await rewardManager2.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LENDER_POOL")),
      lenderPool.address
    );

    expect(
      await rewardManager2.hasRole(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LENDER_POOL")),
        lenderPool.address
      )
    );
  });

  it("should set stable apy to 20% and trade apy to 10", async function () {
    await tradeReward2.connect(accounts[1]).setReward(1000);
    await stableReward2.connect(accounts[1]).setReward(2000);
    expect(await tradeReward2.getReward()).to.be.equal(1000);
    expect(await stableReward2.getReward()).to.be.equal(2000);
  });

  it("should check reward for account 6 at t = 2 year", async () => {
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365 * 2);
    const reward = await lenderPool.rewardOf(
      addresses[6],
      stableToken1.address
    );
    expect(reward.sub(n6("37.5")).toNumber()).to.be.lessThan(100);
  });

  it("should switch to reward manager 2 at t = 2 year", async () => {
    await lenderPool.switchRewardManager(rewardManager2.address);
    expect(await lenderPool.rewardManager()).to.be.equal(
      rewardManager2.address
    );
  });

  it("should register in reward manager 2", async () => {
    await lenderPool.connect(accounts[2]).registerUser();
    await lenderPool.connect(accounts[3]).registerUser();
    await lenderPool.connect(accounts[4]).registerUser();
    await lenderPool.connect(accounts[5]).registerUser();
    await lenderPool.connect(accounts[6]).registerUser();
    await lenderPool.connect(accounts[7]).registerUser();
  });

  it("should approve 100 stable token from account 4", async function () {
    await stableToken1
      .connect(accounts[4])
      .approve(lenderPool.address, n6("100"));
    expect(
      await stableToken1.allowance(addresses[4], lenderPool.address)
    ).to.be.equal(ethers.BigNumber.from(n6("100")));
  });

  it("should deposit 100 stable token from account 4 at t = 2.5 year", async function () {
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365 * 2.5);
    await lenderPool.connect(accounts[4]).deposit(n6("100"));
    expect(await lenderPool.getDeposit(addresses[4])).to.be.equal(
      ethers.BigNumber.from(n6("100"))
    );
  });

  it("should check reward from reward manager 2 at t = 3 year of account 2", async () => {
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365 * 3);
    expect(
      (await lenderPool.rewardOf(addresses[2], tradeToken2.address))
        .sub(n6("10"))
        .toNumber()
    ).to.be.lessThan(5);
  });

  it("should check reward at t = 3 year for account 6", async () => {
    expect(
      (await lenderPool.rewardOf(addresses[6], tradeToken1.address))
        .sub(n6("47.5"))
        .toNumber()
    ).to.be.lessThan(20);
  });

  it("should withdraw 50 token from account 6 at y = 3 year", async () => {
    const stable1Before = await tStableToken.balanceOf(addresses[6]);
    await lenderPool.connect(accounts[6]).withdrawDeposit(n6("50"));
    const stable1After = await tStableToken.balanceOf(addresses[6]);
    expect(stable1After.sub(stable1Before)).to.be.equal(n6("50"));
  });

  it("should check reward at t = 4 year", async () => {
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365 * 4);
    expect(
      (await lenderPool.rewardOf(addresses[6], tradeToken1.address))
        .sub(n6("57.5"))
        .toNumber()
    ).to.be.lessThan(20);
  });

  it("should deposit 100 token from account 6 at y = 4 year", async () => {
    await lenderPool.connect(accounts[6]).deposit(n6("100"));
  });

  it("should check reward at t = 5 year", async () => {
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365 * 5);
    expect(
      (await lenderPool.rewardOf(addresses[6], tradeToken1.address))
        .sub(n6("87.5"))
        .toNumber()
    ).to.be.lessThan(20);
  });

  it("should deposit 100 token from account 6 at y = 5 year", async () => {
    await lenderPool.connect(accounts[6]).deposit(n6("100"));
  });

  it("SETUP FOR REWARD MANAGER 3", async () => {
    const Reward = await ethers.getContractFactory("Reward");
    stableReward3 = await Reward.deploy(stableToken1.address);
    tradeReward3 = await Reward.deploy(tradeToken1.address);
    expect(
      await ethers.provider.getCode(stableReward3.address)
    ).to.be.length.above(10);
    expect(
      await ethers.provider.getCode(tradeReward3.address)
    ).to.be.length.above(10);

    await stableToken1
      .connect(accounts[0])
      .transfer(stableReward3.address, n6("10000"));
    expect(await stableToken1.balanceOf(stableReward3.address)).to.be.equal(
      n6("10000")
    );

    await tradeToken1
      .connect(accounts[0])
      .transfer(tradeReward3.address, n6("10000"));
    expect(await tradeToken1.balanceOf(tradeReward3.address)).to.be.equal(
      n6("10000")
    );

    const RewardManager = await ethers.getContractFactory("RewardManager");
    rewardManager3 = await RewardManager.deploy(
      stableReward3.address,
      tradeReward3.address,
      rewardManager2.address
    );
    expect(
      await ethers.provider.getCode(rewardManager3.address)
    ).to.be.length.above(10);

    await stableReward3.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("REWARD_MANAGER")),
      rewardManager3.address
    );

    await stableReward3.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("OWNER")),
      addresses[1]
    );

    await tradeReward3.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("REWARD_MANAGER")),
      rewardManager3.address
    );

    await tradeReward3.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("OWNER")),
      addresses[1]
    );

    expect(
      await stableReward3.hasRole(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("REWARD_MANAGER")),
        rewardManager3.address
      )
    );

    expect(
      await stableReward3.hasRole(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("OWNER")),
        addresses[1]
      )
    );

    expect(
      await tradeReward3.hasRole(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("REWARD_MANAGER")),
        rewardManager3.address
      )
    );

    expect(
      await tradeReward3.hasRole(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("OWNER")),
        addresses[1]
      )
    );

    await rewardManager3.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LENDER_POOL")),
      lenderPool.address
    );

    expect(
      await rewardManager3.hasRole(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LENDER_POOL")),
        lenderPool.address
      )
    );
  });

  it("should set stable apy to 200% and trade apy to 100", async function () {
    await tradeReward3.connect(accounts[1]).setReward(10000);
    await stableReward3.connect(accounts[1]).setReward(20000);
    expect(await tradeReward3.getReward()).to.be.equal(10000);
    expect(await stableReward3.getReward()).to.be.equal(20000);
  });

  it("should check reward at t = 6 year", async () => {
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365 * 6);
    expect(
      (await lenderPool.rewardOf(addresses[6], tradeToken1.address))
        .sub(n6("157.5"))
        .toNumber()
    ).to.be.lessThan(20);
  });

  it("should switch reward manager 3 at t = 6 year", async () => {
    await lenderPool.switchRewardManager(rewardManager3.address);
    expect(await lenderPool.rewardManager()).to.be.equal(
      rewardManager3.address
    );
  });

  it("should not able to claim reward", async () => {
    expect(
      lenderPool.connect(accounts[6]).claimAllRewards()
    ).to.be.revertedWith("Please Register to RewardManager");
  });

  it("should register in reward manager 2", async () => {
    await lenderPool.connect(accounts[2]).registerUser();
    await lenderPool.connect(accounts[3]).registerUser();
    await lenderPool.connect(accounts[4]).registerUser();
    await lenderPool.connect(accounts[5]).registerUser();
    await lenderPool.connect(accounts[6]).registerUser();
    await lenderPool.connect(accounts[7]).registerUser();
  });

  it("should claim reward of account 4 at t = 7 year", async () => {
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365 * 7);
    const stable1Before = await stableToken1.balanceOf(addresses[4]);
    const trade1Before = await tradeToken1.balanceOf(addresses[4]);
    const trade2Before = await tradeToken2.balanceOf(addresses[4]);
    await lenderPool.connect(accounts[4]).claimAllRewards();
    const stable1After = await stableToken1.balanceOf(addresses[4]);
    const trade1After = await tradeToken1.balanceOf(addresses[4]);
    const trade2After = await tradeToken2.balanceOf(addresses[4]);
    expect(
      Math.abs(stable1After.sub(stable1Before).sub(n6("270")).toNumber())
    ).to.be.lessThan(25);
    expect(
      Math.abs(trade1After.sub(trade1Before).sub(n6("100")).toNumber())
    ).to.be.lessThan(25);
    expect(
      Math.abs(trade2After.sub(trade2Before).sub(n6("35")).toNumber())
    ).to.be.equal(0);
  });

  it("should claim reward of account 3 at t = 7 year", async () => {
    const stable1Before = await stableToken1.balanceOf(addresses[3]);
    const trade1Before = await tradeToken1.balanceOf(addresses[3]);
    const trade2Before = await tradeToken2.balanceOf(addresses[3]);
    await lenderPool.connect(accounts[3]).claimAllRewards();
    const stable1After = await stableToken1.balanceOf(addresses[3]);
    const trade1After = await tradeToken1.balanceOf(addresses[3]);
    const trade2After = await tradeToken2.balanceOf(addresses[3]);
    expect(
      Math.abs(stable1After.sub(stable1Before).sub(n6("330")).toNumber())
    ).to.be.lessThan(200);
    expect(
      Math.abs(trade1After.sub(trade1Before).sub(n6("110")).toNumber())
    ).to.be.lessThan(200);
    expect(
      Math.abs(trade2After.sub(trade2Before).sub(n6("40")).toNumber())
    ).to.be.equal(0);
  });

  it("should claim reward of account 6 at t = 7 year", async () => {
    const stable1Before = await stableToken1.balanceOf(addresses[6]);
    await lenderPool.connect(accounts[6]).claimReward(stableToken1.address);
    const stable1After = await stableToken1.balanceOf(addresses[6]);
    expect(
      Math.abs(stable1After.sub(stable1Before).sub(n6("507.5")).toNumber())
    ).to.be.lessThan(200);
  });

  it("should register in reward manager 3", async () => {
    await lenderPool.connect(accounts[7]).registerUser();
    await lenderPool.connect(accounts[7]).registerUser();
  });

  it("should deposit 1000 stable from account 7 at t = 7 year", async () => {
    await lenderPool.connect(accounts[7]).deposit(n6("1000"));
    await lenderPool.getDeposit(addresses[7]).then((result) => {
      expect(result).to.be.equal(ethers.BigNumber.from(n6("1000")));
    });
  });
});
