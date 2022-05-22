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
import { n6, increaseTime, ONE_DAY } from "./helpers";
import {
  USDTAddress,
  aUSDTAddress,
  AccountToImpersonateUSDT,
  // eslint-disable-next-line node/no-missing-import
} from "./constants/constants.helpers";

describe("Strategy", async function () {
  let accounts: SignerWithAddress[];
  let addresses: string[];
  let stableToken: any;
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
  let strategy2: Strategy;
  before(async () => {
    accounts = await ethers.getSigners();
    addresses = accounts.map((account: SignerWithAddress) => account.address);

    const Token = await ethers.getContractFactory("Token");
    stableToken = await ethers.getContractAt(
      "IERC20",
      USDTAddress,
      accounts[0]
    );
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
      tradeReward.address,
      ethers.constants.AddressZero
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
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("REWARD_MANAGER")),
        rewardManager.address
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

    await lenderPool.switchRewardManager(rewardManager.address);
    expect(await lenderPool.rewardManager()).to.be.equal(rewardManager.address);
  });

  it("should impersonate account", async function () {
    const hre = require("hardhat");
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [AccountToImpersonateUSDT],
    });
    accounts[2] = await ethers.getSigner(AccountToImpersonateUSDT);
    addresses[2] = accounts[2].address;
    await hre.network.provider.send("hardhat_setBalance", [
      addresses[2],
      "0x100000000000000000000000",
    ]);
  });

  it("should transfer tokens (INITIAL SET UP)", async () => {
    await stableToken.connect(accounts[2]).transfer(addresses[0], n6("5000"));
    expect(await stableToken.balanceOf(addresses[0])).to.be.equal(n6("5000"));

    await stableToken
      .connect(accounts[0])
      .transfer(stableReward.address, n6("1000"));
    expect(await stableToken.balanceOf(stableReward.address)).to.be.equal(
      n6("1000")
    );

    await tradeToken
      .connect(accounts[0])
      .transfer(tradeReward.address, n6("1000"));
    expect(await tradeToken.balanceOf(tradeReward.address)).to.be.equal(
      n6("1000")
    );

    await stableToken.connect(accounts[0]).transfer(addresses[3], n6("1000"));
    expect(await stableToken.balanceOf(addresses[3])).to.be.equal(n6("1000"));
  });

  it("should deploy second strategy contract successfully", async function () {
    const Strategy = await ethers.getContractFactory("Strategy");
    strategy2 = await Strategy.deploy(stableToken.address, aStable.address);
    await strategy2.deployed();
    expect(await ethers.provider.getCode(strategy2.address)).to.be.length.above(
      10
    );
    await strategy2.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LENDER_POOL")),
      lenderPool.address
    );

    expect(
      await strategy2.hasRole(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LENDER_POOL")),
        lenderPool.address
      )
    );
  });

  it("should set staking pool", async function () {
    lenderPool.switchStrategy(strategy.address);
  });

  it("should deposit 200 stable tokens to LenderPool from account 3", async function () {
    await verification.updateValidationLimit(n6("500000000"));

    await stableToken
      .connect(accounts[3])
      .approve(lenderPool.address, n6("200"));
    expect(n6("200")).to.be.equal(
      await stableToken.allowance(addresses[3], lenderPool.address)
    );
    await lenderPool.connect(accounts[3]).deposit(n6("200"));
    expect(await lenderPool.getDeposit(addresses[3])).to.be.equal(n6("200"));
  });

  it("should check staking pool balance", async function () {
    await increaseTime(ONE_DAY * 365);
    expect((await lenderPool.getStrategyBalance()).sub(n6("200")).toNumber()).to.be.greaterThan(100);
  });

  it("should update staking pool", async function () {
    await increaseTime(ONE_DAY * 365);
    const balanceOldStrategy = await strategy.getBalance();
    await lenderPool.switchStrategy(strategy2.address);
    const balanceNewStrategy = await strategy2.getBalance();
    expect(
      balanceOldStrategy.sub(balanceNewStrategy).toNumber()
    ).to.be.lessThan(2);
    expect(await strategy.getBalance()).to.be.equal("0");
  });
});
