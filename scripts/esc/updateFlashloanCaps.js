const QsConfig = artifacts.require("QsConfig");
const Qstroller = artifacts.require("Qstroller");
const Unitroller = artifacts.require("Unitroller");
const MultisigWallet = artifacts.require("MultisigWallet");

const assets = [
    '0xF31AD464E61118c735E6d3C909e7a42DAA1575A3', // fELA
    // '0x42C8A982f42b6069AD310e9910468B593247eace', // fHUSD
    // '0x2b9f49361aB609bA7de1ec8cd6c970cDBb19cA66', // fBTC
    // '0xb064f6336F747b9ECDdAEadA9964E9d123BDB01B', // fWETH
    // '0x7bC72d7780C2E811814e81FFac828d53f4CDe7c2', // fUSDC
    // '0x21c376438dA428F730249aEe27F4454358429974', // fBUSD_B
]

const flashloanCaps = [
    '1000000000000000000000000', // 1e24
    '100000000000000', // 1e12
    '1000000000000000000000000', // 1e14
    '1000000000000000000000000', // 1e24
    '1000000000000', // 1e12
    '1000000000000000000000000', // 1e24
]

const marketSupplyCaps = [
    '2000000000000000000000000', // 1e24
    // '100000000000000', // 1e12
    // '1000000000000000000000000', // 1e14
    // '1000000000000000000000000', // 1e24
    // '1000000000000', // 1e12
    // '1000000000000000000000000', // 1e24
]

const marketBorrowCaps = [
    '800000000000000000000000', // 1e24
    // '100000000000000', // 1e12
    // '1000000000000000000000000', // 1e14
    // '1000000000000000000000000', // 1e24
    // '1000000000000', // 1e12
    // '1000000000000000000000000', // 1e24
]

module.exports = async function(callback) {
    let multisigAdmin = "0x500708A336Eb407639FE9b39a83D7a077FFb35D0"
    let multisigInstance = await MultisigWallet.at(multisigAdmin);
    try {
        let unitrollerInstance = await Unitroller.deployed();
        let proxiedQstroller = await Qstroller.at(unitrollerInstance.address);
        let qsConfigAddress = await proxiedQstroller.qsConfig();
        let qsConfigInstance = await QsConfig.at(qsConfigAddress);
        // let setMarketFlashLoanCapsEncode = await qsConfigInstance.contract.methods._setMarketFlashLoanCaps(assets, flashloanCaps).encodeABI();
        // await multisigInstance.submitTransaction(qsConfigInstance.address, 0, setMarketFlashLoanCapsEncode);
        // let setFlashLoanFeeRatioEncode = await qsConfigInstance.contract.methods._setFlashLoanFeeRatio("100000000000000").encodeABI();
        // await multisigInstance.submitTransaction(qsConfigInstance.address, 0, setFlashLoanFeeRatioEncode);
        // let addToWhitelistEncode = await qsConfigInstance.contract.methods._addToWhitelist("0x659b17b9DD16a219f737bF586d03C2DFaEa8bB6b").encodeABI();
        // await multisigInstance.submitTransaction(qsConfigInstance.address, 0, addToWhitelistEncode);
        // addToWhitelistEncode = await qsConfigInstance.contract.methods._addToWhitelist("0xA0cAd8E0291D0396C4A9Ff691Eae21dd8dfd7De0").encodeABI();
        // await multisigInstance.submitTransaction(qsConfigInstance.address, 0, addToWhitelistEncode);
        // addToWhitelistEncode = await qsConfigInstance.contract.methods._addToWhitelist("0xba24a083a88B93b46604BE05fBD90e43a6f1c181").encodeABI();
        // await multisigInstance.submitTransaction(qsConfigInstance.address, 0, addToWhitelistEncode);
        // addToWhitelistEncode = await qsConfigInstance.contract.methods._addToWhitelist("0xf76a9B0b822871c475859f89A1a345d04ac1EDe3").encodeABI();
        // await multisigInstance.submitTransaction(qsConfigInstance.address, 0, addToWhitelistEncode);
        // addToWhitelistEncode = await qsConfigInstance.contract.methods._addToWhitelist("0xfc0481C851f366894AD320C133d6132e49CEEE00").encodeABI();
        // await multisigInstance.submitTransaction(qsConfigInstance.address, 0, addToWhitelistEncode);
        // await qsConfigInstance._setMarketFlashLoanCaps(assets, flashloanCaps);
        // console.log("Done to set flash loan caps");

        let setMarketSupplyCapsEncode = await qsConfigInstance.contract.methods._setMarketSupplyCaps(assets, marketSupplyCaps).encodeABI();
        await multisigInstance.submitTransaction(qsConfigInstance.address, 0, setMarketSupplyCapsEncode);
        console.log("Done to set market supply caps");
        let setMarketBorrowCapsEncode = await qsConfigInstance.contract.methods._setMarketBorrowCaps(assets, marketBorrowCaps).encodeABI();
        await multisigInstance.submitTransaction(qsConfigInstance.address, 0, setMarketBorrowCapsEncode);
        console.log("Done to set market borrow caps");
        callback();
    } catch (e) {
        console.log(e);
        callback(e);
    }
}