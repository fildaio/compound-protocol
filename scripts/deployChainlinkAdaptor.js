const chainlinkAdaptor = artifacts.require("ChainlinkAdaptor")
const Qstroller = artifacts.require("Qstroller");
const CErc20 = artifacts.require("CErc20"); 

const argv = require('yargs').option('comptroller', {string:true}).argv;

module.exports = async function(callback) {
    try {
        console.log(`argv> linkAdaptor=${argv.linkAdaptor} comptroller=${argv.comptroller}`);
        let proxiedQstroller = await Qstroller.at(comptroller);
        let priceOracleAddress = await proxiedQstroller.oracle();
        let priceInstance = await ChainlinkAdaptor.at(priceOracleAddress);
        let allSupportedMarkets = await proxiedQstroller.getAllMarkets();
        let existingLinkAdaptorInstance = await chainlinkAdaptor.at(priceOracleAddress);
        let nativeTokenPriceSource = await existingLinkAdaptorInstance.nativeTokenPriceSource();

        await chainlinkAdaptorInstance.setAssetSources(assets, priceSources);
        callback();
    } catch (e) {
        console.log(e);
        callback(e);
    }
}