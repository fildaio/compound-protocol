const QsElaAssetOracle = artifacts.require("QsElaAssetOracle");
const erc20Token = artifacts.require("EIP20Interface");
const ChainlinkAdaptor = artifacts.require("ChainlinkAdaptor");

const assets = [
    '0x517E9e5d46C1EA8aB6f78677d6114Ef47F71f6c4', // WELA
    '0xDF4191Bfe8FAE019fD6aF9433E8ED6bfC4B90CA1', // BTCB
    '0xF9Ca2eA3b1024c0DB31adB224B407441bECC18BB', // HUSD
    '0x9f1d0Ed4E041C503BD487E5dc9FC935Ab57F9a57', // BUSD
    '0x802c3e839E4fDb10aF583E3E759239ec7703501e', // ETH
    '0xA06be0F5950781cE28D965E5EFc6996e88a8C141', // USDC
]

const prices = [
    '0xe848389b35Ca2E9A06faa50b6644C26A871BdD12', // WELA
    '0x903473Ebe1766206E0f9A80397231294367FE816', // BTCB
    '0x762cc3d127A68b1371b98BF0d85fc34CB8eEa752', // HUSD
    '0x13baD5d5b4DFEb615800Bc523637644880c679dc', // BUSD
    '0x3c667C80E5d828785D4262be4C981e3Cf2DA9831', // ETH
    '0xF9Eb7C69296a4693186089b4A24149Ca08c44564'  // USDC
]

module.exports = async function(callback) {
    try {
        // let prices = [];
        // for (let asset of assets) {
 
        //     let erc20 = await erc20Token.at(asset);
        //     let symbol = await erc20.symbol();
        //     let decimals = 8;
        //     let desc = symbol + " price oracle";
        //     let baseOracle = "0x5117b046517ffa18d4d9897090d0537ff62a844a";

        //     let elaAssetOracleInstance = await QsElaAssetOracle.new(decimals, desc, baseOracle, asset);
        //     prices.push(elaAssetOracleInstance.address);
        //     console.log("Done to create asset oracle ", elaAssetOracleInstance.address, " for ", symbol, " ", asset);
        // }
        // console.log("prices: ", prices);

        let ChainlinkAdaptorInstance = await ChainlinkAdaptor.new("0xe848389b35Ca2E9A06faa50b6644C26A871BdD12");
        await ChainlinkAdaptorInstance.setAssetSources(assets, prices);
        await ChainlinkAdaptorInstance.setFallbackPriceOracle("0x5117b046517ffa18d4d9897090d0537ff62a844a");
        console.log("Done to init ChainlinkAdaptorInstance: ", ChainlinkAdaptorInstance.address);
        callback();
    } catch (e) {
        console.log(e);
        callback(e);
    }
}