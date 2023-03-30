const BigNumber = require('bignumber.js')

const Qstroller = artifacts.require("Qstroller");
const Unitroller = artifacts.require("Unitroller");
const BitWise = artifacts.require("BitWise");
const Timelock = artifacts.require("Timelock");
const MultisigWallet = artifacts.require("MultisigWallet"); 


const compSpeedsData = [
    {
        fToken: '0xF31AD464E61118c735E6d3C909e7a42DAA1575A3', // ELA
        supplySpeed: '15240960000000000',
        borrowSpeed: '1693440000000000'
    },
    {
        fToken: '0x2b9f49361aB609bA7de1ec8cd6c970cDBb19cA66', // BTCB
        supplySpeed: '846720000000000',
        borrowSpeed: '362880000000000'
    },
    {
        fToken: '0x42C8A982f42b6069AD310e9910468B593247eace', // HUSD
        supplySpeed: '0',
        borrowSpeed: '0'
    },
    {
        fToken: '0x21c376438dA428F730249aEe27F4454358429974', // BUSD
        supplySpeed: '69431040000000000',
        borrowSpeed: '29756160000000000'
    },
    {
        fToken: '0xb064f6336F747b9ECDdAEadA9964E9d123BDB01B', // ETH
        supplySpeed: '846720000000000',
        borrowSpeed: '362880000000000'
    },
    {
        fToken: '0x7bC72d7780C2E811814e81FFac828d53f4CDe7c2', // USDC
        supplySpeed: '71124480000000000',
        borrowSpeed: '30481920000000000'
    },
    {
        fToken: '0x105Fe752cAD216d2b4CAd5d42d8ec6966d6bcC95', // HUSD-USDC
        supplySpeed: '0',
        borrowSpeed: '0'
    },
    {
        fToken: '0x7726E2698cb021A6066bC1357243AF3AFd146b83', // USDC-ELA
        supplySpeed: '6048000000000000',
        borrowSpeed: '0'
    },
    {
        fToken: '0xAfBFCbF4D52030CD9AB582d29182E706c0Cc7879', // ETH-ELA
        supplySpeed: '4838400000000000',
        borrowSpeed: '0'
    },
    {
        fToken: '0x2a5f3727Ea5b834D5b9846204D8Bc6b4849cA197', // BUSD-USDC
        supplySpeed: '10886400000000000',
        borrowSpeed: '0'
    }
]

module.exports = async function(callback) {
    // let timelockAdress = "0xDE27eFB2B75291be14d269939e801912182a045C";
    let multisigAdmin = "0x500708A336Eb407639FE9b39a83D7a077FFb35D0";
    let multisigInstance = await MultisigWallet.at(multisigAdmin);

    try {
        let allTokens = [];
        let allCompSpeeds = [];
        let bitWiseInstance = await BitWise.at("0xb387733A6C42507AF2ac40C6f2Af48406e212C07")
        let sum = BigInt(0)
        for (let i = 0; i < compSpeedsData.length; i++) {
            console.log(`${compSpeedsData[i].fToken} => `, compSpeedsData[i])
            sum += BigInt(compSpeedsData[i].borrowSpeed)
            sum += BigInt(compSpeedsData[i].supplySpeed)

            let compSpeed = await bitWiseInstance.merge(compSpeedsData[i].borrowSpeed, compSpeedsData[i].supplySpeed);
            console.log("compSpeed: ", compSpeed.toString())
            allTokens.push(compSpeedsData[i].fToken)
            allCompSpeeds.push(compSpeed.toString())
        }
        console.log(`CompRate: ${sum}`)
        // console.log("allTokens: ", allTokens, "allCompSpeeds: ", allCompSpeeds)
        let unitrollerInstance = await Unitroller.deployed();
        console.log("unitrollerInstance: ", unitrollerInstance.address);
        let proxiedQstroller = await Qstroller.at(unitrollerInstance.address);
        // await proxiedQstroller._setCompSpeeds(allTokens, allCompSpeeds);

        // let timelockInstance = await Timelock.at(timelockAdress)
        // let delay = await timelockInstance.delay();
        // let latestBlock = await web3.eth.getBlock("latest");
        // let timestamp = parseInt(latestBlock.timestamp);
        // console.log("timestamp: ", timestamp)
        // let eta = timestamp + parseInt(delay) + 16200;
        // console.log("Eta: ", eta)

        let setCompSpeedsEncode = proxiedQstroller.contract.methods._setCompSpeeds(allTokens, allCompSpeeds).encodeABI()
        await multisigInstance.submitTransaction(unitrollerInstance.address, 0, setCompSpeedsEncode);
        console.log("setCompSpeedsEncode submitted")

        // await timelockInstance.queueTransaction(proxiedQstroller.address, 0, '', setCompSpeedsEncode, eta)
        // console.log("setCompSpeedsEncode queued")

        // let eta = 1642581105
        // await timelockInstance.executeTransaction(proxiedQstroller.address, 0, '', setCompSpeedsEncode, eta)
        // console.log("Done to update compSpeeds")

        // let queueTxEncoded = await timelockInstance.contract.methods.queueTransaction(unitrollerInstance.address, 0,'', setCompSpeedsEncode, eta).encodeABI()
        // console.log("queueTxEncoded: ", queueTxEncoded)
        // let execTxEncoded = await timelockInstance.contract.methods.executeTransaction(unitrollerInstance.address, 0,'', setCompSpeedsEncode, eta).encodeABI()
        // console.log("execTxEncoded: ", execTxEncoded)
        // let walletInstance = await MultisigWallet.at(MultisigWalletAddress);
        // await walletInstance.submitTransaction(timelockAdress, 0, queueTxEncoded);
        // console.log("Done to submit transaction to queue comp speeds setting");
        // await walletInstance.submitTransaction(timelockAdress, 0, execTxEncoded);
        // console.log("Done to submit transaction to do comp speeds setting");
        callback();
    } catch (e) {
        console.log(e);
        callback(e);
    }
}