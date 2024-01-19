import {JsonRpcProvider, ethers} from 'ethers';
import * as fundV2Abi from './abi/fundV2.json';
import {convertSlippage, getFastGasFee, getJsonRpcProvider} from './utils/helpers';

export class FundV2 {
  constructor(private readonly rpcNodeUrl: string) {}

  async getDecimalByContractAddress({
    contractAddress,
    provider,
  }: {
    contractAddress: string;
    provider?: JsonRpcProvider;
  }): Promise<number> {
    if (!provider) {
      const jsonRpcProvider = await getJsonRpcProvider({
        rpcNodeUrl: this.rpcNodeUrl,
      });
      provider = jsonRpcProvider.provider;
    }

    const contract = new ethers.Contract(contractAddress, fundV2Abi, provider);

    return contract.decimals();
  }

  async deposit({
    privateKey,
    contractAddress,
    amount,
    slippage,
  }: {
    privateKey: string;
    contractAddress: string;
    amount: number;
    slippage: number;
  }): Promise<Record<string, unknown>> {
    try {
      const {provider, signer, chainId} = await getJsonRpcProvider({
        rpcNodeUrl: this.rpcNodeUrl,
        privateKey,
      });

      const decimal = await this.getDecimalByContractAddress({provider, contractAddress});
      const amountToUse = ethers.parseUnits(String(amount), String(decimal)).toString();
      slippage = convertSlippage(slippage);

      const contract = new ethers.Contract(contractAddress, fundV2Abi, signer);

      const params = getFastGasFee(chainId);
      const transaction = await contract['deposit(uint256,uint32)'](amountToUse, slippage, {
        ...params,
      });
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
    contractAddress,
    amount,
    slippage,
  }: {
    privateKey: string;
    contractAddress: string;
    amount: number;
    slippage: number;
  }): Promise<Record<string, unknown>> {
    try {
      const {provider, signer, chainId} = await getJsonRpcProvider({
        rpcNodeUrl: this.rpcNodeUrl,
        privateKey,
      });

      const decimal = await this.getDecimalByContractAddress({provider, contractAddress});
      const amountToUse = ethers.parseUnits(String(amount), String(decimal)).toString();
      slippage = convertSlippage(slippage);

      const contract = new ethers.Contract(contractAddress, fundV2Abi, signer);

      const params = getFastGasFee(chainId);
      const transaction = await contract['withdraw(uint256,uint32)'](amountToUse, slippage, {
        ...params,
      });
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
    contractAddress,
    toAddress,
    targets,
    slippage,
  }: {
    privateKey: string;
    contractAddress: string;
    toAddress: string[];
    targets: string[];
    slippage: number;
  }): Promise<Record<string, unknown>> {
    try {
      const {signer, chainId} = await getJsonRpcProvider({
        rpcNodeUrl: this.rpcNodeUrl,
        privateKey,
      });

      slippage = convertSlippage(slippage);

      const contract = new ethers.Contract(contractAddress, fundV2Abi, signer);

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
