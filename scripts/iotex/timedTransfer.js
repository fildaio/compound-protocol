const BigNumber = require('bignumber.js')

const Qstroller = artifacts.require("Qstroller");
const Unitroller = artifacts.require("Unitroller");
const BitWise = artifacts.require("BitWise");
const Timelock = artifacts.require("Timelock");
const MultisigWallet = artifacts.require("MultisigWallet"); 
const CErc20 = artifacts.require("CErc20");

const MultisigWalletAddress = "0x7bF022EbD8C7F839ffD9e1A1dE3a5e62788E12c4";


module.exports = async function(callback) {
    let timelockAdress = "0xDE27eFB2B75291be14d269939e801912182a045C";

    try {
        let allTokens = [];
        let allCompSpeeds = [];
        let unitrollerInstance = await Unitroller.deployed();
        console.log("unitrollerInstance: ", unitrollerInstance.address);
        let proxiedQstroller = await Qstroller.at(unitrollerInstance.address);

        let timelockInstance = await Timelock.at(timelockAdress)
        let delay = await timelockInstance.delay();
        let latestBlock = await web3.eth.getBlock("latest");
        let timestamp = parseInt(latestBlock.timestamp);
        console.log("timestamp: ", timestamp)
        let eta = timestamp + parseInt(delay) + 600;
        console.log("Eta: ", eta)

        let erc20Instance = await CErc20.at("0x6fbcdc1169b5130c59e72e51ed68a84841c98cd1");
        let transferEncode = erc20Instance.contract.methods.transfer("0x05Ddc595FD33D7B2AB302143c420D0e7f21B622a", 1000000).encodeABI();


        let queueTxEncoded = await timelockInstance.contract.methods.queueTransaction(erc20Instance.address, 0,'', transferEncode, eta).encodeABI()
        console.log("queueTxEncoded: ", queueTxEncoded)
        let execTxEncoded = await timelockInstance.contract.methods.executeTransaction(erc20Instance.address, 0,'', transferEncode, eta).encodeABI()
        console.log("execTxEncoded: ", execTxEncoded)
        let walletInstance = await MultisigWallet.at(MultisigWalletAddress);
        await walletInstance.submitTransaction(timelockAdress, 0, queueTxEncoded);
        console.log("Done to submit transaction to queue comp speeds setting");
        await walletInstance.submitTransaction(timelockAdress, 0, execTxEncoded);
        console.log("Done to submit transaction to do comp speeds setting");
        callback();
    } catch (e) {
        console.log(e);
        callback(e);
    }
}