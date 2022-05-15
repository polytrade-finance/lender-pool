import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Token, LenderPool, Verification, Reward } from "../typechain";
import { n6, ONE_DAY, now, setNextBlockTimestamp } from "./helpers";

describe("LenderPool", function () {
  let accounts: SignerWithAddress[];
  let addresses: string[];
  let lenderPool: LenderPool;
  let stable: Token;
  let tStable: Token;
  let trade: Token;
  let verification: Verification;
  let reward: Reward;
  let currentTime: number = 0;
  before(async () => {
    accounts = await ethers.getSigners();
    addresses = accounts.map((account: SignerWithAddress) => account.address);
    const Token = await ethers.getContractFactory("Token");
    stable = await Token.deploy("Tether", "USDT", 6);
    await stable.deployed();
    const TStable = await ethers.getContractFactory("Token");
    tStable = await TStable.deploy("Tether derivative", "TUSDT", 6);
    trade = await Token.deploy("Trade", "Trade", 6);
    await trade.deployed();
    const LenderPool = await ethers.getContractFactory("LenderPool");
    lenderPool = await LenderPool.deploy(
      stable.address,
      tStable.address,
      ethers.constants.AddressZero
    );
    await lenderPool.deployed();
    const Verification = await ethers.getContractFactory("Verification");
    verification = await Verification.deploy();
    await verification.deployed();
    const Reward = await ethers.getContractFactory("Reward");
    reward = await Reward.deploy();
  });

  it("Should set verification contract to LenderPool", async () => {
    await lenderPool.updateVerificationContract(verification.address);
  });

  it("should deploy contracts successfully", async function () {
    expect(
      await ethers.provider.getCode(lenderPool.address)
    ).to.be.length.above(10);
    expect(await ethers.provider.getCode(stable.address)).to.be.length.above(
      10
    );
  });

  it("should set minter", async function () {
    await tStable.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINTER_ROLE")),
      lenderPool.address
    );

    expect(
      await tStable.hasRole(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINTER_ROLE")),
        lenderPool.address
      )
    );
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

  it("should transfer trade tokens to lender pool", async function () {
    await trade
      .connect(accounts[0])
      .transfer(lenderPool.address, 10000 * 10 ** 6);
    expect(await trade.balanceOf(lenderPool.address)).to.be.equal(n6("10000"));
  });

  it("should set trade rate at 1 trade token per year per stable", async function () {
    await reward.setReward(100);
  });

  it("should set minter", async function () {
    await trade.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINTER_ROLE")),
      lenderPool.address
    );

    expect(
      await trade.hasRole(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINTER_ROLE")),
        lenderPool.address
      )
    );
  });

  it("should approve stable token", async function () {
    await stable.connect(accounts[1]).approve(lenderPool.address, n6("200"));
    expect(
      await stable.allowance(addresses[1], lenderPool.address)
    ).to.be.equal(ethers.BigNumber.from(n6("200")));
  });

  it("should fail deposits stable token without KYC", async function () {
    await expect(
      lenderPool.connect(accounts[1]).deposit(n6("100"))
    ).to.be.revertedWith("Need to have valid KYC");
  });

  it("should transfer amount to account 1", async function () {
    await stable.transfer(addresses[1], n6("200"));
  });

  it("should increase the minimum deposit before KYC", async () => {
    await lenderPool.updateKYCLimit(n6("5000"));
  });

  it("should revert if no reward", async function () {
    expect(lenderPool.connect(accounts[1]).claimAllTrade()).to.be.revertedWith(
      "Reward is zero"
    );
  });

  it("should deposit 100 stable token at t = 0 year", async function () {
    await lenderPool.connect(accounts[1]).deposit(n6("100"));
    currentTime = await now();
    expect(await stable.balanceOf(lenderPool.address)).to.be.equal(
      ethers.BigNumber.from(n6("100"))
    );
  });

  it("should claim reward at t = 2 year (close to 200)", async function () {
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365 * 2);
    const balanceBefore = await trade.balanceOf(addresses[1]);
    await lenderPool.connect(accounts[1]).claimAllTrade();
    const balanceAfter = await trade.balanceOf(addresses[1]);
    console.log(balanceAfter.sub(balanceBefore));
  });

  it("should claim all tStable successfully at t = 3 year", async function () {
    const balanceBefore = await tStable.balanceOf(addresses[1]);
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365 * 3);
    await lenderPool.connect(accounts[1]).withdrawAllTStable();
    const balanceAfter = await tStable.balanceOf(addresses[1]);
    expect(balanceAfter.sub(balanceBefore)).to.be.equal(
      ethers.BigNumber.from(n6("100"))
    );
  });

  it("should check reward at t = 4 year is 100 stable", async function () {
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365 * 4);
    expect(await lenderPool.connect(accounts[1]).rewardTradeOf()).to.be.equal(
      n6("100")
    );
  });

  it("should set trade rate to 2 trade per year per token", async function () {
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365 * 5);
    await reward.setReward(200);
  });

  it("should deposit 50 stable token at t = 6 year", async function () {
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365 * 6);
    await lenderPool.connect(accounts[1]).deposit(n6("50"));
  });

  it("should check reward at t = 7 year (close to 200)", async function () {
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365 * 7);
    console.log(await lenderPool.connect(accounts[1]).rewardTradeOf());
  });
});
