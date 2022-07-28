const ChainlinkAdaptor = artifacts.require("ChainlinkAdaptor")
const Qstroller = artifacts.require("Qstroller");
const Unitroller = artifacts.require("Unitroller");
const CErc20 = artifacts.require("CErc20");

const argv = require('yargs').option('comptroller', {string:true}).argv;

module.exports = async function(callback) {
    try {
        console.log(`argv> comptroller=${argv.comptroller}`);
        let proxiedQstroller = await Qstroller.at(argv.comptroller);
        let priceOracleAddress = await proxiedQstroller.oracle();
        let priceInstance = await ChainlinkAdaptor.at(priceOracleAddress);
        let allSupportedMarkets = await proxiedQstroller.getAllMarkets();
        let nativeTokenPriceSource = await priceInstance.nativeTokenPriceSource();
        let assets = [];
        let priceSources = [];
        for (market of allSupportedMarkets) {
            let cTokenInstance = await CErc20.at(market);
            let cTokenName = await cTokenInstance.name();
            let price = await priceInstance.getUnderlyingPrice(market)
            let totalSupply = await cTokenInstance.totalSupply();
            let isNative = await cTokenInstance.isNativeToken();
            if (isNative || totalSupply <= 0) continue;
            let underlyingToken = await cTokenInstance.underlying();
            let linkPriceSource = await priceInstance.assetsPriceSources(underlyingToken);
            if (linkPriceSource == "0x0000000000000000000000000000000000000000") continue;
            console.log("cTokenName ", cTokenName, " underlying ", underlyingToken, " link sources ", linkPriceSource)
            assets.push(underlyingToken);
            priceSources.push(linkPriceSource);
            console.log(`${cTokenName} ${market} price: ${price}`)
        }
        let fallbackPriceOracle = await priceInstance.fallbackPriceOracle();

        // let newPriceInstance = await ChainlinkAdaptor.at("0x0DDD1956278d80165051805f3B688EF3C4C288A3");
        let newPriceInstance = await ChainlinkAdaptor.new(nativeTokenPriceSource);
        await newPriceInstance.setFallbackPriceOracle(fallbackPriceOracle);
        await newPriceInstance.setAssetSources(assets, priceSources);
        console.log("fallbackPriceOracle: ", fallbackPriceOracle)
        console.log("assets: ", assets, " priceSources: ", priceSources)
        console.log("assets size: ", assets.length)
        console.log("new ChainlinAdaptor: ", newPriceInstance.address);
        callback();
    } catch (e) {
        console.log(e);
        callback(e);
    }
}