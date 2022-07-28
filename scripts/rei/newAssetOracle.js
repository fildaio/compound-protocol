const QsElaAssetOracle = artifacts.require("QsElaAssetOracle");
const erc20Token = artifacts.require("EIP20Interface");
const ChainlinkAdaptor = artifacts.require("ChainlinkAdaptor");
const Qstroller = artifacts.require("Qstroller");
const Unitroller = artifacts.require("Unitroller");

const assets = [
    '0x2545AF3D8b11e295bB7aEdD5826021AB54F71630', // WREI
    '0x8059E671Be1e76f8db5155bF4520f86ACfDc5561', // WBTC
    '0x988a631Caf24E14Bb77EE0f5cA881e8B5dcfceC7', // USDT
    '0x8d5E1225981359E2E09A3AB8F599A51486f53314', // USDC
    '0x7a5313468c1C1a3Afb2Cf5ec46558A7D0fc2884A', // ETH
    '0x0ba85980B122353D77fBb494222a10a46E4FB1f6', // DAI
    '0x02CD448123E3Ef625D3A3Eb04A30E6ACa29C7786', // BUSD
]

const prices = [
    '0x7cfB238C628f321bA905D1beEc2bfB18AE56Fcdb', // WREI
    '0xF31AD464E61118c735E6d3C909e7a42DAA1575A3', // WBTC
    '0x65019969b8308F062548d25B1483adD15c582d5B', // USDT
    '0x5480c79F4a02657E33586751A66c331F0230bB2D', // USDC
    '0xD2D64E34a5d9c59983DC817a83834F86990CD744', // WETH
    '0x56c0fA757820C2d9Df35CF2874F3268FE717e92f', // DAI
    '0xa182AC4BEcbC8c26250260AaC6c179C4626DE559', // BUSD
  ]  

module.exports = async function(callback) {
    try {
        // let prices = [];
        // for (let asset of assets) {
 
        //     let erc20 = await erc20Token.at(asset);
        //     let symbol = await erc20.symbol();
        //     let decimals = 8;
        //     let desc = symbol + " price oracle";
        //     let baseOracle = "0x5CaB5eA2E616D9D8ed89b3420540f21Cc5ac7698";

        //     let elaAssetOracleInstance = await QsElaAssetOracle.new(decimals, desc, baseOracle, asset);
        //     prices.push(elaAssetOracleInstance.address);
        //     console.log("Done to create asset oracle ", elaAssetOracleInstance.address, " for ", symbol, " ", asset);
        // }
        // console.log("prices: ", prices);

        let qsControllerInstance = await Qstroller.at(Unitroller.address);

        let ChainlinkAdaptorInstance = await ChainlinkAdaptor.new("0x7cfB238C628f321bA905D1beEc2bfB18AE56Fcdb");
        await ChainlinkAdaptorInstance.setAssetSources(assets, prices);
        await ChainlinkAdaptorInstance.setFallbackPriceOracle("0x5CaB5eA2E616D9D8ed89b3420540f21Cc5ac7698");
        console.log("Done to init ChainlinkAdaptorInstance: ", ChainlinkAdaptorInstance.address);

        let oldPriceOracle = await qsControllerInstance.oracle();
        await qsControllerInstance._setPriceOracle(ChainlinkAdaptorInstance.address);
        let newPriceOracle = await qsControllerInstance.oracle();
        console.log("Price oracle is changed to ", newPriceOracle, " from ", oldPriceOracle);
        callback();
    } catch (e) {
        console.log(e);
        callback(e);
    }
}