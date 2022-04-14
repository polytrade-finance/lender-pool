import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { RedeemPool, Token } from "../typechain";
import { n6 } from "./helpers";
describe("RedeemPool", function () {
  let accounts: SignerWithAddress[];
  let addresses: string[];
  let stable: Token;
  let tStable: Token;
  let redeem: RedeemPool;
  before(async () => {
    accounts = await ethers.getSigners();
    addresses = accounts.map((account: SignerWithAddress) => account.address);
  });

  it("should deploy Token successfully", async function () {
    const Token = await ethers.getContractFactory("Token");
    stable = await Token.deploy("stable", "USDT", 6);
    tStable = await Token.deploy("tStable", "TUSDT", 6);
    await stable.deployed();
    await tStable.deployed();
    expect(await ethers.provider.getCode(stable.address)).to.be.length.above(
      10
    );
    expect(await ethers.provider.getCode(tStable.address)).to.be.length.above(
      10
    );
    expect(await stable.decimals()).to.be.equal(6);
    expect(await tStable.decimals()).to.be.equal(6);
    expect(
      ethers.utils
        .parseUnits("1000000000", "6")
        .eq(await stable.connect(accounts[0]).balanceOf(addresses[0]))
    );
    expect(
      ethers.utils
        .parseUnits("1000000000", "6")
        .eq(await tStable.connect(accounts[0]).balanceOf(addresses[0]))
    );
  });

  it("should deploy Redeem pool successfully", async function () {
    const Redeem = await ethers.getContractFactory("RedeemPool");
    redeem = await Redeem.deploy(stable.address, tStable.address);
  });

  it("should transfer tStable to others EOA's", async function () {
    await tStable.connect(accounts[0]).transfer(addresses[1], n6("1000"));
    expect(await tStable.balanceOf(addresses[1])).to.be.equal(n6("1000"));
  });

  it("should not be able to deposit stable", async function () {
    expect(redeem.depositStable(n6("0"))).to.be.revertedWith("Invalid amount");
  });

  it("should approve stable token", async function () {
    await stable.connect(accounts[0]).approve(redeem.address, n6("1000"));
    expect(await stable.allowance(addresses[0], redeem.address)).to.be.equal(
      ethers.BigNumber.from(n6("1000"))
    );
  });

  it("should deposit stable to redeem pool", async function () {
    const balanceBefore = await stable.balanceOf(redeem.address);
    await redeem.depositStable(n6("1000"));
    const balanceAfter = await stable.balanceOf(redeem.address);
    expect(balanceAfter.sub(balanceBefore)).to.be.equal(
      ethers.BigNumber.from(n6("1000"))
    );
  });

  it("should approve tStable token", async function () {
    await tStable.connect(accounts[1]).approve(redeem.address, n6("500"));
    expect(await tStable.allowance(addresses[1], redeem.address)).to.be.equal(
      ethers.BigNumber.from(n6("500"))
    );
  });

  it("should not be able to deposit stable", async function () {
    expect(redeem.depositStable(n6("1000"))).to.be.revertedWith(
      "Not enough allowance"
    );
  });

  it("should revert if insufficient balance in pool", async function () {
    expect(
      redeem.connect(accounts[1]).getStable(n6("10000"))
    ).to.be.revertedWith("insufficient balance in pool");
  });

  it("should revert if not enough allowance", async function () {
    expect(
      redeem.connect(accounts[1]).getStable(n6("1000"))
    ).to.be.revertedWith("allowance less than amount");
  });

  it("should covert tStable to stable", async function () {
    const balanceBefore = await stable.balanceOf(addresses[1]);
    await redeem.connect(accounts[1]).getStable(n6("100"));
    const balanceAfter = await stable.balanceOf(addresses[1]);
    expect(balanceAfter.sub(balanceBefore)).to.be.equal(
      ethers.BigNumber.from(n6("100"))
    );
  });
});
