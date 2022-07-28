const ChainlinkAdaptor = artifacts.require("ChainlinkAdaptor")
const Qstroller = artifacts.require("Qstroller");
const Unitroller = artifacts.require("Unitroller");
const CErc20 = artifacts.require("CErc20");
const QsConfig = artifacts.require("QsConfig");

module.exports = async function(callback) {
    try {
        let unitrollerInstance = await Unitroller.deployed();
        let proxiedQstroller = await Qstroller.at(unitrollerInstance.address);
        let allSupportedMarkets = await proxiedQstroller.getAllMarkets();
        let qstrollerAdmin = await proxiedQstroller.admin();
        console.log("qstrollerAdmin: ", qstrollerAdmin);
        let priceOracleAddress = await proxiedQstroller.oracle();
        let priceInstance = await ChainlinkAdaptor.at(priceOracleAddress);
        let oracleAdmin = await priceInstance.governance();
        console.log("oracleAdmin: ", oracleAdmin);
        let qsConfigAddress = await proxiedQstroller.qsConfig();
        let qsConfigInstance = await QsConfig.at(qsConfigAddress);
        let qsConfigAdmin = await qsConfigInstance.owner();
        console.log("qsConfigAdmin: ", qsConfigAdmin);
        let safetyGuardian = await qsConfigInstance.safetyGuardian();
        console.log("safetyGuardian: ", safetyGuardian);

        for (market of allSupportedMarkets) {
            let cTokenInstance = await CErc20.at(market);
            let cTokenName = await cTokenInstance.name();
            let cTokenAdmin = await cTokenInstance.admin();
            console.log(cTokenName, "admin: ", cTokenAdmin);
            let pendingAdmin = await cTokenInstance.pendingAdmin();
            console.log(cTokenName, market, "pendingAdmin: ", pendingAdmin);
        }
        callback();
    } catch (e) {
        console.log(e);
        callback(e);
    }
}