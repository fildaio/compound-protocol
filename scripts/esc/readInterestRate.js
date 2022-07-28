const CommonJumpInterestModel = artifacts.require("CommonJumpInterestModel");
const CToken = artifacts.require("CToken");
const Qstroller = artifacts.require("Qstroller");
const Unitroller = artifacts.require("Unitroller");

// const baseRatePerYear = 0.01e18.toString();
// const multiplierPerYear = 0.1e18.toString();
// const jumpMultiplierPerYear = 1e18.toString();
// const kink = 0.99e18.toString();
const reserveFactor = 0.35e18.toString();

const baseRatePerYear = 0.001e18.toString();
const multiplierPerYear = 0.01e18.toString();
const jumpMultiplierPerYear = 0.01e18.toString();
const kink = 0.99e18.toString();

module.exports = async function(callback) {
    try {
        // 12 * 60 * 24 * 365 (BlockTime: 5s)
        const blocksPerYear = 6307200;
        // let allSupportedMarkets = ["0xF31AD464E61118c735E6d3C909e7a42DAA1575A3", "0x42C8A982f42b6069AD310e9910468B593247eace", "0x7bC72d7780C2E811814e81FFac828d53f4CDe7c2"]
        let unitrollerInstance = "0xE52792E024697A6be770e5d6F1C455550265B2CD"
        let proxiedQstroller = await Qstroller.at(unitrollerInstance);
        let allSupportedMarkets = await proxiedQstroller.getAllMarkets();
        for (market of allSupportedMarkets) {
            let cTokenInstance = await CToken.at(market);
            let cTokenName = await cTokenInstance.name();
        //     console.log(`cTokenName: ${cTokenName}`)
        //     let oldInterestModelAddr = await cTokenInstance.contract.methods.interestRateModel().call({},11967317);
        //     console.log(oldInterestModelAddr)
        // //     //if (oldInterestModelAddr != "0x9f76E988eE3a0d5F13c9bd693F72CF8c203E3b9c") continue;
        //     console.log(`oldInterestModel ${oldInterestModelAddr} for token ${cTokenName} : ${cTokenInstance.address}`);

            let oldCTokenBalance = await cTokenInstance.contract.methods.balanceOf("0xc49220f0EEEc095101554C7f86eCC0da1f2e1687").call({},11967317);
            let oldExchangeRate = await cTokenInstance.contract.methods.exchangeRateStored().call({},11967317);
            console.log(`Token ${cTokenName} oldCTokenBalance ${oldCTokenBalance} oldExchangeRate ${oldExchangeRate}`)
            // let newCTokenBalance = await cTokenInstance.contract.methods.balanceOf("0xc49220f0EEEc095101554C7f86eCC0da1f2e1687").call({},11967361);
            // let newExchangeRate = await cTokenInstance.contract.methods.exchangeRateStored().call({},11967361);
            // console.log(`Token ${cTokenName} newCTokenBalance ${newCTokenBalance} newExchangeRate ${newExchangeRate}`)

            let latestCTokenBalance = await cTokenInstance.contract.methods.balanceOf("0xc49220f0EEEc095101554C7f86eCC0da1f2e1687").call();
            let latestExchangeRate = await cTokenInstance.contract.methods.exchangeRateStored().call({},11967317);
            console.log(`Token ${cTokenName} latestCTokenBalance ${oldCTokenBalance} latestExchangeRate ${oldExchangeRate}`)
        }
        callback();
    } catch (e) {
        console.log(e);
        callback(e);
    }
}