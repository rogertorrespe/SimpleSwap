// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

interface ISimpleSwap {
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB, uint256 liquidity);

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB);

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external;

    function getPrice(address tokenA, address tokenB) external view returns (uint256 price);
    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) external view returns (uint256);
}

contract SwapVerifier {
    string[] public authors;

    function verify(
        address swapContract,
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB,
        uint256 amountIn,
        string memory author
    ) external {
        require(amountA > 0 && amountB > 0, "Invalid liquidity amounts");
        require(amountIn > 0 && amountIn <= amountA, "Invalid swap amount");
        require(IERC20(tokenA).balanceOf(address(this)) >= amountA, "Insufficient token A supply for this contact");
        require(IERC20(tokenB).balanceOf(address(this)) >= amountB, "Insufficient token B supply for this contact");

        IERC20(tokenA).approve(swapContract, amountA);
        IERC20(tokenB).approve(swapContract, amountB);

        (uint256 aAdded, uint256 bAdded, uint256 liquidity) = ISimpleSwap(swapContract)
            .addLiquidity(tokenA, tokenB, amountA, amountB, amountA, amountB, address(this), block.timestamp + 1);
        require(aAdded == amountA && bAdded == amountB, "addLiquidity amounts mismatch");
        require(liquidity > 0, "addLiquidity returned zero liquidity");

        uint256 price = ISimpleSwap(swapContract).getPrice(tokenA, tokenB);
        require(price == (bAdded * 1e18) / aAdded, "getPrice incorrect");

        uint256 expectedOut = ISimpleSwap(swapContract).getAmountOut(amountIn, aAdded, bAdded);
        IERC20(tokenA).approve(swapContract, amountIn);
        address[] memory path = new address[](2);
        path[0] = tokenA;
        path[1] = tokenB;
        ISimpleSwap(swapContract).swapExactTokensForTokens(amountIn, expectedOut, path, address(this), block.timestamp + 1);
        require(IERC20(tokenB).balanceOf(address(this)) >= expectedOut, "swapExactTokensForTokens failed");

        (uint256 aOut, uint256 bOut) = ISimpleSwap(swapContract)
            .removeLiquidity(tokenA, tokenB, liquidity, 0, 0, address(this), block.timestamp + 1);
        require(aOut + bOut > 0, "removeLiquidity returned zero tokens");

        authors.push(author);
    }
}
