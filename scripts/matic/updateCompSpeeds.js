const BigNumber = require('bignumber.js')

const Qstroller = artifacts.require("Qstroller");
const Unitroller = artifacts.require("Unitroller");
const BitWise = artifacts.require("BitWise");

const compSpeedsData = [
    {
        fToken: '0x9d81f4554E717f7054C1bfbB2f7c323389b116a5',
        borrowSpeed: 0.6e18.toString(),
        supplySpeed: 0.4e18.toString()
    },
    {
        fToken: '0xAb55dB8E2F7505C2191E7dDB5de5e266994A95b6',
        borrowSpeed: 0.2e18.toString(),
        supplySpeed: 0.4e18.toString()
    }
]

module.exports = async function(callback) {
    try {
        let allTokens = [];
        let allCompSpeeds = [];
        let bitWiseInstance = await BitWise.at("0xB86D498c379046525E6098E85f14ae24dAb523F4")
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
        let proxiedQstroller = await Qstroller.at(unitrollerInstance.address);
        await proxiedQstroller._setCompSpeeds(allTokens, allCompSpeeds);
        callback();
    } catch (e) {
        console.log(e);
        callback(e);
    }
}