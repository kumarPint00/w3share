# DogeGift - Decentralized Digital Gifting Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Solidity](https://img.shields.io/badge/Solidity-363636?logo=solidity&logoColor=white)](https://soliditylang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

> A revolutionary blockchain-based gifting platform that enables secure, transparent, and gasless digital asset transfers through smart contracts.

## 🌟 What is DogeGift?

DogeGift is a decentralized application that allows users to create, send, and claim digital gifts (ERC20 tokens and NFTs) using blockchain technology. Unlike traditional gifting platforms, DogeGift leverages smart contracts to ensure:

- **🔒 Security**: Assets are locked in tamper-proof smart contracts
- **🔑 Privacy**: Code-protected claiming instead of fixed addresses
- **⚡ Speed**: Gasless claims for seamless user experience
- **🌐 Transparency**: All transactions are verifiable on-chain
- **⏰ Flexibility**: Time-limited gifts with automatic expiry handling

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL database
- MetaMask or compatible Web3 wallet
- Test ETH on Sepolia testnet

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/dogegift.git
cd dogegift

# Install dependencies
npm run install:all

# Set up environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Configure your environment variables
# Edit backend/.env and frontend/.env with your settings

# Start development environment
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Technology Stack](#-technology-stack)
- [Getting Started](#-getting-started)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)

## ✨ Features

### 🎁 Core Functionality
- **Multi-Asset Gifts**: Send ERC20 tokens, NFTs, or combinations
- **Code-Protected Claims**: Secret codes instead of wallet addresses
- **Gasless Experience**: Recipients don't pay gas fees
- **Time-Limited Gifts**: Set expiry dates with automatic refunds
- **Real-Time Tracking**: Live status updates for all gifts

### 🔐 Security & Trust
- **Smart Contract Escrow**: Assets locked in decentralized contracts
- **Immutable Records**: All transactions permanently recorded
- **Zero Custody**: Platform never holds user funds
- **Audit-Ready**: Open-source smart contracts

### 👥 User Experience
- **Wallet Integration**: Seamless MetaMask connection
- **Responsive Design**: Works on desktop and mobile
- **Intuitive Interface**: Step-by-step gift creation
- **Multi-Language**: Internationalization support

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (Next.js)     │◄──►│   (NestJS)      │◄──►│   (PostgreSQL)  │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Wallet   │    │ Smart Contracts │    │   Blockchain    │
│   (MetaMask)    │◄──►│   (GiftEscrow)  │◄──►│   (Sepolia)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Components
- **Frontend**: Next.js 14 with App Router, Material-UI, TypeScript
- **Backend**: NestJS with REST API, authentication, blockchain integration
- **Database**: PostgreSQL with Prisma ORM
- **Blockchain**: Ethereum-compatible networks with custom smart contracts
- **Smart Contracts**: Solidity contracts for escrow functionality

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI Library**: Material-UI (MUI) v5
- **State Management**: TanStack Query + React Context
- **Styling**: Emotion CSS-in-JS
- **Web3**: Ethers.js

### Backend
- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: Sign-In with Ethereum (SIWE)
- **Blockchain**: Ethers.js + Gelato Relay
- **Validation**: Class-validator

### Blockchain
- **Framework**: Hardhat
- **Language**: Solidity ^0.8.0
- **Libraries**: OpenZeppelin contracts
- **Networks**: Ethereum Sepolia, Base Sepolia
- **Testing**: Hardhat + Chai

### DevOps
- **Containerization**: Docker + Docker Compose
- **Process Management**: PM2
- **CI/CD**: GitHub Actions
- **Monitoring**: Custom logging + blockchain explorers

## 📚 Documentation

### For Users
- [User Guide](./USER_GUIDE.md) - Complete user manual
- [FAQ](./FAQ.md) - Frequently asked questions
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and solutions

### For Developers
- [Developer Guide](./DEVELOPER_GUIDE.md) - Technical implementation
- [API Documentation](./API_DOCUMENTATION.md) - REST API reference
- [Smart Contracts](./SMART_CONTRACTS.md) - Contract documentation
- [Contributing](./CONTRIBUTING.md) - Development guidelines
0x3585CBBAaeaBedfdF5ce89b73E7F6e22A571A483
### For Operators
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment
- [Operations](./OPERATIONS.md) - System administration
- [Security](./SECURITY.md) - Security considerations

## 🎯 Use Cases

### Personal Gifting
- **Birthday Gifts**: Send crypto tokens as presents
- **Holiday Celebrations**: Digital gifts for special occasions
- **Achievement Rewards**: NFTs for accomplishments

### Business Applications
- **Customer Rewards**: Token-based loyalty programs
- **Employee Incentives**: Crypto bonuses and recognition
- **Community Airdrops**: Decentralized reward distribution

### Gaming & Metaverse
- **In-Game Items**: NFT gifts for gamers
- **Virtual Assets**: Digital collectibles
- **Metaverse Gifts**: Virtual world items

## 🤝 Contributing

We welcome contributions from the community! Please see our [Contributing Guide](./CONTRIBUTING.md) for details on:

- Setting up development environment
- Code standards and guidelines
- Testing requirements
- Pull request process
- Issue reporting

### Development Status
- ✅ Core gifting functionality
- ✅ Smart contract integration
- ✅ Gasless claiming
- 🔄 Multi-chain support (in progress)
- 🔄 Mobile app (planned)
- 🔄 Advanced analytics (planned)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🆘 Support

### Community Support
- **Discord**: [Join our community](https://discord.gg/dogegift)
- **GitHub Issues**: [Report bugs](https://github.com/your-org/dogegift/issues)
- **Documentation**: [Read the docs](./docs/)

### Professional Support
- **Enterprise**: Custom deployments and integrations
- **Consulting**: Smart contract audits and security reviews
- **Training**: Developer workshops and onboarding

## 🙏 Acknowledgments

- **OpenZeppelin**: For secure smart contract libraries
- **Gelato Network**: For gasless transaction infrastructure
- **Ethereum Community**: For the foundation of decentralized technology
- **Our Contributors**: For making DogeGift better every day

---

**Made with ❤️ by the DogeGift team**

*Transforming digital gifting with blockchain technology*</content>
<parameter name="filePath">/home/ravi/dogeFull/README.md
