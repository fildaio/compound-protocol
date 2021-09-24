const QsMdxLPOracle = artifacts.require("QsMdxLPOracle");
const ChainlinkAdaptor = artifacts.require("ChainlinkAdaptor");
const UniswapPair = artifacts.require("IUniswapV2Pair");
const erc20Token = artifacts.require("EIP20Interface");

const adaptor = '0xA7042D87b25b18875cD1d2b1CE535C5488bc4Fd0';

const argv = require('yargs').option('token', {string:true}).argv;
let lpTokenAddr = '';

module.exports = async function(callback) {
    try {
        console.log(`argv> lptoken=${argv.token}`);
        lpTokenAddr = argv.token

        const pairInstance = await UniswapPair.at(lpTokenAddr);
        const token0 = await pairInstance.token0();
        const token1 = await pairInstance.token1();

        const erc20Token0 = await erc20Token.at(token0);
        const symbol0 = await erc20Token0.symbol();

        const erc20Token1 = await erc20Token.at(token1);
        const symbol1 = await erc20Token1.symbol();

        const adaptorInstance = await ChainlinkAdaptor.at(adaptor);
        const token0Source = await adaptorInstance.assetsPriceSources(token0);
        const token1Source = await adaptorInstance.assetsPriceSources(token1);
        const description = symbol0 + "-" + symbol1 + " LP / USD";

        console.log(`token0Source: ${token0Source}`)
        console.log(`token1Source: ${token1Source}`)
        console.log(`oracle description: ${description}`)

        await deployer.deploy(QsMdxLPOracle,
            8, // decimals
            description, // description
            token0Source, // token0
            token1Source, // token1
            lpTokenAddr  // pair
            );

        let assets = new Array();
        assets.push(lpTokenAddr);
        let sources = new Array();
        sources.push(QsMdxLPOracle.address);
        await adaptorInstance.setAssetSources(assets, sources);

        callback();
    } catch (e) {
        callback(e);
    }
}