import {JsonRpcProvider, Wallet} from 'ethers';
import {Logger} from '../../helpers/logger/pino';
import {BEP20} from '../bep20';
import {FundV2} from '../fund-v2';
import {SmartContractSdkConfig} from './core.type';

export class SmartContractSdkCore {
  rpcUrl: string;
  provider: JsonRpcProvider;
  signer: Wallet;
  chainId: Number;

  constructor(config?: Partial<SmartContractSdkConfig>) {
    if (config?.rpcUrl) {
      this.rpcUrl = config.rpcUrl;
      this.provider = new JsonRpcProvider(config.rpcUrl);
    }

    if (!config?.rpcUrl) {
      this.rpcUrl = `http://127.0.0.1:8545`;
      Logger.warn(`No RPC URL provided, using default ${this.rpcUrl}`);
      this.provider = new JsonRpcProvider(this.rpcUrl);
    }

    if (config?.privateKey) {
      this.signer = new Wallet(config.privateKey, this.provider);
    }
  }

  async initializeSdk(): Promise<SmartContractSdkCore> {
    const network = await this.provider.getNetwork();
    this.chainId = Number(network.chainId);

    return this;
  }

  FundV2(): FundV2 {
    return new FundV2(this);
  }

  BEP20(): BEP20 {
    return new BEP20(this);
  }
}
