const Qstroller = artifacts.require("Qstroller");
const Unitroller = artifacts.require("Unitroller");
const Timelock = artifacts.require("Timelock");
const CErc20 = artifacts.require("CErc20");

module.exports = async function(callback) {
    try {
        let multisigWallet = "0x7bF022EbD8C7F839ffD9e1A1dE3a5e62788E12c4";
        let timelockAdress = "0xDE27eFB2B75291be14d269939e801912182a045C";
 

        let timelockInstance = await Timelock.at(timelockAdress)
        let eta = 1642387345
        console.log("Eta: ", eta)

        // let unitrollerInstance = await Unitroller.deployed();
        // let encodedMethod = await unitrollerInstance.contract.methods._acceptAdmin().encodeABI();
        // console.log("unitrollerInstance._acceptAdmin encoded: ", encodedMethod)

        // await timelockInstance.executeTransaction(unitrollerInstance.address, 0, '', encodedMethod, eta)
        // let admin = await unitrollerInstance.admin();
        // console.log("unitrollerInstance.admin: ", admin)

        // let proxiedQstroller = await Qstroller.at(unitrollerInstance.address);
        // let allSupportedMarkets = await proxiedQstroller.getAllMarkets();
        // for (market of allSupportedMarkets) {
        //     let cTokenInstance = await CErc20.at(market);
        //     let cTokenName = await cTokenInstance.name();
        //     let cTokenAdmin = await cTokenInstance.admin();
        //     console.log(cTokenName, " ", market," admin before timelock exec: ", cTokenAdmin)
        //     encodedMethod = await cTokenInstance.contract.methods._acceptAdmin().encodeABI();
        //     console.log("cTokenInstance._acceptAdmin encoded: ", encodedMethod)
        //     await timelockInstance.executeTransaction(cTokenInstance.address, 0, '', encodedMethod, eta)
        //     console.log("Timelock exec done for: ", market, " ", cTokenName)
        //     cTokenAdmin = await cTokenInstance.admin();
        //     console.log(cTokenName, " ", market," admin after timelock exec: ", cTokenAdmin)
        // }


        let encodedMethod = await timelockInstance.contract.methods.setPendingAdmin(multisigWallet).encodeABI();
        console.log("encodedMethod: ", encodedMethod)
        await timelockInstance.executeTransaction(timelockAdress, 0, '', encodedMethod, eta)
        let pendingAdmin = await timelockInstance.pendingAdmin();
        console.log("timelock pendingAdmin: ", pendingAdmin);

        // let unitrollerInstance = await Unitroller.at(Unitroller.address);
        // let timelockAddress = "0xF9fA00130Dd6435c6948eb53Afa2094fA968C001";
        // let setPendingAdminEncode = await unitrollerInstance.contract.methods._setPendingAdmin(timelockAddress).encodeABI();
        // console.log("setPendingAdminEncode: ", setPendingAdminEncode)

        callback();
    } catch (e) {
        callback(e);
    }
}