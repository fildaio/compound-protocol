const Qstroller = artifacts.require("Qstroller");
const erc20Delegate = artifacts.require("QsBorrowCapCErc20Delegate");
const erc20Delegator = artifacts.require("CErc20Delegator");
const Unitroller = artifacts.require("Unitroller");
const erc20Token = artifacts.require("EIP20Interface");

const argv = require('yargs').option('token', {string:true}).argv;

let reserveFactor = 0.15e18.toString();
let underlyingTokenAddr = "";
let collateralFactor = 0.3e18.toString();
let borrowCap = 500000e8.toString();
let interestModelAddress = "0x8850596ad5c654aF7d14e3C040129eca0D7B4a43";
module.exports = async function(callback) {
    try {
        console.log(`argv> token=${argv.token}`);
        underlyingTokenAddr = argv.token
        // collateralFactor = argv.collateralFactor

        let erc20 = await erc20Token.at(underlyingTokenAddr);
        let decimals = await erc20.decimals();
        let symbol = await erc20.symbol();
        let fTokenName = "Filda " + symbol;
        let fTokenSymbol = "f" + symbol.charAt(0).toUpperCase() + symbol.slice(1)
        let initialExchange = 0.02 * 10 ** decimals;
        console.log(`TokenDecimals: ${decimals}`)
        console.log(`TokenSymbol: ${symbol}`);
        console.log(`fTokenName: ${fTokenName}`)
        console.log(`fTokenSymbol: ${fTokenSymbol}`)

        let qsControllerInstance = await Qstroller.at(Unitroller.address);
        // let admin = await qsControllerInstance.admin();
        let admin = "0x05Ddc595FD33D7B2AB302143c420D0e7f21B622a";
        let newErc20Delegate = await erc20Delegate.new();
        let fTokenInstance = await erc20Delegator.new(underlyingTokenAddr, Unitroller.address, interestModelAddress, initialExchange.toString(), fTokenName, fTokenSymbol, 18, admin, newErc20Delegate.address, "0x0");
        await fTokenInstance._setReserveFactor(reserveFactor);
        //fTokenInstance = newErc20Delegate.at(fTokenInstance.address);
        //await fTokenInstance._setBorrowCap(borrowCap);
        console.log(`Done to create market ${fTokenSymbol}: ${fTokenInstance.address}`)

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
