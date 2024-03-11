# @xwin-finance/sdk
A SDK package that develop by xwin-finance team.

### Installation
```
npm install @xwin-finance/sdk
```

## Example of Usage
### for FundV2 deposit,
```
import { SmartContractSdk } from "@xwin-finance/sdk";

const deposit = async () => {
  const sdk = await SmartContractSdk.start({
    rpcUrl: '<selected-rpc-url>',
    privateKey: '<your-private-key>',
  });

  const outout = await sdk.FundV2().deposit({
    contractAddress: "0x358f8203f102edef499ac197d76f29f7c40c5714",
    amount: 1000,
    slippage: 1,
  });
}

deposit();
```


### for FundV2 withdraw,
```
import { SmartContractSdk } from "@xwin-finance/sdk";

const withdraw = async () => {
  const sdk = await SmartContractSdk.start({
    rpcUrl: '<selected-rpc-url>',
    privateKey: '<your-private-key>',
  });

  const outout = await sdk.FundV2().withdraw({
    contractAddress: "0x358f8203f102edef499ac197d76f29f7c40c5714",
    amount: 1000,
    slippage: 1,
  });
}

withdraw();
```


### for FundV2 rebalance,
```
import { SmartContractSdk } from "@xwin-finance/sdk";

const rebalance = async () => {
  const sdk = await SmartContractSdk.start({
    rpcUrl: '<selected-rpc-url>',
    privateKey: '<your-private-key>',
  });

  const outout = await sdk.FundV2().rebalance({
    contractAddress: "0x358f8203f102edef499ac197d76f29f7c40c5714",
    toAddress: ["0x358f8203f102edef499ac197d76f29f7c40ccas4"],
    targets: ["10"],
    slippage: 1,
  });
}

rebalance();
```


### for FundV2 rebalance,
```
import { SmartContractSdk } from "@xwin-finance/sdk";

const getFundWeightsData = async () => {
  const sdk = await SmartContractSdk.start({
    rpcUrl: '<selected-rpc-url>',
    privateKey: '<your-private-key>',
  });

  const outout = await sdk.FundV2().getFundWeightsData("0x358f8203f102edef499ac197d76f29f7c40c5714");
}

getFundWeightsData();
```

## Docs
please refer to the docs for more references
- [types docs](https://download.xwin.finance/docs/@xwin-finance/sdk/latest/index.html)