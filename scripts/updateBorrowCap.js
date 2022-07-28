const erc20Delegate = artifacts.require("QsBorrowCapCErc20Delegate");
const erc20Token = artifacts.require("EIP20Interface");

const argv = require('yargs').option('fToken', {string:true}).argv;

let borrowCap = 500000e8.toString();
let fTokenAddress = "";
module.exports = async function(callback) {
    try {
        console.log(`argv> fToken=${argv.fToken}`);
        fTokenAddress = argv.fToken

        let erc20 = await erc20Token.at(fTokenAddress);
        let fTokenSymbol = await erc20.symbol();
        let fTokenName = await erc20.name();
        console.log(`fTokenName: ${fTokenName}`)
        console.log(`fTokenSymbol: ${fTokenSymbol}`)

        let fTokenInstance = await erc20Delegate.at(fTokenAddress);
        await fTokenInstance._setBorrowCap(borrowCap);
        console.log(`Done to update borrow cap to ${borrowCap} for market ${fTokenSymbol}: ${fTokenInstance.address}`)

        // await qsControllerInstance._supportMarket(fTokenInstance.address);
        // console.log(`Done to support market ${fTokenSymbol}: ${fTokenInstance.address}`);

        // await qsControllerInstance._setCollateralFactor(fTokenInstance.address, collateralFactor);
        // console.log("Done to set collateral factor %s for %s %s", collateralFactor, fTokenSymbol, fTokenInstance.address);

        // await qsControllerInstance._setMintPaused(fTokenInstance.address, true)
        // console.log("MintPaused: ", await qsControllerInstance.mintGuardianPaused(fTokenInstance.address))
        callback();
    } catch (e) {
        callback(e);
    }
}
