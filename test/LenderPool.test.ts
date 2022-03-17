import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Token, LenderPool } from "../typechain";

describe("LenderPool", function () {
  let accounts: SignerWithAddress[];
  let addresses: string[];
  let lenderPool: LenderPool;
  let token: Token;

  before(async () => {
    accounts = await ethers.getSigners();
    addresses = accounts.map((account: SignerWithAddress) => account.address);
    const Token = await ethers.getContractFactory("Token");
    token = await Token.deploy("Tether", "USDC", 6);
    await token.deployed();
    const LenderPool = await ethers.getContractFactory("LenderPool");
    lenderPool = await LenderPool.deploy(token.address);
    await lenderPool.deployed();
  });

  it("Should deploy contracts successfully", async function () {
    expect(
      await ethers.provider.getCode(lenderPool.address)
    ).to.be.length.above(10);
    expect(await ethers.provider.getCode(token.address)).to.be.length.above(10);
  });

  it("should approve token", async function () {
    await token.connect(accounts[0]).approve(lenderPool.address, 100);
    expect(
      ethers.BigNumber.from("100").eq(
        await token.allowance(addresses[0], lenderPool.address)
      )
    );
  });

  it("balance of user should be zero initially", async function () {
    expect(await lenderPool.getBalance(addresses[0])).to.be.equal(0);
  });

  it("amount should be deposited after approval", async function () {
    await lenderPool.connect(accounts[0]).deposit(100);
    expect(
      ethers.BigNumber.from("100").eq(await token.balanceOf(lenderPool.address))
    );
  });

  it("balance of user should be increase after deposit", async function () {
    expect(await lenderPool.getBalance(addresses[0])).to.be.equal(100);
  });

  it("deposit should return if allowance is less than lending amount", async function () {
    expect(lenderPool.connect(accounts[0]).deposit(100)).to.be.revertedWith(
      "Amount not approved"
    );
  });

  it("deposit should return if amount is zero", async function () {
    expect(lenderPool.connect(accounts[0]).deposit(0)).to.be.revertedWith(
      "Lending amount invalid"
    );
  });
});
