const CToken = artifacts.require("CToken");
const Qstroller = artifacts.require("Qstroller");
const Unitroller = artifacts.require("Unitroller");

module.exports = async function(callback) {
    try {
        let allSupportedMarkets = ["0x2b9f49361aB609bA7de1ec8cd6c970cDBb19cA66", "0x42C8A982f42b6069AD310e9910468B593247eace", "0x21c376438dA428F730249aEe27F4454358429974", "0xb064f6336F747b9ECDdAEadA9964E9d123BDB01B", "0x7bC72d7780C2E811814e81FFac828d53f4CDe7c2"];
        let unitrollerInstance = "0xE52792E024697A6be770e5d6F1C455550265B2CD";
        let newAdmin = "0x500708A336Eb407639FE9b39a83D7a077FFb35D0";
        // let newAdmin = "0x05Ddc595FD33D7B2AB302143c420D0e7f21B622a";
        let proxiedQstroller = await Qstroller.at(unitrollerInstance);
        //let allSupportedMarkets = await proxiedQstroller.getAllMarkets();
        for (market of allSupportedMarkets) {
            let cTokenInstance = await CToken.at(market);
            let cTokenName = await cTokenInstance.name();
            console.log(`cTokenName: ${cTokenName}`)
            await cTokenInstance._setPendingAdmin(newAdmin);
            console.log(`set pending admin to ${newAdmin} for token ${cTokenName} : ${cTokenInstance.address}`);
        }
        callback();
    } catch (e) {
        console.log(e);
        callback(e);
    }
}