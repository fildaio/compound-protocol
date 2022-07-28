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

        let allSupportedMarkets = ["0x789B328c5Be205Ae4B8ae4bc6ff01442a1eC8DAF", "0xF55e123A0AB286EC337853df39065eC969a42Fb7", "0xd2417f4B0CFd9E3B169abC8265c52011aC0C4848", "0x5B07F2582d0Cc26E400D56266aeBB201c93560eD", "0xFD0c6b70C4dA159F24Ffa64f209CfdbbA9595A79"];
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
