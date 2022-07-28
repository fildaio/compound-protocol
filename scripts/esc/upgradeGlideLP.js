const QsGlideLPDelegate = artifacts.require("QsGlideLPDelegate");
const erc20Delegator = artifacts.require("CErc20Delegator");
const erc20Token = artifacts.require("EIP20Interface");
const UniswapPair = artifacts.require("IUniswapV2Pair");

const argv = require('yargs').option('token', {string:true})
                             .option('fToken', {string:true})
                             .argv;

let lpPid;
let underlyingTokenAddr = "";

const StakingPoolAddress = '0x7F5489f77Bb8515DE4e0582B60Eb63A7D9959821';
const fTokenStorageAddress = '0x3745A5A808734D9bC2b2c8dF0f72910BF7F50b25';

module.exports = async function(callback) {
    try {
        console.log(`argv> pid=${argv.pid}, token=${argv.token}, fToken=${argv.fToken}`);
        lpPid = argv.pid;
        underlyingTokenAddr = argv.token
        let fTokenAddress = argv.fToken

        const pairInstance = await UniswapPair.at(underlyingTokenAddr);
        const token0 = await pairInstance.token0();
        const token1 = await pairInstance.token1();

        const erc20Token0 = await erc20Token.at(token0);
        const symbol0 = await erc20Token0.symbol();

        const erc20Token1 = await erc20Token.at(token1);
        const symbol1 = await erc20Token1.symbol();

        let erc20 = await erc20Token.at(underlyingTokenAddr);
        let decimals = await erc20.decimals();

        let fTokenName = "Filda " + symbol0 + "-" + symbol1 + " LP";
        let fTokenSymbol = "f" + symbol0 + "-" + symbol1 + "LP";
        console.log(`TokenDecimals: ${decimals}`)
        console.log(`Token0Symbol: ${symbol0}`);
        console.log(`Token1Symbol: ${symbol1}`);
        console.log(`fTokenName: ${fTokenName}`)
        console.log(`fTokenSymbol: ${fTokenSymbol}`)
        console.log(`lpPid: ${lpPid}`)

        let newLPDelegate = await QsGlideLPDelegate.new();
        let fTokenInstance = await erc20Delegator.at(fTokenAddress);
        let oldImpl = await fTokenInstance.implementation();

        const data = web3.eth.abi.encodeParameters(
            ['address', 'uint'],
            [StakingPoolAddress, lpPid]);

        await fTokenInstance._setImplementation(newLPDelegate.address, false, data);
        let newImpl = await fTokenInstance.implementation();
        console.log("Done to upgrade implementation to ", newImpl, " from ", oldImpl);

        callback();
    } catch (e) {
        callback(e);
    }
}
