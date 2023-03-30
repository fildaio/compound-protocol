const QsPriceOracleForEla = artifacts.require("QsPriceOracleForEla");

module.exports = async function(callback) {
    try {
        const wIoTeX = "0xa00744882684c3e4747faefd68d283ea44099d03";

        let QsPriceOracleForElaInstance = await QsPriceOracleForEla.new(wIoTeX);
        console.log("Done to create QsPriceOracleForElaInstance: ", QsPriceOracleForElaInstance.address);
        callback();
    } catch (e) {
        console.log(e);
        callback(e);
    }
}