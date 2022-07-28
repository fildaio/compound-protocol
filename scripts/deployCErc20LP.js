const Qstroller = artifacts.require("Qstroller");
const erc20Delegate = artifacts.require("CErc20Delegate");
const erc20Delegator = artifacts.require("CErc20Delegator");
const Unitroller = artifacts.require("Unitroller");
const erc20Token = artifacts.require("EIP20Interface");
const UniswapPair = artifacts.require("IUniswapV2Pair");


const argv = require('yargs').option('token', {string:true}).argv;

let reserveFactor = 0.15e18.toString();
let underlyingTokenAddr = "0x";
let collateralFactor = 0.05e18.toString();
let interestModelAddress = "0x61a43F8F65ef35D28e63EaDB0224B08944d75AFB"; //BSC
interestModelAddress = "0x5CaB5eA2E616D9D8ed89b3420540f21Cc5ac7698"; //IoTeX
// interestModelAddress = "0x34dcfA32dF1332aCB9c2f677F366e73CEF6F1C9B"; //ArbitrumTest
// interestModelAddress = "0x6c906E555802161Ecd2042dCCF0446aaDB90D86A"; //Arbitrum
module.exports = async function(callback) {
    try {
        console.log(`argv> token=${argv.token}, collateralFactor=${argv.collateralFactor}`);
        underlyingTokenAddr = argv.token
        collateralFactor = argv.collateralFactor

        const pairInstance = await UniswapPair.at(underlyingTokenAddr);
        const token0 = await pairInstance.token0();
        const token1 = await pairInstance.token1();

        const erc20Token0 = await erc20Token.at(token0);
        const symbol0 = await erc20Token0.symbol();

        const erc20Token1 = await erc20Token.at(token1);
        const symbol1 = await erc20Token1.symbol();

        let erc20 = await erc20Token.at(underlyingTokenAddr);
        let decimals = await erc20.decimals();

        let fTokenName = "Filda " + symbol0 + "-" + symbol1 + " LP";
        let fTokenSymbol = "f" + symbol0 + "-" + symbol1 + "LP";
        let initialExchange = 0.02 * 10 ** decimals;

        console.log(`TokenDecimals: ${decimals}`)
        console.log(`Token0Symbol: ${symbol0}`);
        console.log(`Token1Symbol: ${symbol1}`);
        console.log(`fTokenName: ${fTokenName}`)
        console.log(`fTokenSymbol: ${fTokenSymbol}`)

        let qsControllerInstance = await Qstroller.at(Unitroller.address);
        // let admin = await qsControllerInstance.admin();
        let admin = "0x05Ddc595FD33D7B2AB302143c420D0e7f21B622a"
        console.log(`admin: ${admin}`);
        let newErc20Delegate = await erc20Delegate.new();
        console.log(`newErc20Delegate: ${newErc20Delegate.address}`);
        console.log(`underlyingTokenAddr: ${underlyingTokenAddr} Unitroller: ${Unitroller.address} interestModelAddress: ${interestModelAddress}, initialExchange: ${initialExchange.toString()} fTokenName: ${fTokenName} fTokenSymbol: ${fTokenSymbol} admin: ${admin} newErc20Delegate: ${newErc20Delegate.address}`)
        let fTokenInstance = await erc20Delegator.new(underlyingTokenAddr, Unitroller.address, interestModelAddress, initialExchange.toString(), fTokenName, fTokenSymbol, 18, admin, newErc20Delegate.address, "0x0");
        await fTokenInstance._setReserveFactor(reserveFactor);
        console.log("fTokenInstance deployed: ", fTokenInstance.address)

        // await qsControllerInstance._supportMarket(fTokenInstance.address);
        // console.log(`Done to support market ${fTokenSymbol}: ${fTokenInstance.address}`);

        // await qsControllerInstance._setCollateralFactor(fTokenInstance.address, collateralFactor);
        // console.log("Done to set collateral factor %s for %s %s", collateralFactor, fTokenSymbol, fTokenInstance.address);
        
        // await qsControllerInstance._setBorrowPaused(fTokenInstance.address, true)
        // console.log("MintPaused: ", await qsControllerInstance.borrowGuardianPaused(fTokenInstance.address))
        //await qsControllerInstance._setMintPaused(fTokenInstance.address, true)
        //console.log("MintPaused: ", await qsControllerInstance.mintGuardianPaused(fTokenInstance.address))
        callback();
    } catch (e) {
        callback(e);
    }
}
