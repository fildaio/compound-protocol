const Qstroller = artifacts.require("Qstroller");
const Unitroller = artifacts.require("Unitroller");
const CToken = artifacts.require("CToken");

module.exports = async function(callback) {
    try {
        let unitrollerInstance = await Unitroller.deployed();
        // let proxiedQstroller = await Qstroller.at("0x0AD0bee939E00C54f57f21FBec0fBa3cDA7DEF58");
        let proxiedQstroller = await Qstroller.at(unitrollerInstance.address);
        let allSupportedMarkets = await proxiedQstroller.getAllMarkets();
        let tokens = [];
        let compSpeeds = [];
        for (market of allSupportedMarkets) {
            let cTokenInstance = await CToken.at(market);
            let cTokenName = await cTokenInstance.name();
            let compSpeed = await proxiedQstroller.compSpeeds(market);
            let mintPaused = await proxiedQstroller.mintGuardianPaused(market)
            //console.log(`${cTokenName} ${market} mintPaused: ${mintPaused}`);
            //if (compSpeed <= 0) continue;
            let marketState = await proxiedQstroller.markets(market);
            let collateralRatio = marketState['collateralFactorMantissa'].toString()
            let borrowFactorMantissa = marketState['borrowFactorMantissa'].toString()
            let liquidationIncentiveMantissa = marketState['liquidationIncentiveMantissa'].toString()
            console.log(`${cTokenName} ${market} collateralFactor: ${collateralRatio} borrowFactorMantissa: ${borrowFactorMantissa} liquidationIncentiveMantissa: ${liquidationIncentiveMantissa}`);
        }
        callback();
    } catch (e) {
        console.log(e);
        callback(e);
    }
}