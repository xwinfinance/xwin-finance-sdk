import {JsonRpcProvider, Wallet, ethers} from 'ethers';
import {IGasFee} from './interfaces';

export const getJsonRpcProvider = async ({
  rpcNodeUrl,
  privateKey,
}: {
  rpcNodeUrl: string;
  privateKey?: string;
}): Promise<{
  provider: JsonRpcProvider;
  chainId: Number;
  signer?: Wallet;
}> => {
  const provider = new JsonRpcProvider(rpcNodeUrl);
  const chainId = Number((await provider.getNetwork()).chainId);

  if (!privateKey) {
    return {
      provider,
      chainId,
    };
  }

  return {
    provider,
    chainId,
    signer: new Wallet(privateKey, provider),
  };
};

export const convertToWei = (val: number): string => {
  return ethers.parseUnits(val.toString(), 'gwei').toString();
};

export const getFastGasFee = async (chainId: Number): Promise<IGasFee> => {
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
