const PriceOracle = artifacts.require("QsPriceOracle")
const Qstroller = artifacts.require("Qstroller");
const CToken = artifacts.require("CToken");

const argv = require('yargs').option('comptroller', {string:true}).argv;

module.exports = async function(callback) {
    try {
        console.log(`argv> comptroller=${argv.comptroller}`);
        let proxiedQstroller = await Qstroller.at(argv.comptroller);
        let priceOracleAddress = await proxiedQstroller.oracle();
        let priceInstance = await PriceOracle.at(priceOracleAddress);
        console.log("priceOracleAddress: ", priceOracleAddress);
        // let newPriceInstance = await PriceOracle.at("0x0DDD1956278d80165051805f3B688EF3C4C288A3");
        let allSupportedMarkets = await proxiedQstroller.getAllMarkets();
        console.log("allSupportedMarkets size: ", allSupportedMarkets.length);
        for (market of allSupportedMarkets) {
            let cTokenInstance = await CToken.at(market);
            let cTokenName = await cTokenInstance.name();
            let price = await priceInstance.getUnderlyingPrice(market)
            // let newPrice = await newPriceInstance.getUnderlyingPrice(market)
            console.log(`${cTokenName} ${market} old price: ${price}`)
            // console.log(`${cTokenName} ${market} new price: ${newPrice}`)
        }
        callback();
    } catch (e) {
        console.log(e);
        callback(e);
    }
}