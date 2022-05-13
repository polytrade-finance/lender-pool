import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { StakingStrategy, Token, LenderPool, RedeemPool } from "../typechain";
import { n6, increaseTime, ONE_DAY } from "./helpers";
import {
  USDTAddress,
  aUSDTAddress,
  AccountToImpersonateUSDT,
  // eslint-disable-next-line node/no-missing-import
} from "./constants/constants.helpers";

describe("StakingStrategy", async function () {
  let accounts: SignerWithAddress[];
  let addresses: string[];
  let stakingStrategy: StakingStrategy;
  let stakingStrategy2: StakingStrategy;
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
    const StakingStrategy = await ethers.getContractFactory("StakingStrategy");
    stakingStrategy = await StakingStrategy.deploy(
      stable.address,
      aStable.address
    );
    stakingStrategy2 = await StakingStrategy.deploy(
      stable.address,
      aStable.address
    );
    await stakingStrategy.deployed();
    await stakingStrategy2.deployed();
    expect(
      await ethers.provider.getCode(stakingStrategy.address)
    ).to.be.length.above(10);
    expect(
      await ethers.provider.getCode(stakingStrategy2.address)
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
    await stable.connect(accounts[0]).transfer(addresses[1], n6("200"));
    const balanceAfter = await stable.balanceOf(addresses[1]);
    expect(balanceAfter.sub(balanceBefore)).to.be.equal(n6("200"));
  });

  it("should set staking pool", async function () {
    lenderPool.switchStrategy(stakingStrategy.address);
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
    await lenderPool.depositInStakingStrategy(n6("100"));
    const balanceAfter1 = await stable.balanceOf(lenderPool.address);
    expect(balanceBefore1.sub(balanceAfter1)).to.be.equal(n6("100"));
  });

  it("should set LENDER_POOL role in redeem", async function () {
    await stakingStrategy.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LENDER_POOL")),
      lenderPool.address
    );
    await stakingStrategy2.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LENDER_POOL")),
      lenderPool.address
    );
    expect(
      await stakingStrategy.hasRole(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LENDER_POOL")),
        lenderPool.address
      )
    );
    expect(
      await stakingStrategy2.hasRole(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LENDER_POOL")),
        lenderPool.address
      )
    );
  });

  it("should check and withdraw from staking pool", async function () {
    await increaseTime(ONE_DAY * 365);
    console.log(await lenderPool.getStakingStrategyBalance());
    const balanceBefore1 = await stable.balanceOf(lenderPool.address);
    await increaseTime(ONE_DAY * 365);
    await lenderPool.withdrawAllFromStakingStrategy();
    const balanceAfter1 = await stable.balanceOf(lenderPool.address);
    console.log(balanceAfter1.sub(balanceBefore1));
  });

  it("should deposit funds to staking pool through lender pool", async function () {
    const balanceBefore1 = await stable.balanceOf(lenderPool.address);
    await lenderPool.depositInStakingStrategy(n6("100"));
    const balanceAfter1 = await stable.balanceOf(lenderPool.address);
    expect(balanceBefore1.sub(balanceAfter1)).to.be.equal(n6("100"));
  });

  it("should update staking pool", async function () {
    await increaseTime(ONE_DAY * 365);
    const balanceOldStrategy = await stakingStrategy.getBalance();
    await lenderPool.switchStrategy(stakingStrategy2.address);
    const balanceNewStrategy = await stakingStrategy2.getBalance();
    expect(balanceOldStrategy.sub(balanceNewStrategy)).to.be.equal("0");
    expect(await stakingStrategy.getBalance()).to.be.equal("0");
  });

  it("should withdraw from staking pool( very close to 0)", async function () {
    const aStableBalance = await stakingStrategy2.getBalance();
    const stableBefore = await stable.balanceOf(lenderPool.address);
    await lenderPool.withdrawAllFromStakingStrategy();
    const stableAfter = await stable.balanceOf(lenderPool.address);
    console.log(stableAfter.sub(stableBefore).sub(aStableBalance));
  });

  it("deposit all stable to staking strategy", async function () {
    const stableBefore = await stable.balanceOf(lenderPool.address);
    await lenderPool.depositAllInStakingStrategy();
    const stableAfter = await stable.balanceOf(lenderPool.address);
    expect(stableAfter).to.be.equal("0");
    expect(await lenderPool.getStakingStrategyBalance()).to.be.equal(
      stableBefore
    );
  });

  it("withdraw from staking pool", async function () {
    const stableBefore = await stable.balanceOf(lenderPool.address);
    await lenderPool.withdrawFromStakingStrategy(n6("10"));
    const stableAfter = await stable.balanceOf(lenderPool.address);
    expect(stableAfter.sub(stableBefore)).to.be.equal(n6("10"));
  });
});
