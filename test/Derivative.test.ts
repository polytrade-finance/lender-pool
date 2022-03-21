import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Derivative } from "../typechain";

describe("Token", function () {
  let accounts: SignerWithAddress[];
  let addresses: string[];

  before(async () => {
    accounts = await ethers.getSigners();
    addresses = accounts.map((account: SignerWithAddress) => account.address);
  });

  it("should deploy Token successfully", async function () {
    const Token = await ethers.getContractFactory("Derivative");
    const token: Derivative = await Token.deploy(
      "Tether derivative",
      "TUSDT",
      6
    );
    await token.deployed();

    expect(await ethers.provider.getCode(token.address)).to.be.length.above(10);

    expect(await token.decimals()).to.be.equal(6);

    expect(
      ethers.utils
        .parseUnits("1000000000", "6")
        .eq(await token.connect(accounts[0]).balanceOf(addresses[0]))
    );
  });
});
