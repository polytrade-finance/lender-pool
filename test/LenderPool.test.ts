import { expect } from "chai";
import { ethers } from "hardhat";

describe("LenderPool", function () {
  it("Should return the new greeting once it's changed", async function () {
    const LenderPool = await ethers.getContractFactory("LenderPool");
    const lenderPool = await LenderPool.deploy();
    await lenderPool.deployed();

    expect(
      await ethers.provider.getCode(lenderPool.address)
    ).to.be.length.above(0);
  });
});
