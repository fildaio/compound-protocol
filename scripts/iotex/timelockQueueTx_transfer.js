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
        let eta = timestamp + parseInt(delay) + 7200;
        console.log("Eta: ", eta)
        let underlyingToken = "0x84abcb2832be606341a50128aeb1db43aa017449";
        let newInterestModel = "0x7f0123d4F618A22f9dDa7D3C5EB02566048493B8";
        let cTokenInstance = await CErc20.at(underlyingToken); 
        let transferEncode = await cTokenInstance.contract.methods.transfer("0x65e37baa0ec0b146284c7856c14c8b9fd3a120a2", "15371061526632442000000").encodeABI();
        let queueTxEncoded = await timelockInstance.contract.methods.queueTransaction(cTokenInstance.address, 0, '', transferEncode, eta).encodeABI();
        let execTxEncoded = await timelockInstance.contract.methods.executeTransaction(cTokenInstance.address, 0, '', transferEncode, eta).encodeABI();

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