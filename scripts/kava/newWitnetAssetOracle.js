const WitnetAssetOracle = artifacts.require("WitnetAssetOracle");
const erc20Token = artifacts.require("EIP20Interface");
const ChainlinkAdaptor = artifacts.require("ChainlinkAdaptor");

// Mainnet
const assets = [
    '0xc86c7C0eFbd6A49B35E8714C5f59D99De09A225b', // WKAVA 
    '0xfA9343C3897324496A05fC75abeD6bAC29f8A40f', // USDC
    '0xB44a9B6905aF7c801311e8F4E76932ee959c663C'  // USDT
]

const prices =  [
    '0x5117b046517ffA18d4d9897090D0537fF62A844A', // KAVA
    '0x6ebF83dC8C13f6e1e92ba20Fec0Af459d61B060b', // USDC
    '0xF67EF5E77B350A81DcbA5430Bc8bE876eDa8D591'  // USDT
]

// Testnet
// const assets = [
//     '0xfa95d53e0b6e82b2137faa70fd7e4a4dc70da449', // WKAVA
//     '0x43D8814FdFB9B8854422Df13F1c66e34E4fa91fD', // USDC
// ]

// Testnet
// const prices = [
//     '0x6ebF83dC8C13f6e1e92ba20Fec0Af459d61B060b', // WKAVA
//     '0xF67EF5E77B350A81DcbA5430Bc8bE876eDa8D591', // USDC
// ]
const assetIdMapping = {};
assetIdMapping['WKAVA'] = '0xde77dd55';
assetIdMapping['USDC'] = '0x4c80cf2e';
assetIdMapping['USDT'] = '0x538f5a25';

module.exports = async function(callback) {
    try {
        // let prices = [];
        // for (let asset of assets) {
        //     let erc20 = await erc20Token.at(asset);
        //     let symbol = await erc20.symbol();
        //     let decimals = 6;
        //     let desc = symbol + " price oracle";
        //     // let baseOracle = "0xB4B2E2e00e9d6E5490d55623E4F403EC84c6D33f"; //Testnet
        //     let baseOracle = "0xD39D4d972C7E166856c4eb29E54D3548B4597F53"; //Mainnet

        //     let witnetAssetOracleInstance = await WitnetAssetOracle.new(decimals, desc, baseOracle, asset, assetIdMapping[symbol]);
        //     prices.push(witnetAssetOracleInstance.address);
        //     console.log("Done to create asset oracle ", witnetAssetOracleInstance.address, " for ", symbol, " ", asset);
        //     let priceResult = await witnetAssetOracleInstance.latestRoundData();
        //     console.log('priceResult: ', priceResult.answer.toString());
        // }
        // console.log("prices: ", prices);

        // let ChainlinkAdaptorInstance = await ChainlinkAdaptor.at("0xBD5D59eeC677387caD7c77239eDD6fF5905fE8B3"); // Testnet
        let ChainlinkAdaptorInstance = await ChainlinkAdaptor.at("0xb37AA9a6af019d88b3042714399C3bc0A0791357");
        await ChainlinkAdaptorInstance.setAssetSources(assets, prices);
        console.log("Done to init ChainlinkAdaptorInstance: ", ChainlinkAdaptorInstance.address);
        callback();
    } catch (e) {
        console.log(e);
        callback(e);
    }
}