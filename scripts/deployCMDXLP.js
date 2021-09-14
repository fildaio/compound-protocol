const Qstroller = artifacts.require("Qstroller");
const QsMdxLPDelegate = artifacts.require("QsMdxLPDelegate");
const erc20Delegator = artifacts.require("CErc20Delegator");
const Unitroller = artifacts.require("Unitroller");
const erc20Token = artifacts.require("EIP20Interface");
const UniswapPair = artifacts.require("IUniswapV2Pair");

const argv = require('yargs').option('token', {string:true}).argv;

let reserveFactor = 0.4e18.toString();
let lpPid;
let underlyingTokenAddr = "";
let collateralFactor = 0.8e18.toString();
let interestModelAddress = "0xc43940f47f04b3935d7C1d51c90199924acbc944";

const HecoPoolAddress = '0xfb03e11d93632d97a8981158a632dd5986f5e909';
const fMdxAddress = '0x5788C014D41cA706DE03969E283eE7b93827B7B1';

module.exports = async function(callback) {
    try {
        console.log(`argv> pid=${argv.pid}, lptoken=${argv.token}, collateralFactor=${argv.collateralFactor}`);
        pid = argv.pid;
        underlyingTokenAddr = argv.token
        collateralFactor = argv.collateralFactor

        const pairInstance = await UniswapPair.at(lpTokenAddr);
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
        let admin = await qsControllerInstance.admin();
        let newLPDelegate = await QsMdxLPDelegate.new();
        const data = web3.eth.abi.encodeParameters(
            ['address', 'address', 'uint'],
            [HecoPoolAddress, fMdxAddress, lpPid]);
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
