import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Token, LenderPool } from "../typechain";

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
    expect(await ethers.provider.getCode(stable.address)).to.be.length.above(10);
  });

  it("should approve stable token", async function () {
    await stable.connect(accounts[0]).approve(lenderPool.address, 100);
    expect(
      ethers.BigNumber.from("100").eq(
        await stable.allowance(addresses[0], lenderPool.address)
      )
    );
  });

  it("should transfer tStable to lender pool", async function () {
    await tStable
      .connect(accounts[0])
      .transfer(lenderPool.address, 100 * 10 ** 6);
    expect(
      (await tStable.balanceOf(lenderPool.address)).eq(
        ethers.utils.parseUnits("100", 6)
      )
    );
  });

  it("should check balance of user is zero", async function () {
    expect(await lenderPool.getDeposit(addresses[0])).to.be.equal(0);
  });

  it("should deposit stable token successfully", async function () {
    await lenderPool.connect(accounts[0]).deposit(100);
    expect(
      ethers.BigNumber.from("100").eq(await stable.balanceOf(lenderPool.address))
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
    expect(balanceAfter.sub(balanceBefore).eq(ethers.BigNumber.from("1")));
  });

  it("should claim all tStable successfully", async function () {
    const balanceBefore = await tStable.balanceOf(addresses[0]);
    await lenderPool.connect(accounts[0]).withdrawAllTStable();
    const balanceAfter = await tStable.balanceOf(addresses[0]);
    expect(balanceAfter.sub(balanceBefore).eq(ethers.BigNumber.from("99")));
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
