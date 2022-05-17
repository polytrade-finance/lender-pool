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

describe("Contract Deployment", function () {
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
  before(async () => {
    accounts = await ethers.getSigners();
    addresses = accounts.map((account: SignerWithAddress) => account.address);
  });
  it("should deploy trade, stable and tStable Token", async () => {
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
  });

  it("should deploy Redeem Pool", async () => {
    const RedeemPool = await ethers.getContractFactory("RedeemPool");
    redeemPool = await RedeemPool.deploy(
      stableToken.address,
      tStableToken.address
    );
    expect(
      await ethers.provider.getCode(redeemPool.address)
    ).to.be.length.above(10);
  });

  it("should deploy stable and trade Reward", async () => {
    const Reward = await ethers.getContractFactory("Reward");
    stableReward = await Reward.deploy(stableToken.address);
    tradeReward = await Reward.deploy(tradeToken.address);
    expect(
      await ethers.provider.getCode(stableReward.address)
    ).to.be.length.above(10);
    expect(
      await ethers.provider.getCode(tradeReward.address)
    ).to.be.length.above(10);
  });

  it("should deploy Reward Manager", async () => {
    const RewardManager = await ethers.getContractFactory("RewardManager");
    rewardManager = await RewardManager.deploy(
      stableReward.address,
      tradeReward.address
    );
    expect(
      await ethers.provider.getCode(rewardManager.address)
    ).to.be.length.above(10);
  });

  it("should deploy Lender Pool", async () => {
    const LenderPool = await ethers.getContractFactory("LenderPool");
    lenderPool = await LenderPool.deploy(
      stableToken.address,
      redeemPool.address
    );
    expect(
      await ethers.provider.getCode(lenderPool.address)
    ).to.be.length.above(10);
  });

  it("should deploy Verification", async () => {
    const Verification = await ethers.getContractFactory("Verification");
    verification = await Verification.deploy();
    expect(
      await ethers.provider.getCode(verification.address)
    ).to.be.length.above(10);
  });

  it("should deploy Strategy", async () => {
    aStable = await ethers.getContractAt("IERC20", aUSDTAddress, accounts[0]);
    const Strategy = await ethers.getContractFactory("Strategy");
    strategy = await Strategy.deploy(stableToken.address, aStable.address);
    await strategy.deployed();
    expect(await ethers.provider.getCode(strategy.address)).to.be.length.above(
      10
    );
  });

  it("should assign roles in stableReward and tradeReward", async () => {
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
  });

  it("should assign roles in RewardManager", async () => {
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
  });

  it("should assign roles in RewardManager", async () => {
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
  });

  it("should assign roles in Redeem Pool", async () => {
    await redeemPool.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("REWARD_MANAGER")),
      rewardManager.address
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
  });

  it("should assign roles in tStableToken", async function () {
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
});
