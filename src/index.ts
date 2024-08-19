import * as ethers from 'ethers';
import {Logger} from './helpers/logger/pino';
import {SmartContractSdkCore} from './smart-contract/core/core';
import {SmartContractSdkConfig} from './smart-contract/core/core.type';
import * as xWinSdkHelpers from './smart-contract/utils/helpers';

const SmartContractSdk = {
  start: async (config?: Partial<SmartContractSdkConfig>): Promise<SmartContractSdkCore> => {
    const core = await new SmartContractSdkCore(config).initializeSdk();
    Logger.info({chainId: core.chainId, rpcUrl: core.rpcUrl}, 'Smart Contract SDK initialized');
    return core;
  },
};

export {ethers, SmartContractSdk, SmartContractSdkConfig, SmartContractSdkCore, xWinSdkHelpers};
