import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { TetherToken, LenderPool } from "../typechain";

describe("LenderPool", function () {
  let accounts: SignerWithAddress[];
  let addresses: string[];
  let lenderPool: LenderPool;
  let tetherToken: TetherToken;

  before(async () => {
    accounts = await ethers.getSigners();
    addresses = accounts.map((account: SignerWithAddress) => account.address);
    const LenderPool = await ethers.getContractFactory("LenderPool");
    lenderPool = await LenderPool.deploy();
    await lenderPool.deployed();
    const TetherToken = await ethers.getContractFactory("TetherToken");
    tetherToken = await TetherToken.deploy();
    await tetherToken.deployed();
  });

  it("Should deploy contracts successfully", async function () {
    expect(
      await ethers.provider.getCode(lenderPool.address)
    ).to.be.length.above(10);
    expect(
      await ethers.provider.getCode(tetherToken.address)
    ).to.be.length.above(10);
  });

  it("should approve token", async function () {
    await tetherToken.connect(accounts[0]).approve(lenderPool.address, 100);
    expect(
      ethers.BigNumber.from("100").eq(
        await tetherToken.allowance(addresses[0], lenderPool.address)
      )
    ).to.be.true;
  });

  it("amount should be deposited after approval", async function () {
    await lenderPool.connect(accounts[0]).deposit(tetherToken.address, 100);
    expect(
      ethers.BigNumber.from("100").eq(
        await tetherToken.balanceOf(lenderPool.address)
      )
    ).to.be.true;
  });

  it("deposit should return if allowance is less than lending amount", async function () {
    expect(
      lenderPool.connect(accounts[0]).deposit(tetherToken.address, 100)
    ).to.be.revertedWith("Amount not approved");
  });
});
