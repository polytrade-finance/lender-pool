import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { StakingPool, Token, LenderPool, RedeemPool } from "../typechain";
import { n6 } from "./helpers";
import {
  USDTAddress,
  aUSDTAddress,
  AccountToImpersonateUSDT,
  aaveAddress,
  // eslint-disable-next-line node/no-missing-import
} from "./constants/constants.helpers";

describe("StakingPool", async function () {
  let accounts: SignerWithAddress[];
  let addresses: string[];
  let stakingPool: StakingPool;
  let stable: any;
  let aStable: any;
  let tStable: Token;
  let redeem: RedeemPool;
  let lenderPool: LenderPool;
  before(async () => {
    accounts = await ethers.getSigners();
    addresses = accounts.map((account: SignerWithAddress) => account.address);
  });

  it("Should return the stable and aStable Token", async function () {
    stable = await ethers.getContractAt("IERC20", USDTAddress, accounts[0]);
    expect(await ethers.provider.getCode(stable.address)).to.be.length.above(
      100
    );
    aStable = await ethers.getContractAt("IERC20", aUSDTAddress, accounts[0]);
  });

  it("should deploy staking pool contract successfully", async function () {
    const StakingPool = await ethers.getContractFactory("StakingPool");
    stakingPool = await StakingPool.deploy(stable.address, aStable.address);
    await stakingPool.deployed();
    expect(
      await ethers.provider.getCode(stakingPool.address)
    ).to.be.length.above(10);
  });

  it("should deploy lender pool", async function () {
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
    await stable.connect(accounts[0]).transfer(addresses[1], n6("100"));
    const balanceAfter = await stable.balanceOf(addresses[1]);
    expect(balanceAfter.sub(balanceBefore)).to.be.equal(n6("100"));
  });

  it("should set staking pool", async function () {
    lenderPool.setStakingPool(stakingPool.address);
    expect(await lenderPool.getStakingPool()).to.be.equal(stakingPool.address);
  });

  it("should deposit 100 stable tokens successfully from account 1", async function () {
    await stable.connect(accounts[1]).approve(lenderPool.address, n6("100"));
    expect(n6("100")).to.be.equal(
      await stable.allowance(addresses[1], lenderPool.address)
    );
    await lenderPool.connect(accounts[1]).deposit(n6("100"));
    expect(await lenderPool.getDeposit(addresses[1])).to.be.equal(n6("100"));
  });

  it("should deposit funds to staking pool through lender pool", async function () {
    const balanceBefore1 = await stable.balanceOf(lenderPool.address);
    const balanceBefore2 = await stable.balanceOf(aaveAddress);
    const balanceBefore3 = await aStable.balanceOf(lenderPool.address);
    await lenderPool.depositInStakingPool(n6("100"));
    const balanceAfter1 = await stable.balanceOf(lenderPool.address);
    const balanceAfter2 = await stable.balanceOf(aaveAddress);
    const balanceAfter3 = await aStable.balanceOf(lenderPool.address);
    expect(balanceBefore1.sub(balanceAfter1)).to.be.equal(n6("100"));
    console.log(balanceBefore1.sub(balanceAfter1));
    console.log(balanceBefore2.sub(balanceAfter2));
    console.log(balanceBefore3.sub(balanceAfter3));
  });

  it("should set LENDER_POOL role in redeem", async function () {
    redeem.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LENDING_POOL")),
      lenderPool.address
    );
    expect(
      await redeem.hasRole(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LENDING_POOL")),
        lenderPool.address
      )
    );
    console.log(
      "role",
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LENDING_POOL"))
    );
  });

  it("should withdraw from staking pool", async function () {
    console.log(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MY_ROLE")));
    console.log(
      "lender pool",
      lenderPool.address,
      "message sender",
      addresses[0]
    );
    const balanceBefore1 = await stable.balanceOf(lenderPool.address);
    const balanceBefore2 = await aStable.balanceOf(lenderPool.address);
    await lenderPool.withdrawFromStakingPool(n6("100"));
    const balanceAfter2 = await aStable.balanceOf(lenderPool.address);
    const balanceAfter1 = await stable.balanceOf(lenderPool.address);
    console.log(balanceAfter1.sub(balanceBefore1));
    console.log(balanceBefore2.sub(balanceAfter2));
    expect(balanceAfter1.sub(balanceBefore1)).to.be.equal(n6("100"));
  });
});
