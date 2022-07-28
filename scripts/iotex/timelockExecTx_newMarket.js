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
        let eta = 1642575985
        console.log("Eta: ", eta)


        let unitrollerInstance = await Unitroller.deployed();
        let qsControllerInstance = await Qstroller.at(unitrollerInstance.address);
        let supportMarketEncode = await qsControllerInstance.contract.methods._supportMarket(fTokenAddress).encodeABI();
        console.log("supportMarketEncode: ", supportMarketEncode)
        let setCollateralFactorEncode = await qsControllerInstance.contract.methods._setCollateralFactor(fTokenAddress, collateralFactor).encodeABI();
        console.log("setCollateralFactorEncode: ", setCollateralFactorEncode)
        let setBorrowPausedEncode = await qsControllerInstance.contract.methods._setBorrowPaused(fTokenAddress, true).encodeABI();
        console.log("setBorrowPausedEncode: ", setBorrowPausedEncode)

        // await timelockInstance.executeTransaction(qsControllerInstance.address, 0, '', supportMarketEncode, eta)
        // console.log(`Done to support market ${fTokenAddress}`);
        await timelockInstance.executeTransaction(qsControllerInstance.address, 0, '', setCollateralFactorEncode, eta)
        console.log("Done to set collateral factor %s for %s", collateralFactor, fTokenAddress);
        await timelockInstance.executeTransaction(qsControllerInstance.address, 0, '', setBorrowPausedEncode, eta)
        console.log("MintPaused: ", await qsControllerInstance.borrowGuardianPaused(fTokenAddress))

        // let unitrollerInstance = await Unitroller.at(Unitroller.address);
        // let timelockAddress = "0xF9fA00130Dd6435c6948eb53Afa2094fA968C001";
        // let setPendingAdminEncode = await unitrollerInstance.contract.methods._setPendingAdmin(timelockAddress).encodeABI();
        // console.log("setPendingAdminEncode: ", setPendingAdminEncode)

        callback();
    } catch (e) {
        callback(e);
    }
}