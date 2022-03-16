import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { TetherToken } from "../typechain";

describe("TetherToken", function () {
  let accounts: SignerWithAddress[];
  let addresses: string[];

  before(async () => {
    accounts = await ethers.getSigners();
    addresses = accounts.map((account: SignerWithAddress) => account.address);
  });

  it("Should deploy Tether Token successfully", async function () {
    const TetherToken = await ethers.getContractFactory("TetherToken");
    const tetherToken: TetherToken = await TetherToken.deploy();
    await tetherToken.deployed();

    expect(
      await ethers.provider.getCode(tetherToken.address)
    ).to.be.length.above(10);

    expect(
      ethers.BigNumber.from("1000000000000000000000").eq(
        await tetherToken.connect(accounts[0]).balanceOf(addresses[0])
      )
    ).to.be.true;
  });
});
