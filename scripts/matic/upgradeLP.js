const Qstroller = artifacts.require("Qstroller");
const erc20Delegate = artifacts.require("CErc20Delegate");
const erc20Delegator = artifacts.require("CErc20Delegator");
const Unitroller = artifacts.require("Unitroller");
const erc20Token = artifacts.require("EIP20Interface");

const argv = require('yargs').option('fToken', {string:true})
                             .option('newImpl', {string:true}).argv;

let underlyingTokenAddr = "0x";
module.exports = async function(callback) {
    try {
        console.log(`argv> fToken=${argv.fToken} newImpl=${argv.newImpl}`);
        let fToken = argv.fToken;
        let newImplAddress = argv.newImpl;
        let fTokenInstance = await erc20Delegator.at(fToken);
        underlyingTokenAddr = await fTokenInstance.underlying();
        console.log("underlyingTokenAddr: ", underlyingTokenAddr);
        let erc20 = await erc20Token.at(underlyingTokenAddr);
        let decimals = await erc20.decimals();
        let symbol = await erc20.symbol();
        let fTokenName = "FilDA " + symbol;
        let fTokenSymbol = "f" + symbol.charAt(0).toUpperCase() + symbol.slice(1)
        console.log(`TokenDecimals: ${decimals}`)
        console.log(`TokenSymbol: ${symbol}`);
        console.log(`fTokenName: ${fTokenName}`)
        console.log(`fTokenSymbol: ${fTokenSymbol}`)

        // const Pool = '0x3c1f53fed2238176419F8f897aEc8791C499e3c8';
        // const FTokenStorage = '0xb0B34cb2D5C7Ef5B8f730d3D40300bfdBcCe731F';
        // const data = web3.eth.abi.encodeParameters(
        //     ['address', 'address'],
        //     [Pool, FTokenStorage]);
        // let oldImpl = await fTokenInstance.implementation();
        // await fTokenInstance._setImplementation(newImplAddress, false, data);
        // let newImpl = await fTokenInstance.implementation();
        // console.log("Done to upgrade implementation to ", newImpl, " from ", oldImpl);
        callback();
    } catch (e) {
        callback(e);
    }
}
