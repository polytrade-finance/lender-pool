import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Token, LenderPool, Verification, TradeReward } from "../typechain";
import { n6 } from "./helpers";
describe("LenderPool", function () {
  let accounts: SignerWithAddress[];
  let addresses: string[];
  let lenderPool: LenderPool;
  let stable: Token;
  let tStable: Token;
  let trade: Token;
  let verification: Verification;
  let tradeReward: TradeReward;
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
    const TradeReward = await ethers.getContractFactory("TradeReward");
    tradeReward = await TradeReward.deploy();
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
    await tradeReward.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LENDER_POOL")),
      lenderPool.address
    );

    await tradeReward.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("OWNER")),
      addresses[0]
    );

    expect(
      await tradeReward.hasRole(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LENDER_POOL")),
        lenderPool.address
      )
    );

    expect(
      await tradeReward.hasRole(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("OWNER")),
        addresses[0]
      )
    );
  });

  it("should set trade and tradeReward in LenderPool", async function () {
    await lenderPool.setTrade(trade.address);
    expect(await lenderPool.trade()).to.be.equal(trade.address);
    await lenderPool.setTradeReward(tradeReward.address);
    expect(await lenderPool.tradeReward()).to.be.equal(tradeReward.address);
  });

  it("should approve stable token", async function () {
    await stable.connect(accounts[0]).approve(lenderPool.address, n6("100"));
    expect(
      await stable.allowance(addresses[0], lenderPool.address)
    ).to.be.equal(ethers.BigNumber.from(n6("100")));
  });

  it("should transfer tStable to lender pool", async function () {
    await tStable
      .connect(accounts[0])
      .transfer(lenderPool.address, 100 * 10 ** 6);
    expect(await tStable.balanceOf(lenderPool.address)).to.be.equal(n6("100"));
  });

  it("should check balance of user is zero", async function () {
    expect(await lenderPool.getDeposit(addresses[0])).to.be.equal(0);
  });

  it("should fail deposits stable token without KYC", async function () {
    await expect(
      lenderPool.connect(accounts[0]).deposit(n6("100"))
    ).to.be.revertedWith("Need to have valid KYC");
  });

  it("should increase the minimum deposit before KYC", async () => {
    await lenderPool.updateKYCLimit(n6("5000"));
  });

  it("should deposit stable token successfully", async function () {
    await lenderPool.connect(accounts[0]).deposit(n6("100"));
    expect(await stable.balanceOf(lenderPool.address)).to.be.equal(
      ethers.BigNumber.from(n6("100"))
    );
  });

  it("should check balance of user after deposit", async function () {
    expect(await lenderPool.getDeposit(addresses[0])).to.be.equal(n6("100"));
  });




  it("should claim all tStable successfully", async function () {
    const balanceBefore = await tStable.balanceOf(addresses[0]);
    await lenderPool.connect(accounts[0]).withdrawAllTStable();
    const balanceAfter = await tStable.balanceOf(addresses[0]);
    expect(balanceAfter.sub(balanceBefore)).to.be.equal(
      ethers.BigNumber.from(n6("100"))
    );
  });

  it("should revert if all tStable is claimed", function async() {
    expect(
      lenderPool.connect(accounts[0]).withdrawAllTStable()
    ).to.be.revertedWith("tStable already claimed");
  });

});
