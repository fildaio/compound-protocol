const wrappedNativeDelegate = artifacts.require("CWrappedNativeDelegate");
const wrappedNativeDelegator = artifacts.require("CWrappedNativeDelegator");
const erc20Token = artifacts.require("EIP20Interface");

const argv = require('yargs').option('fToken', {string:true}).argv;

module.exports = async function(callback) {
    try {
        console.log(`argv> fToken=${argv.fToken}`);
        let fTokenInstance = await wrappedNativeDelegator.at(argv.fToken);
        let underlyingTokenAddr = await fTokenInstance.underlying();
        let erc20 = await erc20Token.at(underlyingTokenAddr);
        let decimals = await erc20.decimals();
        let symbol = await erc20.symbol();
        let fTokenName = "FilDA " + symbol;
        let fTokenSymbol = "f" + symbol.charAt(0).toUpperCase() + symbol.slice(1)
        console.log(`TokenDecimals: ${decimals}`)
        console.log(`TokenSymbol: ${symbol}`);
        console.log(`fTokenName: ${fTokenName}`)
        console.log(`fTokenSymbol: ${fTokenSymbol}`)

        let newErc20Delegate = await wrappedNativeDelegate.new();
        // let newErc20Delegate = "0xEc1e6e331e990a0D8e40AC51f773e9c998ec7BC3";
        let oldImpl = await fTokenInstance.implementation();
        // await fTokenInstance._setImplementation(newErc20Delegate.address, false, "0x0");
                await fTokenInstance._setImplementation(newErc20Delegate.address, false, "0x0");

        let newImpl = await fTokenInstance.implementation();
        console.log("Done to upgrade implementation to ", newImpl, " from ", oldImpl);
        callback();
    } catch (e) {
        callback(e);
    }
}
