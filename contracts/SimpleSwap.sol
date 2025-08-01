// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IERC20
/// @notice Interfaz mínima para tokens ERC-20 usados en SimpleSwap
interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

/// @title SimpleSwap
/// @notice Un AMM simplificado similar a Uniswap V2 para un par de tokens ERC-20
/// @dev Implementa la fórmula de producto constante (x * y = k) sin comisiones. Soporta un solo par de tokens.
contract SimpleSwap {
    // Dirección de los tokens del par
    address public immutable tokenA;
    address public immutable tokenB;
    
    // Reservas de cada token
    uint256 public reserveA;
    uint256 public reserveB;
    
    // Suministro total de tokens de liquidez
    uint256 public totalLiquidity;
    
    // Balances de liquidez por proveedor
    mapping(address => uint256) public liquidityBalance;
    
    // Liquidez mínima para prevenir ataques de polvo
    uint256 private constant MINIMUM_LIQUIDITY = 1000;
    
    /// @notice Emitido cuando se añade liquidez al pool
    /// @param provider Dirección que proporciona la liquidez
    /// @param to Dirección que recibe los tokens de liquidez
    /// @param amountA Cantidad de tokenA añadida
    /// @param amountB Cantidad de tokenB añadida
    /// @param liquidity Cantidad de tokens de liquidez emitidos
    event LiquidityAdded(address indexed provider, address indexed to, uint256 amountA, uint256 amountB, uint256 liquidity);
    
    /// @notice Emitido cuando se remueve liquidez del pool
    /// @param provider Dirección que remueve la liquidez
    /// @param to Dirección que recibe los tokens
    /// @param amountA Cantidad de tokenA devuelta
    /// @param amountB Cantidad de tokenB devuelta
    /// @param liquidity Cantidad de tokens de liquidez quemados
    event LiquidityRemoved(address indexed provider, address indexed to, uint256 amountA, uint256 amountB, uint256 liquidity);
    
    /// @notice Emitido cuando se ejecuta un swap
    /// @param user Dirección que inicia el swap
    /// @param tokenIn Dirección del token de entrada
    /// @param tokenOut Dirección del token de salida
    /// @param amountIn Cantidad de tokens de entrada
    /// @param amountOut Cantidad de tokens de salida
    event Swap(address indexed user, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut);

    /// @notice Constructor para inicializar el par de tokens
    /// @param _tokenA Dirección del primer token
    /// @param _tokenB Dirección del segundo token
    constructor(address _tokenA, address _tokenB) {
        tokenA = _tokenA;
        tokenB = _tokenB;
    }

    /// @notice Añade liquidez al pool para el par de tokens especificado
    /// @param _tokenA Dirección del primer token
    /// @param _tokenB Dirección del segundo token
    /// @param amountADesired Cantidad deseada de tokenA a añadir
    /// @param amountBDesired Cantidad deseada de tokenB a añadir
    /// @param amountAMin Cantidad mínima de tokenA a añadir
    /// @param amountBMin Cantidad mínima de tokenB a añadir
    /// @param to Dirección que recibirá los tokens de liquidez
    /// @param deadline Tiempo límite para la transacción (timestamp)
    /// @return amountA Cantidad real de tokenA añadida
    /// @return amountB Cantidad real de tokenB añadida
    /// @return liquidity Cantidad de tokens de liquidez emitidos
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
        require(deadline >= block.timestamp, "SS: EXP");
        require(_tokenA == tokenA && _tokenB == tokenB, "SS: ITP");
        
        uint256 _reserveA = reserveA;
        uint256 _reserveB = reserveB;
        uint256 _totalLiquidity = totalLiquidity;
        
        (amountA, amountB) = _calculateLiquidity(amountADesired, amountBDesired, amountAMin, amountBMin);
        
        // Transferir tokens al contrato
        IERC20(tokenA).transferFrom(msg.sender, address(this), amountA);
        IERC20(tokenB).transferFrom(msg.sender, address(this), amountB);
        
        // Calcular tokens de liquidez a emitir
        if (_totalLiquidity == 0) {
            liquidity = sqrt(amountA * amountB) - MINIMUM_LIQUIDITY;
            liquidityBalance[address(0)] = MINIMUM_LIQUIDITY; // Bloquear liquidez mínima
        } else {
            liquidity = amountA * _totalLiquidity / _reserveA < amountB * _totalLiquidity / _reserveB
                ? amountA * _totalLiquidity / _reserveA
                : amountB * _totalLiquidity / _reserveB;
        }
        
        require(liquidity > 0, "SS: ILM");
        
        // Actualizar reservas y liquidez
        unchecked {
            reserveA = _reserveA + amountA;
            reserveB = _reserveB + amountB;
        }
        totalLiquidity = _totalLiquidity + liquidity;
        liquidityBalance[to] += liquidity;
        
        emit LiquidityAdded(msg.sender, to, amountA, amountB, liquidity);
    }

    /// @notice Remueve liquidez del pool
    /// @param _tokenA Dirección del primer token
    /// @param _tokenB Dirección del segundo token
    /// @param liquidity Cantidad de tokens de liquidez a quemar
    /// @param amountAMin Cantidad mínima de tokenA a recibir
    /// @param amountBMin Cantidad mínima de tokenB a recibir
    /// @param to Dirección que recibirá los tokens
    /// @param deadline Tiempo límite para la transacción (timestamp)
    /// @return amountA Cantidad de tokenA recibida
    /// @return amountB Cantidad de tokenB recibida
    function removeLiquidity(
        address _tokenA,
        address _tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB) {
        require(deadline >= block.timestamp, "SS: EXP");
        require(_tokenA == tokenA && _tokenB == tokenB, "SS: ITP");
        require(liquidityBalance[msg.sender] >= liquidity, "SS: IL");
        
        uint256 _reserveA = reserveA;
        uint256 _reserveB = reserveB;
        uint256 _totalLiquidity = totalLiquidity;
        
        // Calcular montos a devolver
        amountA = (liquidity * _reserveA) / _totalLiquidity;
        amountB = (liquidity * _reserveB) / _totalLiquidity;
        
        require(amountA >= amountAMin, "SS: IAA");
        require(amountB >= amountBMin, "SS: IBA");
        
        // Actualizar reservas y liquidez
        unchecked {
            reserveA = _reserveA - amountA;
            reserveB = _reserveB - amountB;
        }
        totalLiquidity = _totalLiquidity - liquidity;
        liquidityBalance[msg.sender] -= liquidity;
        
        // Transferir tokens
        IERC20(tokenA).transfer(to, amountA);
        IERC20(tokenB).transfer(to, amountB);
        
        emit LiquidityRemoved(msg.sender, to, amountA, amountB, liquidity);
    }

    /// @notice Intercambia una cantidad exacta de tokens de entrada por tokens de salida
    /// @param amountIn Cantidad de tokens de entrada
    /// @param amountOutMin Cantidad mínima de tokens de salida a recibir
    /// @param path Array de direcciones de tokens (token de entrada, token de salida)
    /// @param to Dirección que recibirá los tokens de salida
    /// @param deadline Tiempo límite para la transacción (timestamp)
    /// @return amounts Array con las cantidades de entrada y salida
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        require(deadline >= block.timestamp, "SS: EXP");
        require(path.length == 2, "SS: IP");
        require(
            (path[0] == tokenA && path[1] == tokenB) || (path[0] == tokenB && path[1] == tokenA),
            "SS: ITP"
        );
        
        uint256 _reserveA = reserveA;
        uint256 _reserveB = reserveB;
        
        amounts = new uint256[](2);
        amounts[0] = amountIn;
        
        (uint256 reserveIn, uint256 reserveOut) = path[0] == tokenA ? (_reserveA, _reserveB) : (_reserveB, _reserveA);
        amounts[1] = getAmountOut(amountIn, reserveIn, reserveOut);
        
        require(amounts[1] >= amountOutMin, "SS: IOA");
        
        // Actualizar reservas
        if (path[0] == tokenA) {
            unchecked {
                reserveA = _reserveA + amountIn;
                reserveB = _reserveB - amounts[1];
            }
        } else {
            unchecked {
                reserveB = _reserveB + amountIn;
                reserveA = _reserveA - amounts[1];
            }
        }
        
        // Transferir tokens
        IERC20(path[0]).transferFrom(msg.sender, address(this), amounts[0]);
        IERC20(path[1]).transfer(to, amounts[1]);
        
        emit Swap(msg.sender, path[0], path[1], amounts[0], amounts[1]);
    }

    /// @notice Obtiene el precio de tokenA en términos de tokenB
    /// @param _tokenA Dirección del primer token
    /// @param _tokenB Dirección del segundo token
    /// @return price Precio de tokenA en términos de tokenB (con precisión 1e18)
    function getPrice(address _tokenA, address _tokenB) external view returns (uint256 price) {
        require(_tokenA == tokenA && _tokenB == tokenB, "SS: ITP");
        require(reserveA > 0 && reserveB > 0, "SS: NL");
        price = (reserveB * 1e18) / reserveA;
    }

    /// @notice Calcula la cantidad de tokens de salida para una cantidad de entrada dada
    /// @param amountIn Cantidad de tokens de entrada
    /// @param reserveIn Reserva del token de entrada
    /// @param reserveOut Reserva del token de salida
    /// @return amountOut Cantidad de tokens de salida
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure returns (uint256 amountOut) {
        require(amountIn > 0, "SS: IIA");
        require(reserveIn > 0 && reserveOut > 0, "SS: IL");
        
        uint256 numerator = amountIn * reserveOut;
        uint256 denominator = reserveIn + amountIn;
        amountOut = numerator / denominator;
    }

    /// @dev Calcula las cantidades óptimas de tokens para añadir liquidez
    /// @param amountADesired Cantidad deseada de tokenA
    /// @param amountBDesired Cantidad deseada de tokenB
    /// @param amountAMin Cantidad mínima de tokenA
    /// @param amountBMin Cantidad mínima de tokenB
    /// @return amountA Cantidad real de tokenA
    /// @return amountB Cantidad real de tokenB
    function _calculateLiquidity(
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) private view returns (uint256 amountA, uint256 amountB) {
        uint256 _reserveA = reserveA;
        uint256 _reserveB = reserveB;
        
        if (_reserveA == 0 && _reserveB == 0) {
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            amountB = (amountADesired * _reserveB) / _reserveA;
            if (amountB <= amountBDesired) {
                require(amountB >= amountBMin, "SS: IBA");
                amountA = amountADesired;
            } else {
                amountA = (amountBDesired * _reserveA) / _reserveB;
                require(amountA >= amountAMin, "SS: IAA");
                amountB = amountBDesired;
            }
        }
    }

    /// @dev Calcula la raíz cuadrada para la emisión inicial de liquidez
    /// @param y Número de entrada
    /// @return z Raíz cuadrada de y
    function sqrt(uint256 y) public pure returns (uint256 z) {
        if (y == 0) return 0;
        if (y <= 3) return 1;
        z = y;
        uint256 x = y / 2 + 1;
        while (x < z) {
            z = x;
            x = (y / x + x) / 2;
        }
    }
}