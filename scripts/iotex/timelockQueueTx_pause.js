const Qstroller = artifacts.require("Qstroller");
const Unitroller = artifacts.require("Unitroller");
const Timelock = artifacts.require("Timelock");
const CErc20 = artifacts.require("CErc20");
const MultisigWallet = artifacts.require("MultisigWallet"); 

module.exports = async function(callback) {
    try {
        let multisigWallet = "0x7bF022EbD8C7F839ffD9e1A1dE3a5e62788E12c4";
        let timelockAdress = "0xDE27eFB2B75291be14d269939e801912182a045C";
        let timelockInstance = await Timelock.at(timelockAdress)
        let delay = await timelockInstance.delay();
        let latestBlock = await web3.eth.getBlock("latest");
        let timestamp = parseInt(latestBlock.timestamp);
        console.log("timestamp: ", timestamp)
        let eta = timestamp + parseInt(delay) + 1800;
        console.log("Eta: ", eta)
        let unitrollerInstance = await Unitroller.deployed();
        let qsControllerInstance = await Qstroller.at(unitrollerInstance.address);
        let fTokenAddress = "0xcA7D7F202894e851e495beBCD2A62E0898dD1814";
        let collateralFactor = "850000000000000000";
        let setCollateralFactorEncode = await qsControllerInstance.contract.methods._setCollateralFactor(fTokenAddress, collateralFactor).encodeABI();
        console.log("setCollateralFactorEncode: ", setCollateralFactorEncode)
        let setBorrowPausedEncode = await qsControllerInstance.contract.methods._setBorrowPaused(fTokenAddress, false).encodeABI();
        console.log("setBorrowPausedEncode: ", setBorrowPausedEncode)
        let queueTxEncoded = await timelockInstance.contract.methods.queueTransaction(unitrollerInstance.address, 0, '', setBorrowPausedEncode, eta).encodeABI();
        let execTxEncoded = await timelockInstance.contract.methods.executeTransaction(unitrollerInstance.address, 0, '', setBorrowPausedEncode, eta).encodeABI();

        let walletInstance = await MultisigWallet.at(multisigWallet);
        await walletInstance.submitTransaction(timelockAdress, 0, queueTxEncoded);
        console.log("Done to submit transaction to queueTxEncoded");
        await walletInstance.submitTransaction(timelockAdress, 0, execTxEncoded);
        console.log("Done to submit transaction to execTxEncoded");
        // await walletInstance.submitTransaction(cTokenInstance.address, 0, setInterestRateEncode);

        // let unitrollerInstance = await Unitroller.deployed();
        // let encodedMethod = await unitrollerInstance.contract.methods._acceptAdmin().encodeABI();
        // console.log("unitrollerInstance._acceptAdmin encoded: ", encodedMethod)
        // await timelockInstance.queueTransaction(unitrollerInstance.address, 0, '', encodedMethod, eta)

        
        // let proxiedQstroller = await Qstroller.at(unitrollerInstance.address);
        // let allSupportedMarkets = await proxiedQstroller.getAllMarkets();
        // for (market of allSupportedMarkets) {
        //     let cTokenInstance = await CErc20.at(market);
        //     let cTokenName = await cTokenInstance.name();
        //     let cTokenAdmin = await cTokenInstance.admin();
        //     encodedMethod = await cTokenInstance.contract.methods._acceptAdmin().encodeABI();
        //     console.log("cTokenInstance._acceptAdmin encoded: ", encodedMethod)
        //     await timelockInstance.queueTransaction(cTokenInstance.address, 0, '', encodedMethod, eta)
        //     console.log("Timelock queued done for: ", market, " ", cTokenName)
        // }


        // let encodedMethod = await timelockInstance.contract.methods.setPendingAdmin(multisigWallet).encodeABI();
        // console.log("encodedMethod: ", encodedMethod)
        // await timelockInstance.queueTransaction(timelockAdress, 0, '', encodedMethod, eta)


        // let unitrollerInstance = await Unitroller.at(Unitroller.address);
        // let timelockAddress = "0xF9fA00130Dd6435c6948eb53Afa2094fA968C001";
        // let setPendingAdminEncode = await unitrollerInstance.contract.methods._setPendingAdmin(timelockAddress).encodeABI();
        // console.log("setPendingAdminEncode: ", setPendingAdminEncode)

        callback();
    } catch (e) {
        callback(e);
    }
}