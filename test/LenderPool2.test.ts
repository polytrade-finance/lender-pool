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

import {
  aUSDTAddress,
  USDTAddress,
  AccountToImpersonateUSDT,
} from "./constants/constants.helpers";

import { n6, ONE_DAY, now, setNextBlockTimestamp } from "./helpers";
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
    strategy = await Strategy.deploy(stableToken1.address, aStable.address);
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
      .transfer(addresses[0], n6("10000000"));
    expect(await stableToken1.balanceOf(addresses[0])).to.be.equal(
      n6("10000000")
    );

    await stableToken1
      .connect(accounts[0])
      .transfer(stableReward1.address, n6("10000"));
    expect(await stableToken1.balanceOf(stableReward1.address)).to.be.equal(
      n6("10000")
    );

    await tradeToken1
      .connect(accounts[0])
      .transfer(tradeReward1.address, n6("10000"));
    expect(await tradeToken1.balanceOf(tradeReward1.address)).to.be.equal(
      n6("10000")
    );

    await stableToken1.connect(accounts[0]).transfer(addresses[1], n6("1000"));
    expect(await stableToken1.balanceOf(addresses[1])).to.be.equal(n6("1000"));

    await stableToken1.connect(accounts[0]).transfer(addresses[2], n6("1000"));
    expect(await stableToken1.balanceOf(addresses[2])).to.be.equal(n6("1000"));

    await stableToken1.connect(accounts[0]).transfer(addresses[3], n6("1000"));
    expect(await stableToken1.balanceOf(addresses[3])).to.be.equal(n6("1000"));

    await stableToken1.connect(accounts[0]).transfer(addresses[4], n6("1000"));
    expect(await stableToken1.balanceOf(addresses[4])).to.be.equal(n6("1000"));

    await stableToken1.connect(accounts[0]).transfer(addresses[5], n6("1000"));
    expect(await stableToken1.balanceOf(addresses[5])).to.be.equal(n6("1000"));

    await stableToken1.connect(accounts[0]).transfer(addresses[6], n6("5000"));
    expect(await stableToken1.balanceOf(addresses[6])).to.be.equal(n6("5000"));
  });

  it("should set stable apy to 25% and trade apy to 5", async function () {
    await tradeReward1.connect(accounts[1]).setReward(500);
    await stableReward1.connect(accounts[1]).setReward(2500);
    expect(await tradeReward1.getReward()).to.be.equal(500);
    expect(await stableReward1.getReward()).to.be.equal(2500);
  });

  it("should approve 100 stable token from account 2, 3", async function () {
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
  });

  it("should deposit 100 stable token from account 2, 3 at t = 0", async function () {
    currentTime = await now();
    await lenderPool.connect(accounts[2]).deposit(n6("100"));
    await lenderPool.connect(accounts[3]).deposit(n6("100"));

    await lenderPool.getDeposit(addresses[2]).then((result) => {
      expect(result).to.be.equal(ethers.BigNumber.from(n6("100")));
    });

    await lenderPool.getDeposit(addresses[3]).then((result) => {
      expect(result).to.be.equal(ethers.BigNumber.from(n6("100")));
    });
  });

  it("should check reward at t = 1 year", async () => {
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365);
    const reward = await lenderPool.callStatic.rewardOf(addresses[2]);
    expect(reward[0].sub(n6("25")).toNumber()).to.be.lessThan(20);
    expect(reward[1].sub(n6("5")).toNumber()).to.be.lessThan(20);
  });

  it("should deploy second trade token", async () => {
    const Token = await ethers.getContractFactory("Token");
    tradeToken2 = await Token.deploy("Tether", "USDT", 6);
    expect(
      await ethers.provider.getCode(tradeToken2.address)
    ).to.be.length.above(10);
  });

  it("should deploy stable and trade reward manager", async () => {
    const Reward = await ethers.getContractFactory("Reward");
    stableReward2 = await Reward.deploy(stableToken1.address);
    tradeReward2 = await Reward.deploy(tradeToken2.address);
    expect(
      await ethers.provider.getCode(stableReward2.address)
    ).to.be.length.above(10);
    expect(
      await ethers.provider.getCode(tradeReward2.address)
    ).to.be.length.above(10);
  });

  it("should transfer ERC20 to stableReward2 and tradeReward2", async () => {
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
  });

  it("should deploy second reward manager", async () => {
    const RewardManager = await ethers.getContractFactory("RewardManager");
    rewardManager2 = await RewardManager.deploy(
      stableReward2.address,
      tradeReward2.address,
      rewardManager1.address
    );
    expect(
      await ethers.provider.getCode(rewardManager2.address)
    ).to.be.length.above(10);
  });

  it("should set roles", async function () {
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

  it("should switch to reward manager 2 at t = 2 year", async () => {
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365 * 2);
    await lenderPool.switchRewardManager(rewardManager2.address);
    expect(await lenderPool.rewardManager()).to.be.equal(
      rewardManager2.address
    );
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

  it("should check reward from reward manager 2 at t = 3 year", async () => {
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365 * 3);
    const reward = await lenderPool.callStatic.rewardOf(addresses[2]);
    expect(reward[0].sub(n6("20")).toNumber()).to.be.lessThan(5);
    expect(reward[1].sub(n6("10")).toNumber()).to.be.lessThan(5);
  });

  it("should check stable reward from reward manager 1 at t = 4 year", async () => {
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365 * 4);
    const reward = await rewardManager1.rewardOf(addresses[2]);
    expect(Math.abs(reward[0].sub(n6("50")).toNumber())).to.be.lessThan(100);
  });

  it("should claim reward account 2 at t = 5 year", async () => {
    const stable1Before = await stableToken1.balanceOf(addresses[2]);
    const trade1Before = await tradeToken1.balanceOf(addresses[2]);
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365 * 5);
    await rewardManager1.connect(accounts[2]).claimRewards();
    const stable1After = await stableToken1.balanceOf(addresses[2]);
    const trade1After = await tradeToken1.balanceOf(addresses[2]);
    expect(
      Math.abs(trade1After.sub(trade1Before).sub(n6("10")).toNumber())
    ).to.be.lessThan(100);
    expect(
      Math.abs(stable1After.sub(stable1Before).sub(n6("50")).toNumber())
    ).to.be.lessThan(100);
  });

  it("should deploy stable and trade reward manager", async () => {
    const Reward = await ethers.getContractFactory("Reward");
    stableReward3 = await Reward.deploy(stableToken1.address);
    tradeReward3 = await Reward.deploy(tradeToken1.address);
    expect(
      await ethers.provider.getCode(stableReward3.address)
    ).to.be.length.above(10);
    expect(
      await ethers.provider.getCode(tradeReward3.address)
    ).to.be.length.above(10);
  });

  it("should transfer ERC20 to stableReward3 and tradeReward3", async () => {
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
  });

  it("should deploy third reward manager", async () => {
    const RewardManager = await ethers.getContractFactory("RewardManager");
    rewardManager3 = await RewardManager.deploy(
      stableReward3.address,
      tradeReward3.address,
      rewardManager2.address
    );
    expect(
      await ethers.provider.getCode(rewardManager3.address)
    ).to.be.length.above(10);
  });

  it("should set roles", async function () {
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

  it("should switch reward manager 3 at t = 6 year", async () => {
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365 * 6);
    await lenderPool.switchRewardManager(rewardManager3.address);
    expect(await lenderPool.rewardManager()).to.be.equal(
      rewardManager3.address
    );
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365 * 7);
  });

  it("should check reward of account 4 on manager 1 at t = 7 year", async () => {
    const stable1Before = await stableToken1.balanceOf(addresses[4]);
    const trade1Before = await tradeToken1.balanceOf(addresses[4]);
    await lenderPool
      .connect(accounts[4])
      .claimPreviousRewards(rewardManager1.address);
    const stable1After = await stableToken1.balanceOf(addresses[4]);
    const trade1After = await tradeToken1.balanceOf(addresses[4]);
    expect(stable1After.sub(stable1Before).toNumber()).to.be.equal(0);
    expect(trade1After.sub(trade1Before).toNumber()).to.be.equal(0);
  });

  it("should check reward of account 4 on manager 2 at t = 7 year", async () => {
    const stable1Before = await stableToken1.balanceOf(addresses[4]);
    const trade1Before = await tradeToken2.balanceOf(addresses[4]);
    await lenderPool
      .connect(accounts[4])
      .claimPreviousRewards(rewardManager2.address);
    const stable1After = await stableToken1.balanceOf(addresses[4]);
    const trade1After = await tradeToken2.balanceOf(addresses[4]);
    expect(
      Math.abs(stable1After.sub(stable1Before).sub(n6("70")).toNumber())
    ).to.be.equal(0);
    expect(
      Math.abs(trade1After.sub(trade1Before).sub(n6("35")).toNumber())
    ).to.be.equal(0);
  });

  it("should check reward of account 4 on manager 3 at t = 7 year", async () => {
    const stable1Before = await stableToken1.balanceOf(addresses[4]);
    const trade1Before = await tradeToken1.balanceOf(addresses[4]);
    await lenderPool
      .connect(accounts[4])
      .claimPreviousRewards(rewardManager3.address);
    const stable1After = await stableToken1.balanceOf(addresses[4]);
    const trade1After = await tradeToken1.balanceOf(addresses[4]);
    expect(
      Math.abs(stable1After.sub(stable1Before).sub(n6("200")).toNumber())
    ).to.be.lessThan(25);
    expect(
      Math.abs(trade1After.sub(trade1Before).sub(n6("100")).toNumber())
    ).to.be.lessThan(25);
  });
});
