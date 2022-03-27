import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Token, LenderPool } from "../typechain";
import {
  increaseTime,
  n6,
  ONE_DAY,
  now,
  setNextBlockTimestamp,
} from "./helpers";

describe("LenderPool", function () {
  let accounts: SignerWithAddress[];
  let addresses: string[];
  let lenderPool: LenderPool;
  let stable: Token;
  let tStable: Token;

  before(async () => {
    accounts = await ethers.getSigners();
    addresses = accounts.map((account: SignerWithAddress) => account.address);
    const Token = await ethers.getContractFactory("Token");
    stable = await Token.deploy("Tether", "USDT", 6);
    await stable.deployed();
    const TStable = await ethers.getContractFactory("Token");
    tStable = await TStable.deploy("Tether derivative", "TUSDT", 6);
    const LenderPool = await ethers.getContractFactory("LenderPool");
    lenderPool = await LenderPool.deploy(stable.address, tStable.address);
    await lenderPool.deployed();
  });

  it("should deploy contracts successfully", async function () {
    expect(
      await ethers.provider.getCode(lenderPool.address)
    ).to.be.length.above(10);
    expect(await ethers.provider.getCode(stable.address)).to.be.length.above(
      10
    );
  });

  it("should approve stable token", async function () {
    await stable.connect(accounts[0]).approve(lenderPool.address, 100);
    expect(
      await stable.allowance(addresses[0], lenderPool.address)
    ).to.be.equal(ethers.BigNumber.from("100"));
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

  it("should deposit stable token successfully", async function () {
    await lenderPool.connect(accounts[0]).deposit(100);
    expect(await stable.balanceOf(lenderPool.address)).to.be.equal(
      ethers.BigNumber.from("100")
    );
  });

  it("should check balance of user after deposit", async function () {
    expect(await lenderPool.getDeposit(addresses[0])).to.be.equal(100);
  });

  it("should revert if tStable claimed is more than stable deposited", async function () {
    expect(
      lenderPool.connect(accounts[0]).withdrawTStable(1000)
    ).to.be.revertedWith("Amount requested more than deposit made");
  });

  it("should claim tStable successfully", async function () {
    const balanceBefore = await tStable.balanceOf(addresses[0]);
    await lenderPool.connect(accounts[0]).withdrawTStable(1);
    const balanceAfter = await tStable.balanceOf(addresses[0]);
    expect(balanceAfter.sub(balanceBefore)).to.be.equal(
      ethers.BigNumber.from("1")
    );
  });

  it("should claim all tStable successfully", async function () {
    const balanceBefore = await tStable.balanceOf(addresses[0]);
    await lenderPool.connect(accounts[0]).withdrawAllTStable();
    const balanceAfter = await tStable.balanceOf(addresses[0]);
    expect(balanceAfter.sub(balanceBefore)).to.be.equal(
      ethers.BigNumber.from("99")
    );
  });

  it("should revert if all tStable is claimed", function async() {
    expect(
      lenderPool.connect(accounts[0]).withdrawAllTStable()
    ).to.be.revertedWith("tStable already claimed");
  });

  it("should revert if allowance is less than lending amount", async function () {
    expect(lenderPool.connect(accounts[0]).deposit(100)).to.be.revertedWith(
      "Amount not approved"
    );
  });

  it("should revert if amount is zero", async function () {
    expect(lenderPool.connect(accounts[0]).deposit(0)).to.be.revertedWith(
      "Lending amount invalid"
    );
  });

  it("should revert if no amount is deposited", async function () {
    expect(
      lenderPool.connect(accounts[1]).withdrawAllTStable()
    ).to.be.revertedWith("No deposit made");
  });
});
describe("LenderPool rewards testing", function () {
  let accounts: SignerWithAddress[];
  let addresses: string[];
  let lenderPool: LenderPool;
  let stable: Token;
  let tStable: Token;
  let currentTime: number = 0;
  before(async () => {
    accounts = await ethers.getSigners();
    addresses = accounts.map((account: SignerWithAddress) => account.address);
    const Token = await ethers.getContractFactory("Token");
    stable = await Token.deploy("Tether", "USDT", 6);
    await stable.deployed();
    const TStable = await ethers.getContractFactory("Token");
    tStable = await TStable.deploy("Tether derivative", "TUSDT", 6);
    const LenderPool = await ethers.getContractFactory("LenderPool");
    lenderPool = await LenderPool.deploy(stable.address, tStable.address);
    await lenderPool.deployed();
  });

  it("should transfer tStable to lender pool", async function () {
    await tStable
      .connect(accounts[0])
      .transfer(lenderPool.address, n6("10000"));
    expect(await tStable.balanceOf(lenderPool.address)).to.be.equal(
      n6("10000")
    );
  });

  it("should transfer stable to others EOA's", async function () {
    await stable.connect(accounts[0]).transfer(addresses[1], n6("10000"));
    await stable.connect(accounts[0]).transfer(addresses[2], n6("10000"));
    await stable.connect(accounts[0]).transfer(addresses[3], n6("10000"));
    expect(await stable.balanceOf(addresses[1])).to.be.equal(n6("10000"));
    expect(await stable.balanceOf(addresses[2])).to.be.equal(n6("10000"));
    expect(await stable.balanceOf(addresses[3])).to.be.equal(n6("10000"));
  });

  it("should set APY to 10%", async function () {
    await lenderPool.setAPY(1000);
    expect(await lenderPool.getAPY()).to.be.equal(1000);
  });

  it("should not be able to increase APY", async function () {
    expect(lenderPool.connect(accounts[1]).setAPY(20)).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
  });

  it("should deposit 100 stable tokens successfully from account 1", async function () {
    await stable.connect(accounts[1]).approve(lenderPool.address, n6("100"));
    expect(n6("100")).to.be.equal(
      await stable.allowance(addresses[1], lenderPool.address)
    );
    await lenderPool.connect(accounts[1]).deposit(n6("100"));
    expect(await lenderPool.getDeposit(addresses[1])).to.be.equal(n6("100"));
  });

  it("should check reward after 1 year is 10 tStable token", async function () {
    await increaseTime(ONE_DAY * 365);
    const balanceBefore = await tStable.balanceOf(addresses[1]);
    await lenderPool.connect(accounts[1]).claimRewards();
    const balanceAfter = await tStable.balanceOf(addresses[1]);
    expect(balanceAfter.sub(balanceBefore) === n6("10"));
  });

  it("should deposit 100 stable token from account 1", async function () {
    await stable.connect(accounts[1]).approve(lenderPool.address, n6("100"));
    expect(n6("100")).to.be.equal(
      await stable.allowance(addresses[1], lenderPool.address)
    );
    await lenderPool.connect(accounts[1]).deposit(n6("100"));
    expect(await lenderPool.getDeposit(addresses[1])).to.be.equal(n6("200"));
  });

  it("should check reward after 1 year is 20 tStable token", async function () {
    const balanceBefore = await tStable.balanceOf(addresses[1]);
    await increaseTime(ONE_DAY * 365);
    await lenderPool.connect(accounts[1]).claimRewards();
    const balanceAfter = await tStable.balanceOf(addresses[1]);
    expect(balanceAfter.sub(balanceBefore)).to.be.equal(n6("20"));
  });

  it("should withdraw 100 tStable and check reward after 1 year is 10 tStable token", async function () {
    await lenderPool.connect(accounts[1]).withdrawTStable(n6("100"));
    await increaseTime(ONE_DAY * 365);
    const balanceBefore = await tStable.balanceOf(addresses[1]);
    await lenderPool.connect(accounts[1]).claimRewards();
    const balanceAfter = await tStable.balanceOf(addresses[1]);
    expect(balanceAfter.sub(balanceBefore)).to.be.equal(n6("10"));
  });

  it("should check for no reward", async function () {
    expect(lenderPool.connect(accounts[1]).claimRewards()).to.be.revertedWith(
      "No pending reward"
    );
  });

  it("should withdraw all funds", async function () {
    const balanceBefore = await tStable.balanceOf(addresses[1]);
    await lenderPool.connect(accounts[1]).withdrawAllTStable();
    const balanceAfter = await tStable.balanceOf(addresses[1]);
    expect(balanceAfter.sub(balanceBefore)).to.be.equal(n6("100"));
  });

  it("should set APY to 40%", async function () {
    await lenderPool.connect(accounts[0]).setAPY(4000);
    expect(await lenderPool.getAPY()).to.be.equal(4000);
  });

  it("should deposit 3650 stable token from account 2", async function () {
    await stable.connect(accounts[2]).approve(lenderPool.address, n6("3650"));
    expect(n6("3650")).to.be.equal(
      await stable.allowance(addresses[2], lenderPool.address)
    );
    currentTime = await now();
    await lenderPool.connect(accounts[2]).deposit(n6("3650"));
    expect(await lenderPool.getDeposit(addresses[2])).to.be.equal(n6("3650"));
  });

  it("should withdraw reward after 1 month", async function () {
    const balanceBefore = await tStable.balanceOf(addresses[2]);
    await setNextBlockTimestamp(currentTime + ONE_DAY * 30);
    await lenderPool.connect(accounts[2]).claimRewards();
    const balanceAfter = await tStable.balanceOf(addresses[2]);
    expect(balanceAfter.sub(balanceBefore)).to.be.equal(n6("120"));
  });

  it("should withdraw reward after 1 month", async function () {
    const balanceBefore = await tStable.balanceOf(addresses[2]);
    await setNextBlockTimestamp(currentTime + ONE_DAY * 60);
    await lenderPool.connect(accounts[2]).claimRewards();
    const balanceAfter = await tStable.balanceOf(addresses[2]);
    expect(balanceAfter.sub(balanceBefore)).to.be.equal(n6("120"));
  });

  it("should deposit 9855 token from account 3", async function () {
    await stable.connect(accounts[3]).approve(lenderPool.address, n6("9855"));
    expect(n6("9855")).to.be.equal(
      await stable.allowance(addresses[3], lenderPool.address)
    );
    await lenderPool.connect(accounts[3]).deposit(n6("9855"));
    expect(await lenderPool.getDeposit(addresses[3])).to.be.equal(n6("9855"));
  });

  it("should withdraw all the rewards after one day", async function () {
    await increaseTime(ONE_DAY);
    expect(
      await lenderPool.connect(accounts[3]).rewardOf(addresses[3])
    ).to.be.equal(n6("10.8"));
  });
});
