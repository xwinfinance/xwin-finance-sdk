import {ethers} from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import {SmartContractSdkCore} from './core/core';

export class Base {
  abiFileLocation: string;
  sdkCore: SmartContractSdkCore;

  constructor(protected readonly _sdkCore: SmartContractSdkCore) {
    this.sdkCore = _sdkCore;
  }

  /**
   * function to get abi file
   */
  async abi(): Promise<string> {
    return fs.readFileSync(path.join(__dirname, this.abiFileLocation), 'utf-8');
  }

  /**
   * function to get token decimal
   *
   * @param contractAddress the contract address to get.
   * @returns the number of decimal for the particular contract address.
   */
  async getTokenDecimal(contractAddress: string): Promise<number> {
    const abi = await this.abi();
    const contract = new ethers.Contract(contractAddress, abi, this.sdkCore.provider);
    return Number(await contract.decimals());
  }

  async getTokenBalance(contractAddress: string, token: string): Promise<number> {
    const abi = await this.abi();
    const contract = new ethers.Contract(contractAddress, abi, this.sdkCore.provider);
    return contract.balanceOf(token);
  }
}
