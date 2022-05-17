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

    await stableReward.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LENDER_POOL")),
      lenderPool.address
    );

    expect(
      await stableReward.hasRole(
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

  it("should transfer tokens (INITIAL SET UP)",async ()=>{
    await stableToken.connect(accounts[0]).transfer(addresses[1], n6("1000"));
    expect(await stableToken.balanceOf(addresses[1])).to.be.equal(n6("100"));

    await stableToken.connect(accounts[0]).transfer(addresses[2], n6("1000"));
    expect(await stableToken.balanceOf(addresses[2])).to.be.equal(n6("100"));

    await stableToken.connect(accounts[0]).transfer(addresses[3], n6("1000"));
    expect(await stableToken.balanceOf(addresses[3])).to.be.equal(n6("100"));

    await stableToken.connect(accounts[0]).transfer(addresses[4], n6("1000"));
    expect(await stableToken.balanceOf(addresses[4])).to.be.equal(n6("100"));

    await stableToken.connect(accounts[0]).transfer(addresses[5], n6("1000"));
    expect(await stableToken.balanceOf(addresses[5])).to.be.equal(n6("100"));
  });

  it("Should set verification contract to LenderPool", async () => {
    await lenderPool.updateVerificationContract(verification.address);
    expect(await lenderPool.verification()).to.be.equal(verification.address);
  });

  

});
