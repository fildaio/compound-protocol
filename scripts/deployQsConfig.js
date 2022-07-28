const QsConfig = artifacts.require("QsConfig");
const Unitroller = artifacts.require("Unitroller");
const Qstroller = artifacts.require("Qstroller");

module.exports = async function(callback) {
    try {
        let qsControllerInstance = await Qstroller.at(Unitroller.address);
        let currentQsConfigAddress = await qsControllerInstance.qsConfig();
        console.log(`Current QsConfig address: `, currentQsConfigAddress)
        let newQsConfigInstance = await QsConfig.new(currentQsConfigAddress);
        await qsControllerInstance._setQsConfig(newQsConfigInstance.address);
        console.log(`Done to set QsConfig to ${newQsConfigInstance.address} from ${currentQsConfigAddress}`);
        callback();
    } catch (e) {
        callback(e);
    }
}
