# SimpleSwap DApp - Frontend

## Descripción del Proyecto

SimpleSwap es una aplicación descentralizada (DApp) que permite a los usuarios intercambiar tokens ERC-20 (NTA y NTB) en la red Sepolia de Ethereum, gestionar liquidez en un pool de intercambio, y visualizar precios en tiempo real. El frontend, desarrollado con Next.js, proporciona una interfaz intuitiva para interactuar con el contrato `SimpleSwap` y los tokens `NuevoTokenA` (NTA) y `NuevoTokenB` (NTB).

Este proyecto forma parte del Trabajo Práctico del Módulo 4, demostrando la integración de contratos inteligentes con un frontend moderno y el despliegue en Vercel para acceso público.

## Contratos Desplegados

- **Red**: Sepolia (Chain ID: 11155111)
- **SimpleSwap**: `0x651bA2cF45eC284b6cFFB88b60D50d87573e6151`
- **NuevoTokenA (NTA)**: `0x41eDC1589e1F83fbb5E91260975f47EE38F2d7dD`
- **NuevoTokenB (NTB)**: `0x873f9FebC0B9960F2a808a88491233f20128481e`

## Requisitos Previos

- **Node.js**: Versión 20.19.0 o superior (`nvm install 20.19.0`).
- **MetaMask**: Configurado para la red Sepolia con Sepolia ETH y tokens NTA/NTB.
- **Vercel CLI**: Para despliegue (`npm install -g vercel`).
- **Hardhat**: Para pruebas y scripts de interacción con contratos (`npm install --save-dev hardhat`).
- **Dependencias del Frontend**: Instalar con `npm install` en el directorio `frontend`.

## Instalación y Ejecución

1. **Clonar el Repositorio**:
   ```bash
   git clone https://github.com/rogertorrespe/SimpleSwap
   cd SimpleSwap/frontend