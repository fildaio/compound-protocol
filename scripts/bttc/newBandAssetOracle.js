const BandAssetOracle = artifacts.require("BandAssetOracle");
const erc20Token = artifacts.require("EIP20Interface");
const ChainlinkAdaptor = artifacts.require("ChainlinkAdaptor");

// Mainnet
const assets = [
    // '0x23181F21DEa5936e24163FFABa4Ea3B316B57f3C', // WBTT 
    // '0xdB28719F7f938507dBfe4f0eAe55668903D34a15', // USDT_t
    // '0xEdf53026aeA60f8F75FcA25f8830b7e2d6200662'  // TRX
    '0x9888221fE6B5A2ad4cE7266c7826D2AD74D40CcF', // WBTC_e
    '0x1249C65AfB11D179FFB3CE7D4eEDd1D9b98AD006', // ETH
    '0x935faA2FCec6Ab81265B301a30467Bbc804b43d3', // USDC_t
]

const prices = [
    // '0xF67EF5E77B350A81DcbA5430Bc8bE876eDa8D591', // BTT
    // '0x489D5e733D374BEea8F6244D19369fda6A1E7139', // USDT
    // '0xbf2EBa1ca75f9854c47F953eCA4fE095fC9bB693'  // TRX
    '0x891672f0b855B55b20ea3732c1FBDf389E712829',
    '0xeA1Ca194fF0d211F86fB8E9D8BE985e35Cd16968',
    '0xd2417f4B0CFd9E3B169abC8265c52011aC0C4848'
  ]

// // Testnet
// const assets = [
//     '0x107742EB846b86CEaAF7528D5C85cddcad3e409A', // WBTT
//     '0x834982c9B0690ED7CA35e10b18887C26c25CdC82', // USDT
// ]

// Testnet
// const prices = [
//     '0x9F6f0e5b626Bb0A50DF27Ff393a25A8B75200738', // WBTT
//     '0xD2CBE89a36df2546eebc71766264e0F306d38196', // USDT
// ]
const symbolMapping = {};
symbolMapping['WBTT'] = 'BTT';
symbolMapping['"USDT_b"'] = 'USDT';
symbolMapping['USDT_t'] = 'USDT';
symbolMapping['TRX'] = 'TRX';
symbolMapping['WBTC_e'] = 'BTC';
symbolMapping['ETH'] = 'ETH';
symbolMapping['USDC_t'] = 'USDC';

module.exports = async function(callback) {
    try {
        // let prices = [];
        // for (let asset of assets) {
 
        //     let erc20 = await erc20Token.at(asset);
        //     let symbol = await erc20.symbol();
        //     let decimals = 18;
        //     let desc = symbolMapping[symbol] + " price oracle";
        //     // let baseOracle = "0x8c064bCf7C0DA3B3b090BAbFE8f3323534D84d68"; //Testnet
        //     let baseOracle = "0xDA7a001b254CD22e46d3eAB04d937489c93174C3"; //Mainnet

        //     let bandAssetOracleInstance = await BandAssetOracle.new(decimals, desc, baseOracle, asset, symbolMapping[symbol]);
        //     prices.push(bandAssetOracleInstance.address);
        //     console.log("Done to create asset oracle ", bandAssetOracleInstance.address, " for ", symbolMapping[symbol], " ", asset);
        //     let priceResult = await bandAssetOracleInstance.latestRoundData();
        //     console.log('priceResult: ', priceResult.answer.toString());
        // }
        // console.log("prices: ", prices);

        // let ChainlinkAdaptorInstance = await ChainlinkAdaptor.new("0x9F6f0e5b626Bb0A50DF27Ff393a25A8B75200738");
        // let ChainlinkAdaptorInstance = await ChainlinkAdaptor.at("0xD23eD507ab1f436Fd190217Ae26F25D9E0E97b3E"); // bttc testnet
        let ChainlinkAdaptorInstance = await ChainlinkAdaptor.at("0xb2f0fef3631bC222Df0E669e39582119804db72B");
        await ChainlinkAdaptorInstance.setAssetSources(assets, prices);
        console.log("Done to init ChainlinkAdaptorInstance: ", ChainlinkAdaptorInstance.address);
        callback();
    } catch (e) {
        console.log(e);
        callback(e);
    }
}