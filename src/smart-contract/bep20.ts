import {Base} from './base';
import {SmartContractSdkCore} from './core/core';

export class BEP20 extends Base {
  constructor(readonly _sdkCore: SmartContractSdkCore) {
    super(_sdkCore);
    this.abiFileLocation = './abi/BEP20.json';
  }
}
