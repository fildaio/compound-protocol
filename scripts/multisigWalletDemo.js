const Qstroller = artifacts.require("Qstroller");
const Unitroller = artifacts.require("Unitroller");
const Timelock = artifacts.require("Timelock");

module.exports = async function(callback) {
    try {
        let qsControllerInstance = await Qstroller.at("0xb74633f2022452f377403B638167b0A135DB096d");
        // //console.log(qsControllerInstance);
        let encodedMethod = await qsControllerInstance.contract.methods._setBorrowPaused("0x0c81DC01D4886ACeE14D0a0506C26D4B3525B0B1", true).encodeABI();
        console.log("encodedMethod: ", encodedMethod);
        encodedMethod = await qsControllerInstance.contract.methods._setPriceOracle("0xD85790Ece23B0a585788310c27b4c29694d7caF8").encodeABI();
        console.log("_setPriceOracle encodedMethod: ", encodedMethod);

        // let timelockInstance = await Timelock.at("0xF9fA00130Dd6435c6948eb53Afa2094fA968C001")
        // let setDelayEncode = await timelockInstance.contract.methods.setDelay(43200).encodeABI();
        // console.log("setDelayEncode: ", setDelayEncode)

        // let acceptAdminEncode = await timelockInstance.contract.methods.acceptAdmin().encodeABI();
        // console.log("acceptAdminEncode: ", acceptAdminEncode)

        // let unitrollerInstance = await Unitroller.at(Unitroller.address);
        // let timelockAddress = "0xF9fA00130Dd6435c6948eb53Afa2094fA968C001";
        // let setPendingAdminEncode = await unitrollerInstance.contract.methods._setPendingAdmin(timelockAddress).encodeABI();
        // console.log("setPendingAdminEncode: ", setPendingAdminEncode)

        callback();
    } catch (e) {
        callback(e);
    }
}