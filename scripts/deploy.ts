// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import {
  IERC20,
  LenderPool,
  MockProtocol,
  MockStrategy,
  RedeemPool,
  Reward,
  RewardManager,
  Token,
  Verification,
} from "../typechain";
import { n6 } from "../test/helpers";
let USDC: IERC20;
let tUSDC: Token;
let trade: Token;
let redeemPool: RedeemPool;
let stableReward: Reward;
let tradeReward: Reward;
let rewardManager: RewardManager;
let verification: Verification;
let lenderPool: LenderPool;
let strategy: MockStrategy;
let protocol: MockProtocol;

const USDCAddress = "0xbEc686095Cfad43B741FA0ED305200100986CEf1";
const tUSDCAddress = "0xecb4e60166B1A7a6Fd815F75A0e7c243bB45D540";
const treasuryAddres = "0xD41C5bBDDDB6C9BFb341F4D2D1045e45D5DF4A89";

async function main() {
  const [deployer] = await ethers.getSigners();
  const TokenContract = await ethers.getContractFactory("Token");

  USDC = await ethers.getContractAt("IERC20", USDCAddress);
  console.log(`USDC: ${USDC.address}`);

  tUSDC = await ethers.getContractAt("Token", tUSDCAddress);
  console.log(`tUSDC: ${tUSDC.address}`);

  trade = await TokenContract.deploy("Polytrade", "TRADE", 18);
  console.log(`trade: ${trade.address}`);

  const RedeemPoolContract = await ethers.getContractFactory("RedeemPool");
  redeemPool = await RedeemPoolContract.deploy(USDC.address, tUSDC.address);
  console.log(`redeemPool: ${redeemPool.address}`);

  const RewardContract = await ethers.getContractFactory("Reward");
  stableReward = await RewardContract.deploy(USDC.address);
  console.log(`StableReward: ${stableReward.address}`);
  tradeReward = await RewardContract.deploy(trade.address);
  console.log(`TradeReward: ${tradeReward.address}`);

  const RewardManagerContract = await ethers.getContractFactory(
    "RewardManager"
  );

  rewardManager = await RewardManagerContract.deploy(
    stableReward.address,
    tradeReward.address,
    ethers.constants.AddressZero
  );
  console.log(`RewardManager: ${rewardManager.address}`);

  const LenderPoolContract = await ethers.getContractFactory("LenderPool");
  lenderPool = await LenderPoolContract.deploy(
    USDC.address,
    tUSDC.address,
    redeemPool.address,
    treasuryAddres,
    rewardManager.address
  );

  console.log(`lenderPool: ${lenderPool.address}`);

  await rewardManager["startRewardManager(address)"](lenderPool.address);

  console.log("RewardManager started at:", rewardManager.address);

  const VerificationContract = await ethers.getContractFactory("Verification");
  verification = await VerificationContract.deploy(lenderPool.address);
  console.log(`verification: ${verification.address}`);

  const Protocol = await ethers.getContractFactory("MockProtocol");
  protocol = await Protocol.deploy(USDCAddress);
  await protocol.deployed();
  console.log(`protocol: ${protocol.address}`);

  const StrategyContract = await ethers.getContractFactory("MockStrategy");
  strategy = await StrategyContract.deploy(USDC.address, protocol.address);
  await strategy.deployed();
  console.log(`strategy: ${strategy.address}`);

  await stableReward
    .grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("REWARD_MANAGER")),
      rewardManager.address
    )
    .then((tx) => tx.wait(1));
  console.log("1");

  await stableReward
    .grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("OWNER")),
      deployer.address
    )
    .then((tx) => tx.wait(1));
  console.log("2");

  await tradeReward
    .grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("REWARD_MANAGER")),
      rewardManager.address
    )
    .then((tx) => tx.wait(1));
  console.log("3");

  await tradeReward
    .grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("OWNER")),
      deployer.address
    )
    .then((tx) => tx.wait(1));
  console.log("4");

  await strategy
    .grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LENDER_POOL")),
      lenderPool.address
    )
    .then((tx) => tx.wait(1));
  console.log("5");

  await redeemPool
    .grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LENDER_POOL")),
      lenderPool.address
    )
    .then((tx) => tx.wait(1));
  console.log("6");

  await redeemPool
    .grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("OWNER")),
      deployer.address
    )
    .then((tx) => tx.wait(1));
  console.log("7");

  await tUSDC
    .grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINTER_ROLE")),
      lenderPool.address
    )
    .then((tx) => tx.wait(1));
  console.log("8");

  await lenderPool.switchVerification(verification.address);
  console.log("Verification switched");

  await verification.updateValidationLimit(n6("100"));
  console.log("Validation switched");

  await lenderPool.switchStrategy(strategy.address);
  console.log("Strategy switched");

  console.log("stable reward: 10%");
  await stableReward.setReward(1000);

  await tradeReward.setReward(100);
  console.log("trade reward: 1");

  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  // const Greeter = await ethers.getContractFactory("Greeter");
  // const greeter = await Greeter.deploy("Hello, Hardhat!");
  //
  // await greeter.deployed();
  //
  // console.log("Greeter deployed to:", greeter.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
