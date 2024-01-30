import {ethers} from 'ethers';
import {GasFee} from './types';
import * as fs from 'fs';


export const convertToWei = (val: number): string => {
  return ethers.parseUnits(val.toString(), 'gwei').toString();
};

export const getFastGasFee = async (chainId: Number): Promise<GasFee> => {
  // Polygon Mainnet
  if (chainId === 137) {
    const gasData = await (await fetch('https://gasstation.polygon.technology/v2')).json();
    return {
      maxFeePerGas: convertToWei(gasData.fast.maxFee.toFixed(6)),
      maxPriorityFeePerGas: convertToWei(gasData.fast.maxPriorityFee.toFixed(6)),
    };
  }

  // Mumbai - Testnet
  if (chainId === 80001) {
    const gasData = await (await fetch('https://gasstation-testnet.polygon.technology/v2')).json();
    return {
      maxFeePerGas: convertToWei(gasData.fast.maxFee.toFixed(6)),
      maxPriorityFeePerGas: convertToWei(gasData.fast.maxPriorityFee.toFixed(6)),
    };
  }

  // BNB Smart Chain Mainnet
  if (chainId === 56) {
    return {
      gasPrice: convertToWei(3),
    };
  }

  // BNB Smart Chain Testnet
  if (chainId === 97) {
    return {
      gasPrice: convertToWei(10),
    };
  }

  // GoChain Testnet (LOCALHOST)
  if (chainId === 31337) {
    return {};
  }

  // Arbitrum One
  if (chainId === 42161) {
    return {
      gasPrice: convertToWei(0.1),
    };
  }

  return {
    gasPrice: convertToWei(3),
  };
};

export const convertSlippage = (slippage: number): number => {
  const output = slippage * 100;
  if (output > 100) {
    throw new Error('Slippage value must be not greater than 1');
  }

  return output;
};

export const priceMaster = async (chainId: Number): Promise<ethers.Contract> => {
  const abi = fs.readFileSync('./abi/priceMaster.json', 'utf-8');

  // Polygon Mainnet
  if (chainId === 137) {
    return new ethers.Contract('0x4259ED91681159E455629a35d81c0b0020e3FeeD', abi);
  }

  // BNB Smart Chain Mainnet
  if (chainId === 56) {
    return new ethers.Contract('0xB1233713FeA0984fff84c7456d2cCed43e5e48E2', abi);
  }

  // Arbitrum One
  if (chainId === 42161) {
    return new ethers.Contract('0x8a3c24716447992C85a86231606759931f83c667', abi);
  }

  throw new Error('Unsupported chain id: ' + chainId);
}
