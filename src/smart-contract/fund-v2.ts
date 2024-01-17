import {ethers} from 'ethers';
import * as fundV2Abi from './abi/fundV2.json';
import {getFastGasFee, getJsonRpcProvider} from './utils/helpers';

export class FundV2 {
  constructor(private readonly rpcNodeUrl: string) {}

  async deposit({
    privateKey,
    collectionAddress,
    amount,
    slippage,
  }: {
    privateKey: string;
    collectionAddress: string;
    amount: number;
    slippage: number;
  }): Promise<Record<string, unknown>> {
    try {
      const {signer, chainId} = await getJsonRpcProvider({
        rpcNodeUrl: this.rpcNodeUrl,
        privateKey,
      });

      const contract = new ethers.Contract(collectionAddress, fundV2Abi, signer);

      const params = getFastGasFee(chainId);

      const transaction = await contract['deposit(uint256,uint32)'](amount, slippage, {...params});
      const receipt = await transaction.wait();

      return {
        transaction,
        receipt,
      };
    } catch (e) {
      throw e;
    }
  }

  async withdraw({
    privateKey,
    collectionAddress,
    amount,
    slippage,
  }: {
    privateKey: string;
    collectionAddress: string;
    amount: number;
    slippage: number;
  }): Promise<Record<string, unknown>> {
    try {
      const {signer, chainId} = await getJsonRpcProvider({
        rpcNodeUrl: this.rpcNodeUrl,
        privateKey,
      });

      const contract = new ethers.Contract(collectionAddress, fundV2Abi, signer);

      const params = getFastGasFee(chainId);

      const transaction = await contract['withdraw(uint256,uint32)'](amount, slippage, {...params});
      const receipt = await transaction.wait();

      return {
        transaction,
        receipt,
      };
    } catch (e) {
      throw e;
    }
  }

  async rebalance({
    privateKey,
    collectionAddress,
    toAddress,
    targets,
    slippage,
  }: {
    privateKey: string;
    collectionAddress: string;
    toAddress: string[];
    targets: string[];
    slippage: number;
  }): Promise<Record<string, unknown>> {
    try {
      const {signer, chainId} = await getJsonRpcProvider({
        rpcNodeUrl: this.rpcNodeUrl,
        privateKey,
      });

      const contract = new ethers.Contract(collectionAddress, fundV2Abi, signer);

      const params = getFastGasFee(chainId);

      const transaction = await contract['Rebalance(address[],uint256[],uint32)'](
        toAddress,
        targets,
        slippage,
        {
          ...params,
        },
      );
      const receipt = await transaction.wait();

      return {
        transaction,
        receipt,
      };
    } catch (e) {
      throw e;
    }
  }
}
