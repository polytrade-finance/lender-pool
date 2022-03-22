import { ethers } from "hardhat";
import { BigNumber, utils } from "ethers";

export const ONE_DAY = 24 * 60 * 60;

export function n6(amount: string): BigNumber {
  return utils.parseUnits(amount, "6");
}

export async function increaseTime(duration: number) {
  await ethers.provider.send("evm_increaseTime", [duration]);
  await ethers.provider.send("evm_mine", []);
}
