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

        let allSupportedMarkets = ["0x8aee1d27D906895cc771380ba5a49bbD421DD5a0", "0x5480c79F4a02657E33586751A66c331F0230bB2D", "0x974aD9A05376AE8daF072E037746a80114F3a0C8", "0x891672f0b855B55b20ea3732c1FBDf389E712829", "0x5B07F2582d0Cc26E400D56266aeBB201c93560eD"];
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
