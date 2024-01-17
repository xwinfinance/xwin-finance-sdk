import {convertToWei, getFastGasFee, getJsonRpcProvider} from './helpers';

describe('getJsonRpcProvider', () => {
  it('resolves as expected - Binance', async () => {
    // Pre

    // Action
    const output = await getJsonRpcProvider({
      rpcNodeUrl: 'https://bsc-dataseed1.binance.org',
    });
    // Assert

    expect(output).toMatchSnapshot();
  });

  it('resolves as expected - polygon', async () => {
    // Pre

    // Action
    const output = await getJsonRpcProvider({
      rpcNodeUrl: 'https://polygon-rpc.com',
    });
    // Assert

    expect(output).toMatchSnapshot();
  });

  it('resolves as expected - arbitrum', async () => {
    // Pre

    // Action
    const output = await getJsonRpcProvider({
      rpcNodeUrl: 'https://arbitrum-one.publicnode.com',
    });
    // Assert

    expect(output).toMatchSnapshot();
  });
});

describe('convertToWei', () => {
  it('resolves as expected', () => {
    // Pre
    const input = 3;

    // action
    const output = convertToWei(input);

    // Assert
    expect(output).toBe('3000000000');
  });
});

describe('getFastGasFee', () => {
  it.each([
    [{chainId: 56}],
    [{chainId: 97}],
    [{chainId: 31337}],
    [{chainId: 42161}],
    [{chainId: 10}],
  ])('resolves as expected by %s', async (val) => {
    // Pre
    // action
    const output = await getFastGasFee(val.chainId);

    // Assert
    expect(output).toMatchSnapshot();
  });
});
