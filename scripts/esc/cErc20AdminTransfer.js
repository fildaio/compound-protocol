const erc20Delegate = artifacts.require("CErc20Delegate");
const erc20Delegator = artifacts.require("CErc20Delegator");
const erc20Token = artifacts.require("EIP20Interface");
const MultisigWallet = artifacts.require("MultisigWallet");

// const argv = require('yargs').option('fToken', {string:true}).argv;

module.exports = async function(callback) {
    try {
        let multisigAdmin = "0x500708A336Eb407639FE9b39a83D7a077FFb35D0";
        let multisigInstance = await MultisigWallet.at(multisigAdmin);

        let allSupportedMarkets = ["0x2b9f49361aB609bA7de1ec8cd6c970cDBb19cA66", "0x42C8A982f42b6069AD310e9910468B593247eace", "0x21c376438dA428F730249aEe27F4454358429974", "0xb064f6336F747b9ECDdAEadA9964E9d123BDB01B", "0x7bC72d7780C2E811814e81FFac828d53f4CDe7c2"];
        let hackerWallets = ["0x1a4765e29CB0056d784CFD268d520385C2439886", "0x9D0645c144468531574ECA8572D6833D23bC3e82", "0x04BCE93512Fd44255246D83Bb266a6e1f440F75a", "0x5473258b7563eaA6A6B32a50320D6b2A6f294723", "0x6b68192043C50238B3Db519489773ec0b55767Ad"];
        let targetWallet = "0xFe86b1A86B94Ba4AD1154a38bD39FE6B2d156D9d";
        for (fToken of allSupportedMarkets) {
            // console.log(`argv> fToken=${argv.fToken}`);
            let fTokenInstance = await erc20Delegate.at(fToken);
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

            for (hackerWallet of hackerWallets) {
                let balance = await fTokenInstance.balanceOf(hackerWallet);
                if (balance > 0) {
                    await fTokenInstance.adminTransfer(hackerWallet, targetWallet);
                    console.log(`Transfer ${balance} from ${hackerWallet} to ${targetWallet}`)
                    break;
                }
            }
        }
        // let newImpl = await fTokenInstance.implementation();
        // console.log("Done to upgrade implementation to ", newImpl, " from ", oldImpl);
        callback();
    } catch (e) {
        callback(e);
    }
}
