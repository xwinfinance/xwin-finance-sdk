# @xwin-finance/sdk
A SDK package that develop by xwin-finance team.

### Installation
```
npm install @xwin-finance/sdk
```

## Example of Usage
for deposit,
```
const response = await new SmartContractSdk.FundV2(
  "https://bsc-dataseed1.binance.org"
).deposit({
  privateKey: "put your private key here",
  collectionAddress: "put your collection address here",
  amount: 1,
  slippage: 100,
});
```
