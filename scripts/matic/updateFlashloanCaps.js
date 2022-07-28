const QsConfig = artifacts.require("QsConfig");
const Qstroller = artifacts.require("Qstroller");
const Unitroller = artifacts.require("Unitroller");

const assets = [
    '0x154250560242c4f2947Cf2EA6c8e92e0cE714d4E', // fMatic
    '0x7280faEc8C4a6ABbb3414e31015AC108113363A4', // fUSDT
    '0xb9542aDd6d6049Ae59Ce39e45Fb2EC88797931E7', // fAAVE
    '0x0Ab290A1EBF33F21d7c5d0F9B4CEE940921FDfC0', // fDAI
    '0xA200126e00A53a4a05533fF0Cfb16b3788524A3e', // fWBTC
    '0x3DbFAE35cd0E5bF812e715a863F2CDc2D2546119', // fWETH
    '0x6C524c36D5dc475A2bb4658c6Ea09b2DbCBefB50', // fUSDC
    '0x35121329dcb7e884b5C8ac3095f833BC99E66874', // fQUICK
]

const flashloanCaps = [
    '1000000000000000000000000', // 1e24
    '1000000000000', // 1e12
    '1000000000000000000000000', // 1e24
    '1000000000000000000000000', // 1e24
    '100000000000000', // 1e14
    '1000000000000000000000000', // 1e24
    '1000000000000', // 1e12
    '1000000000000000000000000'  // 1e24
]

module.exports = async function(callback) {
    try {
        let unitrollerInstance = await Unitroller.deployed();
        let proxiedQstroller = await Qstroller.at(unitrollerInstance.address);
        let qsConfigAddress = await proxiedQstroller.qsConfig();
        let qsConfigInstance = await QsConfig.at(qsConfigAddress);
        // await qsConfigInstance._setMarketFlashLoanCaps(assets, flashloanCaps);
        await qsConfigInstance._addToWhitelist("0xf76a9B0b822871c475859f89A1a345d04ac1EDe3");
        await qsConfigInstance._addToWhitelist("0xfc0481C851f366894AD320C133d6132e49CEEE00");

        console.log("Done to set flash loan caps");
        callback();
    } catch (e) {
        console.log(e);
        callback(e);
    }
}