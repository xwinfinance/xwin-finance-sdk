import {ethers} from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

import {Logger} from '../helpers/logger/pino';
import {SmartContractSdkCore} from './core/core';
import {convertSlippage, getFastGasFee, priceMaster} from './utils/helpers';

export interface WeightsData {
  targetTokenAddress: String;
  targetWeights: Number;
  currentWeights: Number;
  activeWeights: Number;
  tokenBalance: Number;
  tokenPrice: Number;
}
export class FundV2 {
  constructor(private readonly sdkCore: SmartContractSdkCore) {}

  /**
   * function to get abi file
   */
  async abi(): Promise<string> {
    return fs.readFileSync(path.join(__dirname, './abi/fundV2.json'), 'utf-8');
  }

  /**
   * function to read fund active weights
   *
   * @param {Object} param the contract address to deposit.
   * @returns 3 seperate arrays of target weights, current weights, and active weights
   */
  async getFundWeightsData(contractAddress: string): Promise<WeightsData[]> {
    try {
      const fundV2Abi = await this.abi();
      const priceMasterContract = await priceMaster(this.sdkCore.chainId, this.sdkCore.provider);
      const contract = new ethers.Contract(contractAddress, fundV2Abi, this.sdkCore.provider);
      const baseTokenAddr = await contract.baseToken();
      const baseTokenDecimal = await this.getTokenDecimal(baseTokenAddr);
      const vaultValue = await contract.getVaultValues();
      const targetAddr: string[] = await contract.getTargetNamesAddress();

      return Promise.all(
        targetAddr.map(async (addr) => {
          const target = await contract.TargetWeight(addr);
          const balance = await contract.getBalance(addr);
          const tokenValue = await contract.getTokenValues(addr);
          const price = await priceMasterContract.getPrice(addr, baseTokenAddr);
          const current = Number(tokenValue) / Number(vaultValue);
          const tokenDecimal = await this.getTokenDecimal(addr);

          return {
            targetTokenAddress: addr,
            targetWeights: Number(target) / 10000,
            currentWeights: current,
            activeWeights: current - Number(target) / 10000,
            tokenBalance: parseFloat(ethers.formatUnits(balance, tokenDecimal)),
            tokenPrice: parseFloat(ethers.formatUnits(price, baseTokenDecimal)),
          };
        }),
      );
    } catch (e) {
      Logger.error({error: e, name: FundV2.name}, 'getFundWeightsData error');
      throw e;
    }
  }

  /**
   * function to get token decimal
   *
   * @param contractAddress the contract address to get.
   * @returns the number of decimal for the particular contract address.
   */
  async getTokenDecimal(contractAddress: string): Promise<number> {
    const fundV2Abi = await this.abi();
    const contract = new ethers.Contract(contractAddress, fundV2Abi, this.sdkCore.provider);
    return Number(await contract.decimals());
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
