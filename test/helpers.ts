import { ethers } from "hardhat";
import { BigNumber, utils } from "ethers";

export const ONE_DAY = 24 * 60 * 60;

export function n6(amount: string): BigNumber {
  return utils.parseUnits(amount, "6");
}

export function f6(amount: BigNumber): string {
  return utils.formatUnits(amount, "6");
}

export async function increaseTime(duration: number) {
  await ethers.provider.send("evm_increaseTime", [duration]);
  await ethers.provider.send("evm_mine", []);
}

export async function setNextBlockTimestamp(time: number) {
  await ethers.provider.send("evm_setNextBlockTimestamp", [time]);
  await ethers.provider.send("evm_mine", []);
}

export async function now() {
  return (
    await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
  ).timestamp;
}
