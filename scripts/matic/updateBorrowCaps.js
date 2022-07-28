const QsConfig = artifacts.require("QsConfig");

const assets = [
    '0x8f7de8e558249aaeb511E2fd2467369c991D1bC2', // fMatic
    '0xAb55dB8E2F7505C2191E7dDB5de5e266994A95b6', // fUSDT
    '0xd8DA16c621C75070786b205a28F3C0eCc29CD0cf', // fAAVE
    '0x770318C1cFbe92B23ac09ef40B056d11Eb2d6b22', // fDAI
    '0x9d63046BF361c2351bcc6e939039AB97fCdeB885', // fWBTC
    '0x4A256E7ba0Fb46e4C7fC111e7aE8Bee8e7a9D811', // fWETH
    '0xEDE060556E7F3d4C5576494490c70217e9e57826', // fUSDC
    '0xFdC7CAdA90a1AA4002DD55A581e0Fc0D4Cd58bF5', // fQUICK
]

const borrowCaps = [
    '2000000000000000000', // 2 matic
    '100000000', // 100 usdt
    '1000000000000000000', // 1 aave
    '100000000000000000000', // 100 dai
    '1000000', // 0.01 btc 
    '100000000000000000', // 0.1 eth
    '100000000', // 100 usdc
    '100000000000000000000'  // 100 quick
]

module.exports = async function(callback) {
    try {
        let qsConfigInstance = await QsConfig.at("0x0fAccC8204eB500923dD0C2b1d8755aC0979BE9b");
        await qsConfigInstance._setMarketBorrowCaps(assets, borrowCaps);
        console.log("Done to set borrow caps");
        callback();
    } catch (e) {
        console.log(e);
        callback(e);
    }
}