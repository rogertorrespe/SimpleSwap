// test/SimpleSwap.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleSwap", function () {
  let SimpleSwap, TestToken, simpleSwap, tokenA, tokenB, owner, addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    // Desplegar tokens
    TestToken = await ethers.getContractFactory("TestToken");
    tokenA = await TestToken.deploy("NuevoTokenA", "NTA");
    tokenB = await TestToken.deploy("NuevoTokenB", "NTB");

    // Desplegar SimpleSwap
    SimpleSwap = await ethers.getContractFactory("SimpleSwap");
    simpleSwap = await SimpleSwap.deploy(tokenA.address, tokenB.address);

    // Aprobar tokens y añadir liquidez inicial
    await tokenA.approve(simpleSwap.address, ethers.parseUnits("10000", 18));
    await tokenB.approve(simpleSwap.address, ethers.parseUnits("10000", 18));
    await simpleSwap.addLiquidity(
      tokenA.address,
      tokenB.address,
      ethers.parseUnits("1000", 18),
      ethers.parseUnits("1000", 18),
      0,
      0,
      owner.address,
      Math.floor(Date.now() / 1000) + 60 * 20
    );
  });

  it("Debería añadir liquidez correctamente", async function () {
    const liquidityBalance = await simpleSwap.liquidityBalance(owner.address);
    expect(liquidityBalance).to.be.gt(0);
    expect(await simpleSwap.reserveA()).to.equal(ethers.parseUnits("1000", 18));
    expect(await simpleSwap.reserveB()).to.equal(ethers.parseUnits("1000", 18));
  });

  it("Debería retirar liquidez correctamente", async function () {
    const liquidity = await simpleSwap.liquidityBalance(owner.address);
    await simpleSwap.removeLiquidity(
      tokenA.address,
      tokenB.address,
      liquidity,
      0,
      0,
      owner.address,
      Math.floor(Date.now() / 1000) + 60 * 20
    );
    expect(await simpleSwap.liquidityBalance(owner.address)).to.equal(0);
    expect(await simpleSwap.reserveA()).to.equal(0);
    expect(await simpleSwap.reserveB()).to.equal(0);
  });

  it("Debería realizar un swap correctamente", async function () {
    await tokenA.approve(simpleSwap.address, ethers.parseUnits("100", 18));
    const amountIn = ethers.parseUnits("100", 18);
    const path = [tokenA.address, tokenB.address];
    await simpleSwap.swapExactTokensForTokens(
      amountIn,
      0,
      path,
      owner.address,
      Math.floor(Date.now() / 1000) + 60 * 20
    );
    expect(await tokenB.balanceOf(owner.address)).to.be.gt(ethers.parseUnits("900", 18));
  });

  it("Debería devolver el precio correcto", async function () {
    const price = await simpleSwap.getPrice(tokenA.address, tokenB.address);
    expect(price).to.equal(ethers.parseUnits("1", 18)); // 1 NTA = 1 NTB
  });

  it("Debería calcular amountOut correctamente", async function () {
    const amountIn = ethers.parseUnits("100", 18);
    const amountOut = await simpleSwap.getAmountOut(
      amountIn,
      ethers.parseUnits("1000", 18),
      ethers.parseUnits("1000", 18)
    );
    expect(amountOut).to.be.gt(0);
  });
});