const Qstroller = artifacts.require("Qstroller");
const erc20Delegate = artifacts.require("CErc20Delegate");
const erc20Delegator = artifacts.require("CErc20Delegator");
const Unitroller = artifacts.require("Unitroller");
const erc20Token = artifacts.require("EIP20Interface");

const argv = require('yargs').option('token', {string:true}).argv;

let reserveFactor = 0.15e18.toString();
let underlyingTokenAddr = "0x";
let collateralFactor = 0.8e18.toString();
// let interestModelAddress = "0x789d92E7D549214a3ECDcfEABAE750f3b44F1adD"; // testnet
let interestModelAddress = "0x37755AB447699a52b48cb82a961b2Df95e7963FC"; // mainnet
module.exports = async function(callback) {
    try {
        console.log(`argv> token=${argv.token}, collateralFactor=${argv.collateralFactor}`);
        underlyingTokenAddr = argv.token
        collateralFactor = argv.collateralFactor

        let erc20 = await erc20Token.at(underlyingTokenAddr);
        let decimals = await erc20.decimals();
        let symbol = await erc20.symbol();
        symbol = symbol.replace('"','');
        symbol = symbol.replace('"','');
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
