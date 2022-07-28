const Qstroller = artifacts.require("Qstroller");
const Unitroller = artifacts.require("Unitroller");
const CErc20 = artifacts.require("CErc20");


module.exports = async function(callback) {
    try {
        let timelockAdress = "0xDE27eFB2B75291be14d269939e801912182a045C";
        let unitrollerInstance = await Unitroller.deployed();
        await unitrollerInstance._setPendingAdmin(timelockAdress);
        let pendingAdmin = await unitrollerInstance.pendingAdmin();
        console.log(`pendingAdmin for ${unitrollerInstance.address}: ${pendingAdmin}`)

        let proxiedQstroller = await Qstroller.at(unitrollerInstance.address);
        let allSupportedMarkets = await proxiedQstroller.getAllMarkets();

        for (market of allSupportedMarkets) {
            let cTokenInstance = await CErc20.at(market);
            let cTokenName = await cTokenInstance.name();
            let cTokenAdmin = await cTokenInstance.admin();
            console.log(cTokenName, " current admin: ", cTokenAdmin);
            await cTokenInstance._setPendingAdmin(timelockAdress);
            let pendingAdmin = await cTokenInstance.pendingAdmin();
            console.log(cTokenName, " pendingAdmin: ", pendingAdmin);
        }

        callback();
    } catch (e) {
        console.log(e);
        callback(e);
    }
}