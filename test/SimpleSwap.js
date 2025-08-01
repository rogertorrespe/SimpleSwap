const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleSwap", function () {
  let simpleSwap, tokenA, tokenB, owner, addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("TestToken");
    tokenA = await Token.deploy("Token A", "TKA");
    tokenB = await Token.deploy("Token B", "TKB");
    const SimpleSwap = await ethers.getContractFactory("SimpleSwap");
    simpleSwap = await SimpleSwap.deploy(tokenA.target, tokenB.target);
    await tokenA.mint(owner.address, ethers.parseEther("10000"));
    await tokenB.mint(owner.address, ethers.parseEther("10000"));
  });

  it("should add initial liquidity correctly", async function () {
    await tokenA.approve(simpleSwap.target, ethers.parseEther("1000"));
    await tokenB.approve(simpleSwap.target, ethers.parseEther("1000"));
    const deadline = Math.floor(Date.now() / 1000) + 600;
    const amountA = ethers.parseEther("1000");
    const amountB = ethers.parseEther("1000");
    const amountProduct = ethers.BigNumber.from(amountA).mul(amountB);
    const sqrtAmount = await simpleSwap.sqrt(amountProduct);
    const expectedLiquidity = sqrtAmount.sub(1000);

    const tx = await simpleSwap.addLiquidity(
      tokenA.target,
      tokenB.target,
      amountA,
      amountB,
      0,
      0,
      owner.address,
      deadline
    );

    await expect(tx)
      .to.emit(simpleSwap, "LiquidityAdded")
      .withArgs(owner.address, owner.address, amountA, amountB, expectedLiquidity);

    expect(await simpleSwap.reserveA()).to.equal(amountA);
    expect(await simpleSwap.reserveB()).to.equal(amountB);
    expect(await simpleSwap.liquidityBalance(owner.address)).to.equal(expectedLiquidity);
  });

  it("should swap tokens correctly (tokenA to tokenB)", async function () {
    await tokenA.approve(simpleSwap.target, ethers.parseEther("1000"));
    await tokenB.approve(simpleSwap.target, ethers.parseEther("1000"));
    const deadline = Math.floor(Date.now() / 1000) + 600;
    await simpleSwap.addLiquidity(
      tokenA.target,
      tokenB.target,
      ethers.parseEther("1000"),
      ethers.parseEther("1000"),
      0,
      0,
      owner.address,
      deadline
    );

    await tokenA.approve(simpleSwap.target, ethers.parseEther("100"));
    const path = [tokenA.target, tokenB.target];
    const amountIn = ethers.parseEther("100");
    const amountOutMin = 0;
    const amountOut = await simpleSwap.getAmountOut(
      amountIn,
      ethers.parseEther("1000"),
      ethers.parseEther("1000")
    );

    const tx = await simpleSwap.swapExactTokensForTokens(
      amountIn,
      amountOutMin,
      path,
      owner.address,
      deadline
    );

    await expect(tx)
      .to.emit(simpleSwap, "Swap")
      .withArgs(owner.address, tokenA.target, tokenB.target, amountIn, amountOut);

    expect(await simpleSwap.reserveA()).to.be.gt(ethers.parseEther("1000"));
    expect(await simpleSwap.reserveB()).to.be.lt(ethers.parseEther("1000"));
  });

  it("should swap tokens correctly (tokenB to tokenA)", async function () {
    await tokenA.approve(simpleSwap.target, ethers.parseEther("1000"));
    await tokenB.approve(simpleSwap.target, ethers.parseEther("1000"));
    const deadline = Math.floor(Date.now() / 1000) + 600;
    await simpleSwap.addLiquidity(
      tokenA.target,
      tokenB.target,
      ethers.parseEther("1000"),
      ethers.parseEther("1000"),
      0,
      0,
      owner.address,
      deadline
    );

    await tokenB.approve(simpleSwap.target, ethers.parseEther("100"));
    const path = [tokenB.target, tokenA.target];
    const amountIn = ethers.parseEther("100");
    const amountOutMin = 0;
    const amountOut = await simpleSwap.getAmountOut(
      amountIn,
      ethers.parseEther("1000"),
      ethers.parseEther("1000")
    );

    const tx = await simpleSwap.swapExactTokensForTokens(
      amountIn,
      amountOutMin,
      path,
      owner.address,
      deadline
    );

    await expect(tx)
      .to.emit(simpleSwap, "Swap")
      .withArgs(owner.address, tokenB.target, tokenA.target, amountIn, amountOut);

    expect(await simpleSwap.reserveB()).to.be.gt(ethers.parseEther("1000"));
    expect(await simpleSwap.reserveA()).to.be.lt(ethers.parseEther("1000"));
  });

  it("should remove liquidity correctly", async function () {
    await tokenA.approve(simpleSwap.target, ethers.parseEther("1000"));
    await tokenB.approve(simpleSwap.target, ethers.parseEther("1000"));
    const deadline = Math.floor(Date.now() / 1000) + 600;
    await simpleSwap.addLiquidity(
      tokenA.target,
      tokenB.target,
      ethers.parseEther("1000"),
      ethers.parseEther("1000"),
      0,
      0,
      owner.address,
      deadline
    );

    const initialLiquidity = await simpleSwap.liquidityBalance(owner.address);
    expect(initialLiquidity).to.be.gt(0);

    const tx = await simpleSwap.removeLiquidity(
      tokenA.target,
      tokenB.target,
      initialLiquidity,
      0,
      0,
      owner.address,
      deadline
    );

    await expect(tx)
      .to.emit(simpleSwap, "LiquidityRemoved")
      .withArgs(owner.address, owner.address, ethers.parseEther("1000"), ethers.parseEther("1000"), initialLiquidity);

    expect(await simpleSwap.liquidityBalance(owner.address)).to.equal(0);
  });

  it("should get correct price", async function () {
    await tokenA.approve(simpleSwap.target, ethers.parseEther("1000"));
    await tokenB.approve(simpleSwap.target, ethers.parseEther("1000"));
    const deadline = Math.floor(Date.now() / 1000) + 600;
    await simpleSwap.addLiquidity(
      tokenA.target,
      tokenB.target,
      ethers.parseEther("1000"),
      ethers.parseEther("1000"),
      0,
      0,
      owner.address,
      deadline
    );

    const price = await simpleSwap.getPrice(tokenA.target, tokenB.target);
    expect(price).to.equal(ethers.parseEther("1"));
  });

  it("should revert for invalid token pair", async function () {
    const deadline = Math.floor(Date.now() / 1000) + 600;
    await expect(
      simpleSwap.addLiquidity(
        addr1.address,
        tokenB.target,
        ethers.parseEther("100"),
        ethers.parseEther("100"),
        0,
        0,
        owner.address,
        deadline
      )
    ).to.be.revertedWith("SS: ITP");
  });

  it("should calculate correct output amount", async function () {
    const amountOut = await simpleSwap.getAmountOut(
      ethers.parseEther("100"),
      ethers.parseEther("1000"),
      ethers.parseEther("1000")
    );
    expect(amountOut).to.equal(ethers.parseEther("90.909090909090909090"));
  });

  it("should revert when adding liquidity with invalid amounts", async function () {
    const deadline = Math.floor(Date.now() / 1000) + 600;
    await tokenA.approve(simpleSwap.target, ethers.parseEther("1000"));
    await tokenB.approve(simpleSwap.target, ethers.parseEther("1000"));
    await simpleSwap.addLiquidity(
      tokenA.target,
      tokenB.target,
      ethers.parseEther("1000"),
      ethers.parseEther("1000"),
      0,
      0,
      owner.address,
      deadline
    );

    await tokenA.approve(simpleSwap.target, ethers.parseEther("1000"));
    await tokenB.approve(simpleSwap.target, ethers.parseEther("500"));
    await expect(
      simpleSwap.addLiquidity(
        tokenA.target,
        tokenB.target,
        ethers.parseEther("1000"),
        ethers.parseEther("500"),
        ethers.parseEther("1000"),
        ethers.parseEther("600"),
        owner.address,
        deadline
      )
    ).to.be.revertedWith("SS: IBA");
  });

  it("should add liquidity correctly with existing reserves", async function () {
    await tokenA.approve(simpleSwap.target, ethers.parseEther("1000"));
    await tokenB.approve(simpleSwap.target, ethers.parseEther("1000"));
    const deadline = Math.floor(Date.now() / 1000) + 600;
    await simpleSwap.addLiquidity(
      tokenA.target,
      tokenB.target,
      ethers.parseEther("1000"),
      ethers.parseEther("1000"),
      0,
      0,
      owner.address,
      deadline
    );

    const initialLiquidity = await simpleSwap.liquidityBalance(owner.address);
    await tokenA.approve(simpleSwap.target, ethers.parseEther("500"));
    await tokenB.approve(simpleSwap.target, ethers.parseEther("500"));
    const amountA1 = ethers.parseEther("500");
    const amountB1 = ethers.parseEther("500");
    const totalLiquidity1 = await simpleSwap.totalLiquidity();
    const expectedLiquidity1 = ethers.BigNumber.from(amountA1).mul(totalLiquidity1).div(ethers.parseEther("1000"));

    const tx1 = await simpleSwap.addLiquidity(
      tokenA.target,
      tokenB.target,
      amountA1,
      amountB1,
      ethers.parseEther("400"),
      ethers.parseEther("400"),
      owner.address,
      deadline
    );

    await expect(tx1)
      .to.emit(simpleSwap, "LiquidityAdded")
      .withArgs(owner.address, owner.address, amountA1, amountB1, expectedLiquidity1);

    await tokenA.approve(simpleSwap.target, ethers.parseEther("500"));
    await tokenB.approve(simpleSwap.target, ethers.parseEther("1000"));
    const amountA2 = ethers.parseEther("500");
    const amountB2 = ethers.parseEther("1000");
    const totalLiquidity2 = await simpleSwap.totalLiquidity();
    const expectedLiquidity2 = ethers.BigNumber.from(amountA2).mul(totalLiquidity2).div(ethers.parseEther("1500"));

    const tx2 = await simpleSwap.addLiquidity(
      tokenA.target,
      tokenB.target,
      amountA2,
      amountB2,
      ethers.parseEther("400"),
      ethers.parseEther("400"),
      owner.address,
      deadline
    );

    await expect(tx2)
      .to.emit(simpleSwap, "LiquidityAdded")
      .withArgs(owner.address, owner.address, amountA2, amountB2, expectedLiquidity2);
  });

  it("should handle edge cases correctly", async function () {
    const deadline = Math.floor(Date.now() / 1000) + 600;
    await tokenA.approve(simpleSwap.target, ethers.parseEther("1000"));
    await tokenB.approve(simpleSwap.target, ethers.parseEther("1000"));
    await expect(
      simpleSwap.addLiquidity(
        tokenA.target,
        tokenB.target,
        ethers.parseEther("1000"),
        ethers.parseEther("1000"),
        0,
        0,
        owner.address,
        Math.floor(Date.now() / 1000) - 1
      )
    ).to.be.revertedWith("SS: EXP");

    await expect(
      simpleSwap.swapExactTokensForTokens(
        ethers.parseEther("100"),
        0,
        [tokenA.target, tokenB.target],
        owner.address,
        deadline
      )
    ).to.be.revertedWith("SS: IL");

    await simpleSwap.addLiquidity(
      tokenA.target,
      tokenB.target,
      ethers.parseEther("1000"),
      ethers.parseEther("1000"),
      0,
      0,
      owner.address,
      deadline
    );
    await tokenA.approve(simpleSwap.target, ethers.parseUnits("1", 9));
    await expect(
      simpleSwap.swapExactTokensForTokens(
        ethers.parseUnits("1", 9),
        0,
        [tokenA.target, tokenB.target],
        owner.address,
        deadline
      )
    ).to.not.be.reverted;
  });
});