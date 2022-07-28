const QsConfig = artifacts.require("QsConfig");
const Qstroller = artifacts.require("Qstroller");
const Unitroller = artifacts.require("Unitroller");

const assets = [
    '0x8aee1d27D906895cc771380ba5a49bbD421DD5a0', // fIoTeX
    '0x7cfB238C628f321bA905D1beEc2bfB18AE56Fcdb', // fUSDT
    '0x9278C8D3159BAaABfdAeeA4DB61F830993211B51', // fWBTC
    '0xeA1Ca194fF0d211F86fB8E9D8BE985e35Cd16968', // fWETH
    '0xcA7D7F202894e851e495beBCD2A62E0898dD1814', // fUSDC
    '0xAeE67519049092AB91EFD033f7d350D62b9f166B', // fBUSD_B
]

const flashloanCaps = [
    '1000000000000000000000000', // 1e24
    '1000000000000', // 1e12
    '100000000000000', // 1e14
    '1000000000000000000000000', // 1e24
    '1000000000000', // 1e12
    '1000000000000000000000000', // 1e24
]

module.exports = async function(callback) {
    try {
        let unitrollerInstance = await Unitroller.deployed();
        let proxiedQstroller = await Qstroller.at(unitrollerInstance.address);
        let qsConfigAddress = await proxiedQstroller.qsConfig();
        let qsConfigInstance = await QsConfig.at(qsConfigAddress);
        await qsConfigInstance._setMarketFlashLoanCaps(assets, flashloanCaps);
        console.log("Done to set flash loan caps");
        callback();
    } catch (e) {
        console.log(e);
        callback(e);
    }
}