import {ethers} from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

import {Logger} from '../helpers/logger/pino';
import {SmartContractSdkCore} from './core/core';
import {convertSlippage, getFastGasFee, priceMaster} from './utils/helpers';

export interface WeightsData {
  targetTokenAddress : String;
  targetWeights : Number;
  currentWeights : Number;
  activeWeights : Number;
  tokenBalance : Number;
  tokenPrice : Number;
}
export class FundV2 {
  constructor(private readonly sdkCore: SmartContractSdkCore) {}

  /**
   * function to get abi file
   */
  async abi(): Promise<string> {
    const filePath = path.join(__dirname, './abi/fundV2.json');
    return fs.readFileSync(filePath, 'utf-8');
  }


    /**
   * function to read fund active weights
   *
   * @param {Object} param the contract address to deposit.
   * @returns 3 seperate arrays of target weights, current weights, and active weights
   */
    async getFundWeightsData({
      contractAddress,
    }: {
      contractAddress: string;
    }): Promise<WeightsData[]> {
      try {
        const fundV2Abi = await this.abi();
        const priceMasterContract = await priceMaster(this.sdkCore.chainId);
        const contract = new ethers.Contract(contractAddress, fundV2Abi, this.sdkCore.signer);
        const baseTokenAddr = await contract.baseToken();
        const vaultValue = await contract.getVaultValues();
        const targetAddr = await contract.targetAddr();
        const weights :WeightsData[] = [];

        for(let addr in targetAddr) {
          let target = await contract.TargetWeight(addr);
          let balance = await contract.getBalance(addr);
          let price = await priceMasterContract.getPrice(addr, baseTokenAddr);
          let current = (balance * price) / vaultValue;

          let data : WeightsData = {
            targetTokenAddress: addr,
            targetWeights: target,
            currentWeights: current,
            activeWeights: current - target,
            tokenBalance: balance,
            tokenPrice: price,
          }
          weights.push(data);
        }
        return weights;
      } catch (e) {
        Logger.error({error: e, name: FundV2.name}, 'Read error');
        throw e;
      }
    }
  /**
   * function to get base token decimal
   *
   * @param contractAddress the contract address to get.
   * @returns the number of decimal for the particular contract address.
   */
  async getBaseTokenDecimal(contractAddress: string): Promise<number> {
    const fundV2Abi = await this.abi();
    const contractFundv2 = new ethers.Contract(contractAddress, fundV2Abi, this.sdkCore.provider);
    const baseCcy = await contractFundv2.baseToken();

    const contract = new ethers.Contract(baseCcy, fundV2Abi, this.sdkCore.provider);

    return Number(await contract.decimals());
  }

  /**
   * function to deposit amount to selected contract address
   *
   * @param {Object} param the contract address to deposit.
   * @returns the transaction and receipt for the action.
   */
  async deposit({
    contractAddress,
    amount,
    slippage,
  }: {
    contractAddress: string;
    amount: number;
    slippage: number;
  }): Promise<Record<string, unknown>> {
    try {
      const decimal = await this.getBaseTokenDecimal(contractAddress);

      const fundV2Abi = await this.abi();

      const amountToUse = ethers.parseUnits(String(amount), decimal);
      slippage = convertSlippage(slippage);

      const contract = new ethers.Contract(contractAddress, fundV2Abi, this.sdkCore.signer);

      const params = await getFastGasFee(this.sdkCore.chainId);
      const transaction = await contract['deposit(uint256,uint32)'](String(amountToUse), slippage, {
        ...params,
      });
      const receipt = await transaction.wait();

      return {
        transaction,
        receipt,
      };
    } catch (e) {
      Logger.error({error: e, name: FundV2.name}, 'deposit error');
      throw e;
    }
  }

  /**
   * function to withdraw amount to selected contract address
   *
   * @param {Object} param the contract address to withdraw.
   * @returns the transaction and receipt for the action.
   */
  async withdraw({
    contractAddress,
    amount,
    slippage,
  }: {
    contractAddress: string;
    amount: number;
    slippage: number;
  }): Promise<Record<string, unknown>> {
    try {
      const amountToUse = ethers.parseUnits(String(amount), 18).toString();
      slippage = convertSlippage(slippage);

      const fundV2Abi = await this.abi();
      const contract = new ethers.Contract(contractAddress, fundV2Abi, this.sdkCore.signer);

      const params = await getFastGasFee(this.sdkCore.chainId);
      const transaction = await contract['withdraw(uint256,uint32)'](amountToUse, slippage, {
        ...params,
      });
      const receipt = await transaction.wait();

      return {
        transaction,
        receipt,
      };
    } catch (e) {
      Logger.error({error: e, name: FundV2.name}, 'withdraw error');
      throw e;
    }
  }

  /**
   * function to rebalance to selected contract address
   *
   * @param {Object} param the contract address to rebalance.
   * @returns the transaction and receipt for the action.
   */
  async rebalance({
    contractAddress,
    toAddress,
    targets,
    slippage,
  }: {
    contractAddress: string;
    toAddress: string[];
    targets: string[];
    slippage: number;
  }): Promise<Record<string, unknown>> {
    try {
      slippage = convertSlippage(slippage);
      const fundV2Abi = await this.abi();
      const contract = new ethers.Contract(contractAddress, fundV2Abi, this.sdkCore.signer);

      const isNoFundUnit = await contract.getFundTotalSupply();

      const params = await getFastGasFee(this.sdkCore.chainId);
      if (isNoFundUnit > 0) {
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
      } else {
        const transaction = await contract['createTargetNames(address[],uint256[])'](
          toAddress,
          targets,
          {
            ...params,
          },
        );
        const receipt = await transaction.wait();
        return {
          transaction,
          receipt,
        };
      }
    } catch (e) {
      Logger.error({error: e, name: FundV2.name}, 'rebalance error');
      throw e;
    }
  }
}
