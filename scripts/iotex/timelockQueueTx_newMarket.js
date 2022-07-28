const Qstroller = artifacts.require("Qstroller");
const Unitroller = artifacts.require("Unitroller");
const Timelock = artifacts.require("Timelock");
const CErc20 = artifacts.require("CErc20");

module.exports = async function(callback) {
    try {
        let multisigWallet = "0x7bF022EbD8C7F839ffD9e1A1dE3a5e62788E12c4";
        let timelockAdress = "0xDE27eFB2B75291be14d269939e801912182a045C";
        let fTokenAddress = "0x6429303B3C394BE140E81a56bfac87c1C2267E45";
        let collateralFactor = "650000000000000000"

        let timelockInstance = await Timelock.at(timelockAdress)
        let delay = await timelockInstance.delay();
        let latestBlock = await web3.eth.getBlock("latest");
        let timestamp = parseInt(latestBlock.timestamp);
        console.log("timestamp: ", timestamp)
        let eta = timestamp + parseInt(delay) + 600;
        console.log("Eta: ", eta)

        let unitrollerInstance = await Unitroller.deployed();
        let qsControllerInstance = await Qstroller.at(unitrollerInstance.address);
        let supportMarketEncode = await qsControllerInstance.contract.methods._supportMarket(fTokenAddress).encodeABI();
        console.log("supportMarketEncode: ", supportMarketEncode)
        let setCollateralFactorEncode = await qsControllerInstance.contract.methods._setCollateralFactor(fTokenAddress, collateralFactor).encodeABI();
        console.log("setCollateralFactorEncode: ", setCollateralFactorEncode)
        let setBorrowPausedEncode = await qsControllerInstance.contract.methods._setBorrowPaused(fTokenAddress, true).encodeABI();
        console.log("setBorrowPausedEncode: ", setBorrowPausedEncode)

        await timelockInstance.queueTransaction(qsControllerInstance.address, 0, '', supportMarketEncode, eta)
        console.log("supportMarketEncode queued")
        await timelockInstance.queueTransaction(qsControllerInstance.address, 0, '', setCollateralFactorEncode, eta)
        console.log("setCollateralFactorEncode queued")
        await timelockInstance.queueTransaction(qsControllerInstance.address, 0, '', setBorrowPausedEncode, eta)
        console.log("setBorrowPausedEncode queued")

        callback();
    } catch (e) {
        callback(e);
    }
}