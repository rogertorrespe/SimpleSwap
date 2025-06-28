# SimpleSwap Contract

## Descripción

`SimpleSwap` es un contrato inteligente que implementa un Automated Market Maker simplificado, inspirado en Uniswap V2, para un par de tokens ERC-20 en la red de prueba Sepolia. Utiliza la fórmula de producto constante (`x * y = k`) con una tarifa del 0.3% para los intercambios. El contrato permite añadir y remover liquidez, realizar swaps, y consultar precios, y está diseñado para ser autónomo, sin dependencias externas.

### Características
- **Añadir Liquidez**: Permite a los usuarios agregar liquidez al pool y recibir tokens de liquidez.
- **Remover Liquidez**: Permite retirar liquidez y recibir tokens proporcionales.
- **Swap**: Intercambia tokens con una tarifa del 0.3%.
- **Consultar Precio**: Calcula el precio de un token en términos del otro.
- **Seguridad**: Incluye protección contra ataques de dust (`MINIMUM_LIQUIDITY`) y verificaciones de plazos.

## Requisitos
- Acceso a [Remix IDE](https://remix.ethereum.org).
- Una billetera como MetaMask configurada para la red Sepolia.
- ETH de prueba en Sepolia (obtén ETH en un faucet como https://sepoliafaucet.com).
- Direcciones de dos tokens ERC-20 en Sepolia para el par de tokens.

## Compilación en Remix
1. Abre [Remix IDE](https://remix.ethereum.org).
2. Crea un nuevo archivo llamado `SimpleSwap.sol` en la carpeta `contracts`.
3. Copia y pega el contenido de `contracts/SimpleSwap.sol` desde este repositorio.
4. Ve a la pestaña **Solidity Compiler**:
   - Selecciona la versión del compilador `0.8.30`.
   - Desactiva la optimización.
5. Haz clic en **Compile SimpleSwap.sol**.

## Despliegue en Sepolia
1. En Remix, ve a la pestaña **Deploy & Run Transactions**.
2. Selecciona **Injected Provider - MetaMask** y conéctalo a la red Sepolia.
3. En el campo **Contract**, selecciona `SimpleSwap`.
4. Ingresa los argumentos del constructor:
   - `_tokenA`: `0x25bc9cadc44d6888f80fb94498bac65b77a678a3`
   - `_tokenB`: `0xe1da96532ed61c55d0abbcf03e676e02eb543e2d`
5. Haz clic en **Deploy**.
6. Confirma la transacción en MetaMask.

## Verificación en Etherscan
El contrato ya está verificado en Sepolia:
- **Contract Address**: [0xFBD9f5e73AD67b15703ff6c676a4f4dD24Df7A3A](https://sepolia.etherscan.io/address/0xFBD9f5e73AD67b15703ff6c676a4f4dD24Df7A3A)


## Repositorio
- **URL**: [https://github.com/rogertorrespe/SimpleSwap](https://github.com/rogertorrespe/SimpleSwap)

