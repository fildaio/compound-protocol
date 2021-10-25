const Qstroller = artifacts.require("Qstroller");
const Unitroller = artifacts.require("Unitroller");
const QsConfig = artifacts.require("QsConfig");

module.exports = async function(callback) {
    try {
       let currentQsConfig = "0x3CDd62735E3282D07f8bcD6bc3B1a55B5D28eddA";
       let qsConfig = await QsConfig.new(currentQsConfig);
       let newControllerInstance = await Qstroller.new();
       let unitrollerInstance = await Unitroller.deployed();
       let impl = await unitrollerInstance.comptrollerImplementation();
       console.log(`old implementation: ${impl}`, );
       await unitrollerInstance._setPendingImplementation(newControllerInstance.address);
       await newControllerInstance._become(unitrollerInstance.address);
       impl = await unitrollerInstance.comptrollerImplementation();
       console.log(`new implementation: ${impl}`);
        let proxiedQstroller = await Qstroller.at(unitrollerInstance.address);
        await proxiedQstroller._setQsConfig(qsConfig.address);
        let configuredQsConfig = await proxiedQstroller.qsConfig();
        let allSupportedMarkets = await proxiedQstroller.getAllMarkets();
        console.log("allSupportedMarkets: ", allSupportedMarkets);
        console.log("qsConfig: ", configuredQsConfig);
       callback();
    } catch (e) {
        console.log(e);
        callback(e);
    }
}