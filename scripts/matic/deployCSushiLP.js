const Qstroller = artifacts.require("Qstroller");
const QsSushiLPDelegate = artifacts.require("QsSushiLPDelegate");
const erc20Delegator = artifacts.require("CErc20Delegator");
const Unitroller = artifacts.require("Unitroller");
const erc20Token = artifacts.require("EIP20Interface");
const UniswapPair = artifacts.require("IUniswapV2Pair");

const argv = require('yargs').option('token', {string:true}).argv;

let reserveFactor = 0.4e18.toString();
let lpPid;
let underlyingTokenAddr = "";
let collateralFactor = 0.8e18.toString();
let interestModelAddress = "0x195A4dFE3a8F877c5f0f7Ca7baA36B4301113130";

const sushiPool = '0x0769fd68dFb93167989C6f7254cd0D766Fb2841F';
let fTokenStorageAddr = "0xb0B34cb2D5C7Ef5B8f730d3D40300bfdBcCe731F";

module.exports = async function(callback) {
    try {
        console.log(`argv> pid=${argv.pid}, lptoken=${argv.token}, collateralFactor=${argv.collateralFactor}`);
        pid = argv.pid;
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

        let fTokenName = "Filda SUSHI " + symbol0 + "-" + symbol1 + " LP";
        let fTokenSymbol = "fSUSHI" + symbol0 + "-" + symbol1 + "LP";
        let initialExchange = 0.02 * 10 ** decimals;
        console.log(`TokenDecimals: ${decimals}`)
        console.log(`Token0Symbol: ${symbol0}`);
        console.log(`Token1Symbol: ${symbol1}`);
        console.log(`fTokenName: ${fTokenName}`)
        console.log(`fTokenSymbol: ${fTokenSymbol}`)

        let qsControllerInstance = await Qstroller.at(Unitroller.address);
        let admin = await qsControllerInstance.admin();
        let newLPDelegate = await QsSushiLPDelegate.new();
        const data = web3.eth.abi.encodeParameters(
            ['address', 'uint', 'address'],
            [sushiPool, lpPid, fTokenStorageAddr]);
        let fTokenInstance = await erc20Delegator.new(underlyingTokenAddr, Unitroller.address, interestModelAddress, initialExchange.toString(), fTokenName, fTokenSymbol, 18, admin, newLPDelegate.address, data);
        await fTokenInstance._setReserveFactor(reserveFactor);

        await qsControllerInstance._supportMarket(fTokenInstance.address);
        console.log(`Done to support market ${fTokenSymbol}: ${fTokenInstance.address}`);

        await qsControllerInstance._setCollateralFactor(fTokenInstance.address, collateralFactor);
        console.log("Done to set collateral factor %s for %s %s", collateralFactor, fTokenSymbol, fTokenInstance.address);

        await qsControllerInstance._setMintPaused(fTokenInstance.address, true)
        console.log("MintPaused: ", await qsControllerInstance.mintGuardianPaused(fTokenInstance.address))
        callback();
    } catch (e) {
        callback(e);
    }
}
