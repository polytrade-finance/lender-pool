import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Token, LenderPool, Verification } from "../typechain";
import { n6, ONE_DAY, now, setNextBlockTimestamp } from "./helpers";
describe("Normal reward without withdrawals only 1 round (same APY)", function () {
  let accounts: SignerWithAddress[];
  let addresses: string[];
  let lenderPool: LenderPool;
  let stable: Token;
  let tStable: Token;
  let verification: Verification;
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
    lenderPool = await LenderPool.deploy(
      stable.address,
      tStable.address,
      ethers.constants.AddressZero
    );
    await lenderPool.deployed();

    const Verification = await ethers.getContractFactory("Verification");
    verification = await Verification.deploy();
    await verification.deployed();

    await lenderPool.updateVerificationContract(verification.address);
    await lenderPool.updateDepositLimit(n6("5000"));
  });

  it("should set minter", async function () {
    tStable.grantRole(
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

  it("should transfer stable to others EOA's", async function () {
    await stable.connect(accounts[0]).transfer(addresses[1], n6("1000"));
    expect(await stable.balanceOf(addresses[1])).to.be.equal(n6("1000"));
  });

  it("should set APY to 100%", async function () {
    await lenderPool.setAPY(10000);
    expect(await lenderPool.getAPY()).to.be.equal(10000);
  });

  it("should deposit 1000 stable tokens successfully from account 1 at t = 0 year", async function () {
    await stable.connect(accounts[1]).approve(lenderPool.address, n6("1000"));
    expect(n6("1000")).to.be.equal(
      await stable.allowance(addresses[1], lenderPool.address)
    );
    await lenderPool.connect(accounts[1]).deposit(n6("1000"));
    currentTime = await now();
    expect(await lenderPool.getDeposit(addresses[1])).to.be.equal(n6("1000"));
  });

  it("should check reward at t = 1 year total of 1000 tStable token", async function () {
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365);
    expect(await lenderPool.rewardOf(addresses[1])).to.be.equal(n6("1000"));
  });
});

describe("Normal reward without withdrawals with multiple rounds", function () {
  let accounts: SignerWithAddress[];
  let addresses: string[];
  let lenderPool: LenderPool;
  let stable: Token;
  let tStable: Token;
  let verification: Verification;
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
    lenderPool = await LenderPool.deploy(
      stable.address,
      tStable.address,
      ethers.constants.AddressZero
    );
    await lenderPool.deployed();
    const Verification = await ethers.getContractFactory("Verification");
    verification = await Verification.deploy();
    await verification.deployed();

    await lenderPool.updateVerificationContract(verification.address);
    await lenderPool.updateDepositLimit(n6("5000"));
  });

  it("should set minter", async function () {
    tStable.grantRole(
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

  it("should transfer stable to others EOA's", async function () {
    await stable.connect(accounts[0]).transfer(addresses[1], n6("1000"));
    expect(await stable.balanceOf(addresses[1])).to.be.equal(n6("1000"));
  });

  it("should deposit 1000 stable tokens successfully from account 1 at t = 0 year", async function () {
    await stable.connect(accounts[1]).approve(lenderPool.address, n6("1000"));
    expect(n6("1000")).to.be.equal(
      await stable.allowance(addresses[1], lenderPool.address)
    );

    await lenderPool.connect(accounts[1]).deposit(n6("1000"));
    expect(await lenderPool.getDeposit(addresses[1])).to.be.equal(n6("1000"));
  });

  it("should set APY to 100%", async function () {
    await lenderPool.setAPY(10000);
    currentTime = await now();
    expect(await lenderPool.getAPY()).to.be.equal(10000);
  });

  it("should set APY to 200%", async function () {
    await lenderPool.setAPY(20000);
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365);
    expect(await lenderPool.getAPY()).to.be.equal(20000);
  });

  it("should set APY to 100%", async function () {
    await lenderPool.setAPY(10000);
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365 * 2);
    expect(await lenderPool.getAPY()).to.be.equal(10000);
  });

  it("should check reward at t = 3 year total of 4000 tStable token", async function () {
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365 * 3);
    console.log(await lenderPool.rewardOf(addresses[1]));
  });
});

describe("Rewards with multiple withdrawals on a single round (same APY)", function () {
  let accounts: SignerWithAddress[];
  let addresses: string[];
  let lenderPool: LenderPool;
  let stable: Token;
  let tStable: Token;
  let verification: Verification;
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
    lenderPool = await LenderPool.deploy(
      stable.address,
      tStable.address,
      ethers.constants.AddressZero
    );
    await lenderPool.deployed();
    const Verification = await ethers.getContractFactory("Verification");
    verification = await Verification.deploy();
    await verification.deployed();

    await lenderPool.updateVerificationContract(verification.address);
    await lenderPool.updateDepositLimit(n6("5000"));
  });

  it("should set minter", async function () {
    tStable.grantRole(
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

  it("should transfer stable to others EOA's", async function () {
    await stable.connect(accounts[0]).transfer(addresses[2], n6("2000"));
    expect(await stable.balanceOf(addresses[2])).to.be.equal(n6("2000"));
  });

  it("should set APY to 100%", async function () {
    await lenderPool.setAPY(10000);
    expect(await lenderPool.getAPY()).to.be.equal(10000);
  });

  it("should deposit 2000 stable tokens successfully from account 2 at t = 0 year", async function () {
    await stable.connect(accounts[2]).approve(lenderPool.address, n6("2000"));
    expect(n6("2000")).to.be.equal(
      await stable.allowance(addresses[2], lenderPool.address)
    );
    await lenderPool.connect(accounts[2]).deposit(n6("2000"));
    currentTime = await now();
    expect(await lenderPool.getDeposit(addresses[2])).to.be.equal(n6("2000"));
  });

  it("should withdraw reward at t = 1 year total of 1000 tStable token", async function () {
    const balanceBefore = await tStable.balanceOf(addresses[2]);
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365);
    await lenderPool.connect(accounts[2]).withdrawTStable(n6("1000"));
    const balanceAfter = await tStable.balanceOf(addresses[2]);
    expect(balanceAfter.sub(balanceBefore)).to.be.equal(n6("1000"));
  });

  it("should withdraw reward at t = 2 year total of 1000 tStable token", async function () {
    const balanceBefore = await tStable.balanceOf(addresses[2]);
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365 * 2);
    await lenderPool.connect(accounts[2]).withdrawTStable(n6("1000"));
    const balanceAfter = await tStable.balanceOf(addresses[2]);
    expect(balanceAfter.sub(balanceBefore)).to.be.equal(n6("1000"));
  });

  it("should check reward at t = 2 year total of 3000 tStable token", async function () {
    console.log(await lenderPool.rewardOf(addresses[2]));
  });
});

describe("Rewards with multiple withdrawals on multiple rounds (same APY)", function () {
  let accounts: SignerWithAddress[];
  let addresses: string[];
  let lenderPool: LenderPool;
  let stable: Token;
  let tStable: Token;
  let verification: Verification;
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
    lenderPool = await LenderPool.deploy(
      stable.address,
      tStable.address,
      ethers.constants.AddressZero
    );
    await lenderPool.deployed();
    const Verification = await ethers.getContractFactory("Verification");
    verification = await Verification.deploy();
    await verification.deployed();

    await lenderPool.updateVerificationContract(verification.address);
    await lenderPool.updateDepositLimit(n6("5000"));
  });

  it("should set minter", async function () {
    tStable.grantRole(
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

  it("should transfer stable to others EOA's", async function () {
    await stable.connect(accounts[0]).transfer(addresses[3], n6("5000"));
    expect(await stable.balanceOf(addresses[3])).to.be.equal(n6("5000"));
  });

  it("should set APY to 100%", async function () {
    await lenderPool.setAPY(10000);
    expect(await lenderPool.getAPY()).to.be.equal(10000);
  });

  it("should approve 5000 stable to the Lender Pool", async () => {
    await stable.connect(accounts[3]).approve(lenderPool.address, n6("5000"));
    expect(n6("5000")).to.be.equal(
      await stable.allowance(addresses[3], lenderPool.address)
    );
  });

  it("should fail deposit if no valid KYC", async () => {
    await expect(
      lenderPool.connect(accounts[3]).deposit(n6("5000"))
    ).to.be.revertedWith("Need to have valid KYC");
  });

  it("should approve KYC for user3", async () => {
    await verification.setKYC(addresses[3], true);
    expect(await verification.isValid(addresses[3])).to.equal(true);
  });

  it("should deposit 5000 stable tokens successfully from account 3 at t = 0 year", async function () {
    await lenderPool.connect(accounts[3]).deposit(n6("5000"));
    currentTime = await now();
    expect(await lenderPool.getDeposit(addresses[3])).to.be.equal(n6("5000"));
  });

  it("should withdraw reward at t = 1 year total of 1000 tStable token", async function () {
    const balanceBefore = await tStable.balanceOf(addresses[3]);
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365);
    await lenderPool.connect(accounts[3]).withdrawTStable(n6("1000"));
    const balanceAfter = await tStable.balanceOf(addresses[3]);
    expect(balanceAfter.sub(balanceBefore)).to.be.equal(n6("1000"));
  });

  it("should set APY to 10%", async function () {
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365 * 2);
    await lenderPool.setAPY(1000);
    expect(await lenderPool.getAPY()).to.be.equal(1000);
  });

  it("should withdraw reward at t = 3 year total of 1000 tStable token", async function () {
    const balanceBefore = await tStable.balanceOf(addresses[3]);
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365 * 3);
    await lenderPool.connect(accounts[3]).withdrawTStable(n6("1000"));
    const balanceAfter = await tStable.balanceOf(addresses[3]);
    expect(balanceAfter.sub(balanceBefore)).to.be.equal(n6("1000"));
  });

  it("should set APY to 100%", async function () {
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365 * 4);
    await lenderPool.setAPY(10000);
    expect(await lenderPool.getAPY()).to.be.equal(10000);
  });

  it("should check reward at t = 5 year total of 9700 tStable token", async function () {
    console.log(await lenderPool.rewardOf(addresses[3]));
  });
});

describe("Rewards with multiple withdrawals and deposits on multiple rounds", function () {
  let accounts: SignerWithAddress[];
  let addresses: string[];
  let lenderPool: LenderPool;
  let stable: Token;
  let tStable: Token;
  let verification: Verification;
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
    lenderPool = await LenderPool.deploy(
      stable.address,
      tStable.address,
      ethers.constants.AddressZero
    );
    await lenderPool.deployed();
    const Verification = await ethers.getContractFactory("Verification");
    verification = await Verification.deploy();
    await verification.deployed();

    await lenderPool.updateVerificationContract(verification.address);
    await lenderPool.updateDepositLimit(n6("5000"));
  });

  it("should set minter", async function () {
    tStable.grantRole(
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

  it("should transfer stable to others EOA's", async function () {
    await stable.connect(accounts[0]).transfer(addresses[3], n6("5000"));
    expect(await stable.balanceOf(addresses[3])).to.be.equal(n6("5000"));
  });

  it("should set APY to 100%", async function () {
    await lenderPool.setAPY(10000);
    expect(await lenderPool.getAPY()).to.be.equal(10000);
  });

  it("should approve KYC for user3", async () => {
    await verification.setKYC(addresses[3], true);
    expect(await verification.isValid(addresses[3])).to.equal(true);
  });

  it("should deposit 5000 stable tokens successfully from account 3 at t = 0 year", async function () {
    await stable.connect(accounts[3]).approve(lenderPool.address, n6("5000"));
    expect(n6("5000")).to.be.equal(
      await stable.allowance(addresses[3], lenderPool.address)
    );
    await lenderPool.connect(accounts[3]).deposit(n6("5000"));
    currentTime = await now();
    expect(await lenderPool.getDeposit(addresses[3])).to.be.equal(n6("5000"));
  });

  it("should withdraw reward at t = 1 year total of 4000 tStable token", async function () {
    const balanceBefore = await tStable.balanceOf(addresses[3]);
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365);
    await lenderPool.connect(accounts[3]).withdrawTStable(n6("4000"));
    const balanceAfter = await tStable.balanceOf(addresses[3]);
    expect(balanceAfter.sub(balanceBefore)).to.be.equal(n6("4000"));
  });

  it("should set APY to 200%", async function () {
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365 * 2);
    await lenderPool.setAPY(20000);
    expect(await lenderPool.getAPY()).to.be.equal(20000);
  });

  it("should check reward at t = 3 year total of 8000 tStable token", async function () {
    await setNextBlockTimestamp(currentTime + ONE_DAY * 365 * 3);
    console.log(await lenderPool.rewardOf(addresses[3]));
  });
});
