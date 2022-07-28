const erc20Delegate = artifacts.require("CErc20Delegate");
const erc20Delegator = artifacts.require("CErc20Delegator");
const erc20Token = artifacts.require("EIP20Interface");
const MultisigWallet = artifacts.require("MultisigWallet");
const Unitroller = artifacts.require("Unitroller");
const Qstroller = artifacts.require("Qstroller");


// const argv = require('yargs').option('fToken', {string:true}).argv;

module.exports = async function(callback) {
    try {
        // let multisigAdmin = "0x500708A336Eb407639FE9b39a83D7a077FFb35D0";
        // let multisigInstance = await MultisigWallet.at(multisigAdmin);

        let allSupportedMarkets = ["0x7280faEc8C4a6ABbb3414e31015AC108113363A4", "0xb9542aDd6d6049Ae59Ce39e45Fb2EC88797931E7", "0x0Ab290A1EBF33F21d7c5d0F9B4CEE940921FDfC0", "0xA200126e00A53a4a05533fF0Cfb16b3788524A3e", "0x3DbFAE35cd0E5bF812e715a863F2CDc2D2546119", "0x6C524c36D5dc475A2bb4658c6Ea09b2DbCBefB50", "0x35121329dcb7e884b5C8ac3095f833BC99E66874"];
        let proxiedQstroller = await Qstroller.at(Unitroller.address);
        // let allSupportedMarkets = await proxiedQstroller.getAllMarkets();
        for (fToken of allSupportedMarkets) {
            // console.log(`argv> fToken=${argv.fToken}`);
            let fTokenInstance = await erc20Delegator.at(fToken);
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

            let newErc20Delegate = await erc20Delegate.new();
            let oldImpl = await fTokenInstance.implementation();
            await fTokenInstance._setImplementation(newErc20Delegate.address, false, "0x0");
            let newImpl = await fTokenInstance.implementation();
            console.log("Done to upgrade impl to ", newImpl, " from ", oldImpl);

            // let setImplEncode = await fTokenInstance.contract.methods._setImplementation(newErc20Delegate.address, false, "0x0").encodeABI();
            // multisigInstance.submitTransaction(fTokenInstance.address, 0, setImplEncode);
            // console.log("Done to submit multisig transaction to upgrade impl to ", newErc20Delegate.address, " from ", oldImpl);
        }
        // let newImpl = await fTokenInstance.implementation();
        // console.log("Done to upgrade implementation to ", newImpl, " from ", oldImpl);
        callback();
    } catch (e) {
        callback(e);
    }
}
