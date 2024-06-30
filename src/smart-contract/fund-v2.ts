import {ethers} from 'ethers';

import {Logger} from '../helpers/logger/pino';
import {Base} from './base';
import {SmartContractSdkCore} from './core/core';
import {convertSlippage, getFastGasFee, priceMaster} from './utils/helpers';

export interface IWeightsData {
  targetTokenAddress: String;
  targetWeights: Number;
  currentWeights: Number;
  activeWeights: Number;
  tokenBalance: Number;
  tokenPrice: Number;
}

export interface IFundData {
  baseCcy: String;
  targetAddress: String[];
  totalUnitB4: Number;
  baseBalance: Number;
  unitPrice: Number;
  fundValue: Number;
  unitPriceUSD: Number;
  fundValueUSD: Number;
  fundName: String;
  symbolName: String;
  decimal: Number;

  managementFee?: Number;
  performFee?: Number;
  mAddr?: String;
  highWaterMarkPrice?: Number;
}

export class FundV2 extends Base {
  constructor(readonly _sdkCore: SmartContractSdkCore) {
    super(_sdkCore);
    this.abiFileLocation = './abi/fundV2.json';
  }

  /**
   * function to read fund data info
   * @param contractAddress the contract address .
   * @returns the object of fund data.
   */
  async getFundDataInfo(contractAddress: string): Promise<IFundData> {
    try {
      const fundV2Abi = await this.abi();
      const contractFundv2 = new ethers.Contract(contractAddress, fundV2Abi, this.sdkCore.provider);

      const fundData = await contractFundv2.GetFundDataAll();
      const decimal = await this.getTokenDecimal(contractAddress);

      return {
        baseCcy: fundData.baseCcy,
        targetAddress: fundData.targetAddress,
        totalUnitB4: fundData.totalUnitB4,
        baseBalance: fundData.baseBalance,
        unitPrice: fundData.unitprice,
        fundValue: fundData.fundvalue,
        unitPriceUSD: fundData.unitpriceUSD,
        fundValueUSD: fundData.fundvalueUSD,
        fundName: fundData.fundName,
        symbolName: fundData.symbolName,
        decimal,
      };
    } catch (e) {
      try {
        const xWinAllocationAbi = await this.abi('./abi/xWinAllocations.json');
        const contract = new ethers.Contract(
          contractAddress,
          xWinAllocationAbi,
          this.sdkCore.provider,
        );

        const data = await contract.GetStrategyData();
        const decimal = await this.getTokenDecimal(contractAddress);

        return {
          baseCcy: data.baseCcy,
          targetAddress: [],
          totalUnitB4: data.totalUnitB4,
          baseBalance: data.baseBalance,
          unitPrice: data.unitprice,
          fundValue: data.fundvalue,
          unitPriceUSD: data.unitpriceUSD,
          fundValueUSD: data.fundvalueUSD,
          fundName: data.name,
          symbolName: data.symbol,
          managementFee: data.managementFee,
          performFee: data.performFee,
          mAddr: data.mAddr,
          highWaterMarkPrice: data.highWaterMarkPrice,
          decimal,
        };
      } catch (e1) {
        Logger.error({error: e1, name: FundV2.name}, 'getFundDataInfo error');
        throw e1;
      }
    }
  }

  /**
   * function to read fund active weights
   *
   * @param {Object} param the contract address to deposit.
   * @returns 3 seperate arrays of target weights, current weights, and active weights
   */
  async getFundWeightsData(contractAddress: string): Promise<IWeightsData[]> {
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
