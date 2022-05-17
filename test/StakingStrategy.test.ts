import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  Strategy,
  Token,
  LenderPool,
  RedeemPool,
  Reward,
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
  let strategy: Strategy;
  let strategy2: Strategy;
  let stable: any;
  let aStable: any;
  let tStable: Token;
  let redeem: RedeemPool;
  let lenderPool: LenderPool;
  let trade: Token;
  let reward: Reward;
  before(async () => {
    accounts = await ethers.getSigners();
    addresses = accounts.map((account: SignerWithAddress) => account.address);
  });

  it("Should return the stable and aStable Token and deploy trade", async function () {
    stable = await ethers.getContractAt("IERC20", USDTAddress, accounts[0]);
    expect(await ethers.provider.getCode(stable.address)).to.be.length.above(
      100
    );
    aStable = await ethers.getContractAt("IERC20", aUSDTAddress, accounts[0]);
    const Token = await ethers.getContractFactory("Token");
    trade = await Token.deploy("Trade", "Trade", 6);
    await trade.deployed();
  });

  it("should deploy staking pool contract successfully", async function () {
    const Strategy = await ethers.getContractFactory("Strategy");
    strategy = await Strategy.deploy(
      stable.address,
      aStable.address
    );
    strategy2 = await Strategy.deploy(
      stable.address,
      aStable.address
    );
    await strategy.deployed();
    await strategy2.deployed();
    expect(
      await ethers.provider.getCode(strategy.address)
    ).to.be.length.above(10);
    expect(
      await ethers.provider.getCode(strategy2.address)
    ).to.be.length.above(10);
  });

  it("should deploy lender pool and TradeReward", async function () {
    const TStable = await ethers.getContractFactory("Token");
    tStable = await TStable.deploy("Tether derivative", "TUSDT", 6);
    await tStable.deployed();
    const Redeem = await ethers.getContractFactory("RedeemPool");
    redeem = await Redeem.deploy(stable.address, tStable.address);
    await redeem.deployed();
    const LenderPool = await ethers.getContractFactory("LenderPool");
    lenderPool = await LenderPool.deploy(
      stable.address,
      tStable.address,
      redeem.address
    );
    await lenderPool.deployed();

    const Reward = await ethers.getContractFactory("Reward");
    reward = await Reward.deploy();
  });

  it("should set LENDER_POOL and OWNER in TradeReward", async function () {
    await reward.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LENDER_POOL")),
      lenderPool.address
    );

    await reward.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("OWNER")),
      addresses[0]
    );

    expect(
      await reward.hasRole(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LENDER_POOL")),
        lenderPool.address
      )
    );

    expect(
      await reward.hasRole(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("OWNER")),
        addresses[0]
      )
    );
  });

  it("should set trade and tradeReward in LenderPool", async function () {
    await lenderPool.setTrade(trade.address);
    expect(await lenderPool.trade()).to.be.equal(trade.address);
    await lenderPool.setTradeReward(reward.address);
    expect(await lenderPool.tradeReward()).to.be.equal(reward.address);
  });

  it("should impersonate account", async function () {
    const hre = require("hardhat");
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [AccountToImpersonateUSDT],
    });
    accounts[0] = await ethers.getSigner(AccountToImpersonateUSDT);
    addresses[0] = accounts[0].address;
    await hre.network.provider.send("hardhat_setBalance", [
      addresses[0],
      "0x100000000000000000000000",
    ]);
  });

  it("should transfer to account 1", async function () {
    const balanceBefore = await stable.balanceOf(addresses[1]);
    await stable.connect(accounts[0]).transfer(addresses[1], n6("200"));
    const balanceAfter = await stable.balanceOf(addresses[1]);
    expect(balanceAfter.sub(balanceBefore)).to.be.equal(n6("200"));
  });

  it("should set staking pool", async function () {
    lenderPool.switchStrategy(strategy.address);
  });

  it("should deposit 100 stable tokens successfully from account 1", async function () {
    await lenderPool.updateKYCLimit(n6("500000000"));

    await stable.connect(accounts[1]).approve(lenderPool.address, n6("200"));
    expect(n6("200")).to.be.equal(
      await stable.allowance(addresses[1], lenderPool.address)
    );
    await lenderPool.connect(accounts[1]).deposit(n6("200"));
    expect(await lenderPool.getDeposit(addresses[1])).to.be.equal(n6("200"));
  });

  it("should deposit funds to staking pool through lender pool", async function () {
    const balanceBefore1 = await stable.balanceOf(lenderPool.address);
    await lenderPool.depositInStrategy(n6("100"));
    const balanceAfter1 = await stable.balanceOf(lenderPool.address);
    expect(balanceBefore1.sub(balanceAfter1)).to.be.equal(n6("100"));
  });

  it("should set LENDER_POOL role in redeem", async function () {
    await strategy.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LENDER_POOL")),
      lenderPool.address
    );
    await strategy2.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LENDER_POOL")),
      lenderPool.address
    );
    expect(
      await strategy.hasRole(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LENDER_POOL")),
        lenderPool.address
      )
    );
    expect(
      await strategy2.hasRole(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LENDER_POOL")),
        lenderPool.address
      )
    );
  });

  it("should check and withdraw from staking pool", async function () {
    await increaseTime(ONE_DAY * 365);
    console.log(await lenderPool.getStrategyBalance());
    const balanceBefore1 = await stable.balanceOf(lenderPool.address);
    await increaseTime(ONE_DAY * 365);
    await lenderPool.withdrawAllFromStrategy();
    const balanceAfter1 = await stable.balanceOf(lenderPool.address);
    console.log(balanceAfter1.sub(balanceBefore1));
  });

  it("should deposit funds to staking pool through lender pool", async function () {
    const balanceBefore1 = await stable.balanceOf(lenderPool.address);
    await lenderPool.depositInStrategy(n6("100"));
    const balanceAfter1 = await stable.balanceOf(lenderPool.address);
    expect(balanceBefore1.sub(balanceAfter1)).to.be.equal(n6("100"));
  });

  it("should update staking pool", async function () {
    await increaseTime(ONE_DAY * 365);
    const balanceOldStrategy = await strategy.getBalance();
    await lenderPool.switchStrategy(strategy2.address);
    const balanceNewStrategy = await strategy2.getBalance();
    expect(balanceOldStrategy.sub(balanceNewStrategy)).to.be.equal("0");
    expect(await strategy.getBalance()).to.be.equal("0");
  });

  it("should withdraw from staking pool (very close to 0)", async function () {
    const aStableBalance = await strategy2.getBalance();
    const stableBefore = await stable.balanceOf(lenderPool.address);
    await lenderPool.withdrawAllFromStrategy();
    const stableAfter = await stable.balanceOf(lenderPool.address);
    console.log(stableAfter.sub(stableBefore).sub(aStableBalance));
  });

  it("should deposit all stable to staking strategy (very close to 0)", async function () {
    const stableBefore = await stable.balanceOf(lenderPool.address);
    await lenderPool.depositAllInStrategy();
    const stableAfter = await stable.balanceOf(lenderPool.address);
    expect(stableAfter).to.be.equal("0");
    console.log(
      (await lenderPool.getStrategyBalance()).sub(stableBefore)
    );
  });

  it("should not be able to withdraw", async function () {
    expect(
      lenderPool.withdrawFromStrategy(n6("10000"))
    ).to.be.revertedWith("Balance less than requested.");
  });

  it("should withdraw from staking pool", async function () {
    const stableBefore = await stable.balanceOf(lenderPool.address);
    await lenderPool.withdrawFromStrategy(n6("10"));
    const stableAfter = await stable.balanceOf(lenderPool.address);
    expect(stableAfter.sub(stableBefore)).to.be.equal(n6("10"));
  });
});
