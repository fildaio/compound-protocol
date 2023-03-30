const Qstroller = artifacts.require("Qstroller");
const CToken = artifacts.require("CErc20");
const EIP20 = artifacts.require("EIP20Interface");
const Unitroller = artifacts.require("Unitroller");
module.exports = async function(callback) {
    try {
        let unitrollerInstance = await Unitroller.deployed();
        let proxiedQstroller = await Qstroller.at(unitrollerInstance.address);
        let allSupportedMarkets = await proxiedQstroller.getAllMarkets();
        // let allSupportedMarkets = ["0xB16Df14C53C4bcfF220F4314ebCe70183dD804c0","0xAab0C9561D5703e84867670Ac78f6b5b4b40A7c1","0xCca471B0d49c0d4835a5172Fd97ddDEA5C979100","0x4937A83Dc1Fa982e435aeB0dB33C90937d54E424","0x09e3d97A7CFbB116B416Dae284f119c1eC3Bd5ea"]
        // let allSupportedMarkets = ["0xF31AD464E61118c735E6d3C909e7a42DAA1575A3"]
        for (market of allSupportedMarkets) {
            let cTokenInstance = await CToken.at(market);
            // let compSpeed = await proxiedQstroller.compSpeeds(market);
            // if (compSpeed <= 0) continue;
            let cTokenName = await cTokenInstance.name();
            console.log(`cTokenName: ${cTokenName}`)
            let totalReserves = await cTokenInstance.totalReserves();
            await cTokenInstance._reduceReserves(totalReserves);
            console.log(`Done to reduceReserves ${cTokenName} : ${cTokenInstance.address}, amount: ${totalReserves}`);
            if (market == "0x23b4DD6c9553Cb740714B72B738ec3eE821d395c") continue;
            let underlyingToken = await cTokenInstance.underlying();
            let underlyingTokenInstance = await EIP20.at(underlyingToken);
            await underlyingTokenInstance.transfer("0xc49220f0EEEc095101554C7f86eCC0da1f2e1687", totalReserves);
            console.log(`Done to transfer ${underlyingToken} for ${cTokenName} : ${cTokenInstance.address}, amount: ${totalReserves}`);
        }
        callback();
    } catch (e) {
        console.log(e);
        callback(e);
    }
}