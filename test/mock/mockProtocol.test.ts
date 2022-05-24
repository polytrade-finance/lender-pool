import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { IERC20, MockProtocol } from "../../typechain";
import { f6, increaseTime, n6, ONE_DAY } from "../helpers";

describe("Contract Deployment", function () {
  let accounts: SignerWithAddress[];
  let addresses: string[];
  let stableToken: IERC20;
  let protocol: MockProtocol;
  before(async () => {
    accounts = await ethers.getSigners();
    addresses = accounts.map((account: SignerWithAddress) => account.address);
  });
  it("Should deploy trade, stable and tStable Token", async () => {
    const Token = await ethers.getContractFactory("Token");

    stableToken = await Token.deploy("Tether", "USDT", 6);
  });

  it("Should deploy MockProtocol", async () => {
    const Protocol = await ethers.getContractFactory("MockProtocol");
    protocol = await Protocol.deploy(stableToken.address);
  });

  it("Should approve and deposit 100,000 USDT", async () => {
    await stableToken.approve(protocol.address, n6("100000"));
    await protocol.deposit(n6("100000"));
  });

  it("Should display rewards after 1day", async () => {
    await increaseTime(ONE_DAY);
    const rewards = await protocol.rewardOf(addresses[0]);

    expect(f6(rewards)).to.equal("864.0");

    await stableToken.balanceOf(addresses[0]);
  });

  it("Should withdraw all", async () => {
    await stableToken.transfer(
      protocol.address,
      await stableToken.balanceOf(addresses[0])
    );

    expect(f6(await stableToken.balanceOf(addresses[0]))).to.equal("0.0");

    await protocol.withdraw();
    expect(f6(await stableToken.balanceOf(addresses[0]))).to.equal("100864.02");
  });

  it("Should revert if nothing to withdraw", async () => {
    await expect(protocol.withdraw()).to.be.revertedWith("No deposit");
  });
});

describe("Contract Deployment with withdraw amount", function () {
  let accounts: SignerWithAddress[];
  let addresses: string[];
  let stableToken: IERC20;
  let protocol: MockProtocol;
  before(async () => {
    accounts = await ethers.getSigners();
    addresses = accounts.map((account: SignerWithAddress) => account.address);
  });
  it("Should deploy trade, stable and tStable Token", async () => {
    const Token = await ethers.getContractFactory("Token");

    stableToken = await Token.deploy("Tether", "USDT", 6);
  });

  it("Should deploy MockProtocol", async () => {
    const Protocol = await ethers.getContractFactory("MockProtocol");
    protocol = await Protocol.deploy(stableToken.address);
  });

  it("Should approve and deposit 100,000 USDT", async () => {
    await stableToken.approve(protocol.address, n6("100000"));
    await protocol.deposit(n6("100000"));
  });

  it("Should display rewards after 1day", async () => {
    await increaseTime(ONE_DAY);
    const rewards = await protocol.rewardOf(addresses[0]);

    expect(f6(rewards)).to.equal("864.0");

    await stableToken.balanceOf(addresses[0]);
  });

  it("Should withdraw amount", async () => {
    await stableToken.transfer(
      protocol.address,
      await stableToken.balanceOf(addresses[0])
    );

    expect(f6(await stableToken.balanceOf(addresses[0]))).to.equal("0.0");

    await protocol.withdrawAmount(n6("90000"));
    expect(f6(await stableToken.balanceOf(addresses[0]))).to.equal("90000.0");
  });
});
