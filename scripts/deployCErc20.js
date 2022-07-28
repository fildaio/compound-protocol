const Qstroller = artifacts.require("Qstroller");
const erc20Delegate = artifacts.require("CErc20Delegate");
const erc20Delegator = artifacts.require("CErc20Delegator");
const Unitroller = artifacts.require("Unitroller");
const erc20Token = artifacts.require("EIP20Interface");

const argv = require('yargs').option('token', {string:true}).argv;

let reserveFactor = 0.15e18.toString();
let underlyingTokenAddr = "0x";
let collateralFactor = 0.05e18.toString();
let interestModelAddress = "0x61a43F8F65ef35D28e63EaDB0224B08944d75AFB"; //BSC
interestModelAddress = "0x5CaB5eA2E616D9D8ed89b3420540f21Cc5ac7698"; //IoTeX
interestModelAddress = "0x37755AB447699a52b48cb82a961b2Df95e7963FC"; // ELA
// interestModelAddress = "0x34dcfA32dF1332aCB9c2f677F366e73CEF6F1C9B"; //ArbitrumTest
// interestModelAddress = "0x6c906E555802161Ecd2042dCCF0446aaDB90D86A"; //Arbitrum
module.exports = async function(callback) {
    try {
        console.log(`argv> token=${argv.token}, collateralFactor=${argv.collateralFactor}`);
        underlyingTokenAddr = argv.token
        collateralFactor = argv.collateralFactor

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
        let admin = await qsControllerInstance.admin();
        let newErc20Delegate = await erc20Delegate.new();
        let fTokenInstance = await erc20Delegator.new(underlyingTokenAddr, Unitroller.address, interestModelAddress, initialExchange.toString(), fTokenName, fTokenSymbol, 18, admin, newErc20Delegate.address, "0x0");
        await fTokenInstance._setReserveFactor(reserveFactor);

        await qsControllerInstance._supportMarket(fTokenInstance.address);
        console.log(`Done to support market ${fTokenSymbol}: ${fTokenInstance.address}`);

        await qsControllerInstance._setCollateralFactor(fTokenInstance.address, collateralFactor);
        console.log("Done to set collateral factor %s for %s %s", collateralFactor, fTokenSymbol, fTokenInstance.address);

        //await qsControllerInstance._setMintPaused(fTokenInstance.address, true)
        //console.log("MintPaused: ", await qsControllerInstance.mintGuardianPaused(fTokenInstance.address))
        callback();
    } catch (e) {
        callback(e);
    }
}
