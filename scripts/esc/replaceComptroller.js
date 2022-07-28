const Qstroller = artifacts.require("Qstroller");
const Unitroller = artifacts.require("Unitroller");

const argv = require('yargs').option('unitroller', {string:true}).argv;

module.exports = async function(callback) {
    try {
       console.log(`argv> unitroller=${argv.unitroller}`);
       let unitroller = argv.unitroller;
       let newControllerInstance = await Qstroller.new();
       let unitrollerInstance = await Unitroller.at(unitroller);
       let impl = await unitrollerInstance.comptrollerImplementation();
       console.log(`old implementation: ${impl}`, );
       await unitrollerInstance._setPendingImplementation(newControllerInstance.address);
       await newControllerInstance._become(unitrollerInstance.address);
       impl = await unitrollerInstance.comptrollerImplementation();
       console.log(`new implementation: ${impl}`);
        let proxiedQstroller = await Qstroller.at(unitrollerInstance.address);
        let allSupportedMarkets = await proxiedQstroller.getAllMarkets();
        console.log(allSupportedMarkets);
       callback();
    } catch (e) {
        console.log(e);
        callback(e);
    }
}