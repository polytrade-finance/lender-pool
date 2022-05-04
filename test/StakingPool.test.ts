import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { StakingPool, Token, LenderPool, RedeemPool } from "../typechain";
import { n6 } from "./helpers";
import {
  USDTAddress,
  AccountToImpersonateUSDT,
  // eslint-disable-next-line node/no-missing-import
} from "./constants/constants.helpers";

describe("StakingPool", async function () {
  let accounts: SignerWithAddress[];
  let addresses: string[];
  let stakingPool: StakingPool;
  let stable: any;
  let tStable: Token;
  let redeem: RedeemPool;
  let lenderPool: LenderPool;
  before(async () => {
    accounts = await ethers.getSigners();
    addresses = accounts.map((account: SignerWithAddress) => account.address);
  });

  it("Should return the Stable Token", async function () {
    stable = await ethers.getContractAt("IERC20", USDTAddress, accounts[0]);
    expect(await ethers.provider.getCode(stable.address)).to.be.length.above(
      100
    );
  });

  it("should deploy staking pool contract successfully", async function () {
    const StakingPool = await ethers.getContractFactory("StakingPool");
    stakingPool = await StakingPool.deploy(stable.address);
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

  it("should deposit 50 stable tokens successfully from account 1", async function () {
    await stable.connect(accounts[1]).approve(lenderPool.address, n6("50"));
    expect(n6("50")).to.be.equal(
      await stable.allowance(addresses[1], lenderPool.address)
    );
    await lenderPool.connect(accounts[1]).deposit(n6("50"));
    expect(await lenderPool.getDeposit(addresses[1])).to.be.equal(n6("50"));
  });

  it("should increase allowance", async function () {
    await stable.connect(accounts[1]).approve(stakingPool.address, n6("1"));
    expect(n6("1")).to.be.equal(
      await stable.allowance(addresses[1], stakingPool.address)
    );
  });

  it("should deposit funds to staking pool", async function () {
    await stakingPool.connect(accounts[1]).deposit(n6("1"));
  });

  it("should set staking pool", async function () {
    lenderPool.setStakingPool(stakingPool.address);
  });

  it("should deposit funds to staking pool through lender pool", async function () {
    await lenderPool.depositInStakingPool(n6("50"));
  });

  it("should set LENDER_POOL role in redeem", async function () {
    stakingPool.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LENDER_POOL")),
      lenderPool.address
    );
    expect(
      await stakingPool.hasRole(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LENDER_POOL")),
        lenderPool.address
      )
    );
    console.log(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LENDER_POOL")));
    await lenderPool.withdrawFromStakingPool(n6("50"));
  });

  it("should withdraw from staking pool", async function () {
    console.log(lenderPool.address, addresses[0]);
    await lenderPool.withdrawFromStakingPool(n6("50"));
  });
});
