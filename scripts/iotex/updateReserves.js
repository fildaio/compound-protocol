const Qstroller = artifacts.require("Qstroller");
const CToken = artifacts.require("CToken");
const Unitroller = artifacts.require("Unitroller");
const reserveFactor = 0.15e18.toString();
module.exports = async function(callback) {
    try {
        let unitrollerInstance = await Unitroller.deployed();
        let proxiedQstroller = await Qstroller.at(unitrollerInstance.address);
        //let allSupportedMarkets = await proxiedQstroller.getAllMarkets();
        let allSupportedMarkets = ["0x8aee1d27D906895cc771380ba5a49bbD421DD5a0"]
        for (market of allSupportedMarkets) {
            let cTokenInstance = await CToken.at(market);
            let compSpeed = await proxiedQstroller.compSpeeds(market);
            if (compSpeed <= 0) continue;
            let cTokenName = await cTokenInstance.name();
            console.log(`cTokenName: ${cTokenName}`)
            await cTokenInstance._setReserveFactor(reserveFactor);
            console.log(`reserveFactor is set to ${reserveFactor} for ${cTokenName} : ${cTokenInstance.address}`);
        }
        callback();
    } catch (e) {
        console.log(e);
        callback(e);
    }
}