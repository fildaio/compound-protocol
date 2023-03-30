const BigNumber = require('bignumber.js')

const Qstroller = artifacts.require("Qstroller");
const Unitroller = artifacts.require("Unitroller");
const BitWise = artifacts.require("BitWise");
const Timelock = artifacts.require("Timelock");
const MultisigWallet = artifacts.require("MultisigWallet"); 

const MultisigWalletAddress = "0x7bF022EbD8C7F839ffD9e1A1dE3a5e62788E12c4";


const compSpeedsData = [
    {
        fToken: '0x8aee1d27D906895cc771380ba5a49bbD421DD5a0', // IOTX
        supplySpeed: '13073183981481400',
        borrowSpeed: '0'
    },
    {
        fToken: '0x7cfB238C628f321bA905D1beEc2bfB18AE56Fcdb', // USDT
        supplySpeed: '13073183981481400',
        borrowSpeed: '52292735925925800'
    },
    {
        fToken: '0xcA7D7F202894e851e495beBCD2A62E0898dD1814', // USDC
        supplySpeed: '2287807196759260',
        borrowSpeed: '9151228787037040'
    },
    {
        fToken: '0xeA1Ca194fF0d211F86fB8E9D8BE985e35Cd16968', // ETH
        supplySpeed: '326829599537036',
        borrowSpeed: '1307318398148140'
    },
    {
        fToken: '0x9278C8D3159BAaABfdAeeA4DB61F830993211B51', // BTC
        supplySpeed: '326829599537036',
        borrowSpeed: '1307318398148140'
    },
    {
        fToken: '0xAeE67519049092AB91EFD033f7d350D62b9f166B', // BUSD_B
        supplySpeed: '13073183981481400',
        borrowSpeed: '52292735925925800'
    },
    {
        fToken: '0xD2C2E7A01497e223Af2DE23F8844f1499Fd4b30D', // CIOTX-WIOTX
        supplySpeed: '1634147997685180',
        borrowSpeed: '0'
    },
    {
        fToken: '0xe83E3Ec894eE3A0508D6b1aD93136D74f7c632b9', //  ioUSDT-WIOTX
        supplySpeed: '1634147997685180',
        borrowSpeed: '0'
    },
    {
        fToken: '0x6429303B3C394BE140E81a56bfac87c1C2267E45', //  ioETH-WIOTX
        supplySpeed: '1634147997685180',
        borrowSpeed: '0'
    },
]

module.exports = async function(callback) {
    let timelockAdress = "0xDE27eFB2B75291be14d269939e801912182a045C";

    try {
        let allTokens = [];
        let allCompSpeeds = [];
        let bitWiseInstance = await BitWise.at("0x940913158A59a7aE71C76A6D09fc75E957050442")
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
        console.log("allTokens: ", allTokens, "allCompSpeeds: ", allCompSpeeds)
        let unitrollerInstance = await Unitroller.deployed();
        console.log("unitrollerInstance: ", unitrollerInstance.address);
        let proxiedQstroller = await Qstroller.at(unitrollerInstance.address);
        // await proxiedQstroller._setCompSpeeds(allTokens, allCompSpeeds);

        let timelockInstance = await Timelock.at(timelockAdress)
        let delay = await timelockInstance.delay();
        let latestBlock = await web3.eth.getBlock("latest");
        let timestamp = parseInt(latestBlock.timestamp);
        console.log("timestamp: ", timestamp)
        let eta = timestamp + parseInt(delay) + 3600;
        console.log("Eta: ", eta)

        let setCompSpeedsEncode = proxiedQstroller.contract.methods._setCompSpeeds(allTokens, allCompSpeeds).encodeABI()
        // await timelockInstance.queueTransaction(proxiedQstroller.address, 0, '', setCompSpeedsEncode, eta)
        // console.log("setCompSpeedsEncode queued")

        // let eta = 1642581105
        // await timelockInstance.executeTransaction(proxiedQstroller.address, 0, '', setCompSpeedsEncode, eta)
        // console.log("Done to update compSpeeds")

        let queueTxEncoded = await timelockInstance.contract.methods.queueTransaction(unitrollerInstance.address, 0,'', setCompSpeedsEncode, eta).encodeABI()
        console.log("queueTxEncoded: ", queueTxEncoded)
        let execTxEncoded = await timelockInstance.contract.methods.executeTransaction(unitrollerInstance.address, 0,'', setCompSpeedsEncode, eta).encodeABI()
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