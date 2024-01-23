import {Logger} from './helpers/logger/pino';
import {SmartContractSdkCore} from './smart-contract/core/core';
import {SmartContractSdkConfig} from './smart-contract/core/core.type';
import * as helper from './smart-contract/utils/helpers';

export const SmartContractSdk = {
  start: async (config?: Partial<SmartContractSdkConfig>): Promise<SmartContractSdkCore> => {
    const core = await new SmartContractSdkCore(config).initializeSdk();
    Logger.info({chainId: core.chainId, rpcUrl: core.rpcUrl}, 'Smart Contract SDK initialized');
    return core;
  },
  helpers: {
    ...helper,
  },
};
