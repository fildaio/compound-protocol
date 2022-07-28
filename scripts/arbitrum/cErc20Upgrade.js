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

        let allSupportedMarkets = ["0x5CaB5eA2E616D9D8ed89b3420540f21Cc5ac7698", "0x541a9133c24bFAb3BD55742b1F16B507b1FBBf44", "0x7cfB238C628f321bA905D1beEc2bfB18AE56Fcdb", "0x56c0fA757820C2d9Df35CF2874F3268FE717e92f", "0xDC17Ee4Ef70317433d8083dA696E63b46721b6B9", "0xcA7D7F202894e851e495beBCD2A62E0898dD1814", "0xeA1Ca194fF0d211F86fB8E9D8BE985e35Cd16968"];
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
