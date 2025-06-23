// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title IERC20
/// @notice Minimal interface for ERC-20 tokens used in SimpleSwap
interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

/// @title SimpleSwap
/// @notice A simplified Uniswap-like AMM for a single ERC-20 token pair
/// @dev Implements constant product formula (x * y = k) with 0.3% fee. Supports one token pair only.
contract SimpleSwap {
    // Token pair addresses
    address public immutable tokenA;
    address public immutable tokenB;
    
    // Reserves for each token
    uint256 public reserveA;
    uint256 public reserveB;
    
    // Total supply of liquidity tokens
    uint256 public totalLiquidity;
    
    // Mapping of liquidity provider balances
    mapping(address => uint256) public liquidityBalance;
    
    // Minimum liquidity to prevent dust attacks
    uint256 private constant MINIMUM_LIQUIDITY = 1000;
    
    // Events
    event LiquidityAdded(address indexed provider, address indexed to, uint256 amountA, uint256 amountB, uint256 liquidity);
    event LiquidityRemoved(address indexed provider, address indexed to, uint256 amountA, uint256 amountB, uint256 liquidity);
    event Swap(address indexed user, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut);

    /// @notice Constructor to initialize token pair
    /// @param _tokenA Address of first token
    /// @param _tokenB Address of second token
    constructor(address _tokenA, address _tokenB) {
        tokenA = _tokenA;
        tokenB = _tokenB;
    }

    /// @notice Adds liquidity to the pool for the specified token pair
    /// @dev Calculates liquidity tokens based on constant product formula and updates reserves
    /// @param _tokenA Address of the first token
    /// @param _tokenB Address of the second token
    /// @param amountADesired Desired amount of tokenA to add
    /// @param amountBDesired Desired amount of tokenB to add
    /// @param amountAMin Minimum amount of tokenA to add
    /// @param amountBMin Minimum amount of tokenB to add
    /// @param to Address to receive liquidity tokens
    /// @param deadline Transaction deadline timestamp
    /// @return amountA Actual amount of tokenA added
    /// @return amountB Actual amount of tokenB added
    /// @return liquidity Amount of liquidity tokens minted
    function addLiquidity(
        address _tokenA,
        address _tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        require(deadline >= block.timestamp, "SimpleSwap: EXPIRED");
        require(_tokenA == tokenA && _tokenB == tokenB, "SimpleSwap: INVALID_TOKEN_PAIR");
        
        (amountA, amountB) = _calculateLiquidity(amountADesired, amountBDesired, amountAMin, amountBMin);
        
        // Transfer tokens to contract
        IERC20(tokenA).transferFrom(msg.sender, address(this), amountA);
        IERC20(tokenB).transferFrom(msg.sender, address(this), amountB);
        
        // Calculate liquidity tokens to mint
        if (totalLiquidity == 0) {
            liquidity = sqrt(amountA * amountB) - MINIMUM_LIQUIDITY;
            liquidityBalance[address(0)] = MINIMUM_LIQUIDITY; // Lock minimum liquidity
        } else {
            liquidity = amountA * totalLiquidity / reserveA < amountB * totalLiquidity / reserveB
                ? amountA * totalLiquidity / reserveA
                : amountB * totalLiquidity / reserveB;
        }
        
        require(liquidity > 0, "SimpleSwap: INSUFFICIENT_LIQUIDITY_MINTED");
        
        // Update reserves and liquidity
        reserveA += amountA;
        reserveB += amountB;
        totalLiquidity += liquidity;
        liquidityBalance[to] += liquidity;
        
        emit LiquidityAdded(msg.sender, to, amountA, amountB, liquidity);
    }

    /// @notice Removes liquidity from the pool
    /// @dev Burns liquidity tokens and returns proportional token amounts
    /// @param _tokenA Address of the first token
    /// @param _tokenB Address of the second token
    /// @param liquidity Amount of liquidity tokens to burn
    /// @param amountAMin Minimum amount of tokenA to receive
    /// @param amountBMin Minimum amount of tokenB to receive
    /// @param to Address to receive tokens
    /// @param deadline Transaction deadline timestamp
    /// @return amountA Amount of tokenA received
    /// @return amountB Amount of tokenB received
    function removeLiquidity(
        address _tokenA,
        address _tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB) {
        require(deadline >= block.timestamp, "SimpleSwap: EXPIRED");
        require(_tokenA == tokenA && _tokenB == tokenB, "SimpleSwap: INVALID_TOKEN_PAIR");
        require(liquidityBalance[msg.sender] >= liquidity, "SimpleSwap: INSUFFICIENT_LIQUIDITY");
        
        // Calculate amounts to return
        amountA = (liquidity * reserveA) / totalLiquidity;
        amountB = (liquidity * reserveB) / totalLiquidity;
        
        require(amountA >= amountAMin, "SimpleSwap: INSUFFICIENT_A_AMOUNT");
        require(amountB >= amountBMin, "SimpleSwap: INSUFFICIENT_B_AMOUNT");
        
        // Update reserves and liquidity
        reserveA -= amountA;
        reserveB -= amountB;
        totalLiquidity -= liquidity;
        liquidityBalance[msg.sender] -= liquidity;
        
        // Transfer tokens
        IERC20(tokenA).transfer(to, amountA);
        IERC20(tokenB).transfer(to, amountB);
        
        emit LiquidityRemoved(msg.sender, to, amountA, amountB, liquidity);
    }

    /// @notice Swaps exact amount of input tokens for output tokens
    /// @dev Applies 0.3% fee and updates reserves
    /// @param amountIn Amount of input tokens
    /// @param amountOutMin Minimum amount of output tokens to receive
    /// @param path Array of token addresses (input token, output token)
    /// @param to Address to receive output tokens
    /// @param deadline Transaction deadline timestamp
    /// @return amounts Array containing input and output amounts
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        require(deadline >= block.timestamp, "SimpleSwap: EXPIRED");
        require(path.length == 2, "SimpleSwap: INVALID_PATH");
        require(
            (path[0] == tokenA && path[1] == tokenB) || (path[0] == tokenB && path[1] == tokenA),
            "SimpleSwap: INVALID_TOKEN_PAIR"
        );
        
        amounts = new uint256[](2);
        amounts[0] = amountIn;
        
        (uint256 reserveIn, uint256 reserveOut) = path[0] == tokenA ? (reserveA, reserveB) : (reserveB, reserveA);
        amounts[1] = getAmountOut(amountIn, reserveIn, reserveOut);
        
        require(amounts[1] >= amountOutMin, "SimpleSwap: INSUFFICIENT_OUTPUT_AMOUNT");
        
        // Update reserves
        if (path[0] == tokenA) {
            reserveA += amountIn;
            reserveB -= amounts[1];
        } else {
            reserveB += amountIn;
            reserveA -= amounts[1];
        }
        
        // Transfer tokens
        IERC20(path[0]).transferFrom(msg.sender, address(this), amounts[0]);
        IERC20(path[1]).transfer(to, amounts[1]);
        
        emit Swap(msg.sender, path[0], path[1], amounts[0], amounts[1]);
    }

    /// @notice Gets the price of tokenA in terms of tokenB
    /// @dev Returns reserveB / reserveA with 1e18 precision
    /// @param _tokenA Address of the first token
    /// @param _tokenB Address of the second token
    /// @return price Price of tokenA in terms of tokenB
    function getPrice(address _tokenA, address _tokenB) external view returns (uint256 price) {
        require(_tokenA == tokenA && _tokenB == tokenB, "SimpleSwap: INVALID_TOKEN_PAIR");
        require(reserveA > 0 && reserveB > 0, "SimpleSwap: NO_LIQUIDITY");
        price = (reserveB * 1e18) / reserveA;
    }

    /// @notice Calculates amount of output tokens for given input
    /// @dev Applies 0.3% fee using constant product formula
    /// @param amountIn Amount of input tokens
    /// @param reserveIn Input token reserve
    /// @param reserveOut Output token reserve
    /// @return amountOut Amount of output tokens
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure returns (uint256 amountOut) {
        require(amountIn > 0, "SimpleSwap: INSUFFICIENT_INPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "SimpleSwap: INSUFFICIENT_LIQUIDITY");
        
        uint256 amountInWithFee = amountIn * 997; // 0.3% fee
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 1000) + amountInWithFee;
        amountOut = numerator / denominator;
    }

    /// @dev Calculates optimal token amounts for liquidity addition
    /// @param amountADesired Desired amount of tokenA
    /// @param amountBDesired Desired amount of tokenB
    /// @param amountAMin Minimum amount of tokenA
    /// @param amountBMin Minimum amount of tokenB
    /// @return amountA Actual amount of tokenA
    /// @return amountB Actual amount of tokenB
    function _calculateLiquidity(
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) private view returns (uint256 amountA, uint256 amountB) {
        if (reserveA == 0 && reserveB == 0) {
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            amountB = (amountADesired * reserveB) / reserveA;
            if (amountB <= amountBDesired) {
                require(amountB >= amountBMin, "SimpleSwap: INSUFFICIENT_B_AMOUNT");
                amountA = amountADesired;
            } else {
                amountA = (amountBDesired * reserveA) / reserveB;
                require(amountA >= amountAMin, "SimpleSwap: INSUFFICIENT_A_AMOUNT");
                amountB = amountBDesired;
            }
        }
    }

    /// @dev Calculates square root for initial liquidity minting
    /// @param y Input number
    /// @return z Square root of y
    function sqrt(uint256 y) private pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}
