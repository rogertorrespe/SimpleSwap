# SimpleSwap - Trabajo Final Módulo 3

## Descripción
Este repositorio contiene la implementación del contrato `SimpleSwap`, que replica funcionalidades de Uniswap V2 para un par de tokens ERC-20, cumpliendo con los requerimientos del Módulo 3 del curso de Ethereum.

## Contratos desplegados
- **SimpleSwap**: `0x651bA2cF45eC284b6cFFB88b60D50d87573e6151` 
- **Token A**: `0x41eDC1589e1F83fbb5E91260975f47EE38F2d7dD` 
- **Token B**: `0x873f9FebC0B9960F2a808a88491233f20128481e` 

NuevoTokenA NTA : 0x41eDC1589e1F83fbb5E91260975f47EE38F2d7dD
NuevoTokenB NTB : 0x873f9FebC0B9960F2a808a88491233f20128481e
NUEVOSIMPLESWAP: 0x651bA2cF45eC284b6cFFB88b60D50d87573e6151


## Instrucciones de despliegue
1. **Desplegar tokens ERC-20**:
   - Usé `TestToken.sol` en Remix para desplegar `Token A` (nombre: "NuevoTokenA", símbolo: "NTA") y `Token B` (nombre: "NuevoTokenB", símbolo: "NTB") en Sepolia.
   - Cada token mintea 1M tokens (18 decimales) al desplegador.

2. **Desplegar SimpleSwap**:
   - Desplegué `SimpleSwap.sol` en Sepolia usando Remix, pasando las direcciones de `Token A` y `Token B` al constructor.

3. **Configuración**:
   - Aprobé 1M tokens de `Token A` y `Token B` para `SimpleSwap` usando `approve`.
   - Transferí 10K tokens de cada uno al contrato verificador (`0x9f8f02dab384dddf1591c3366069da3fb0018220`) y aprobé 10K tokens para el verificador.

4. **Verificación**:
   - Cargué `SwapVerifier.sol` en Remix en `0x9f8f02dab384dddf1591c3366069da3fb0018220`.
   - Llamé a `verify` con:
     ```
     NUEVOSIMPLESWAP: 0x651bA2cF45eC284b6cFFB88b60D50d87573e6151, 0x41eDC1589e1F83fbb5E91260975f47EE38F2d7dD, 0x873f9FebC0B9960F2a808a88491233f20128481e, 1000000000000000000000, 1000000000000000000000, 100000000000000000000, "Paul Roger Torres Silva"
     ```
   - Transacción: [Enlace a Etherscan](#).

## Archivos
- `SimpleSwap.sol`: Contrato principal con optimizaciones de gas.
- `TestToken.sol`: Contrato ERC-20 para los tokens.
- `SwapVerifier.sol`: Contrato verificador (referencia).

## Notas
- Redeplegué nuevos contratos, diferentes a la primera entrega.
- El contrato `SimpleSwap` usa `unchecked` para optimizar gas.
- Los comentarios están en inglés como se ha solicitado.
