const JumpInterestModel = artifacts.require("CommonJumpInterestModel");
const CToken = artifacts.require("CToken");
const MultisigWallet = artifacts.require("MultisigWallet");

// 12 * 60 * 24 * 365 (BlockTime: 5s)
let blocksPerYear = 6307200; 
const baseRatePerYear = 0.01e18.toString();
const multiplierPerYear = 0.02e18.toString();
const jumpMultiplierPerYear = 20e18.toString();
const kink = 0.9e18.toString();
const reserveFactor = 0.5e18.toString();

module.exports = async function(callback) {
    try {
        let multisigAdmin = "0x500708A336Eb407639FE9b39a83D7a077FFb35D0";
        let multisigInstance = await MultisigWallet.at(multisigAdmin);
        let newInterestModel = await JumpInterestModel.new(blocksPerYear, baseRatePerYear, multiplierPerYear, jumpMultiplierPerYear, kink);
        let allSupportedMarkets = ["0xF31AD464E61118c735E6d3C909e7a42DAA1575A3"]
        for (market of allSupportedMarkets) {
            let interestModelAddr = newInterestModel.address;
            let cTokenInstance = await CToken.at(market);
            let cTokenName = await cTokenInstance.name();
            console.log(`cTokenName: ${cTokenName}`)
            let oldInterestModelAddr = await cTokenInstance.interestRateModel();
            //if (oldInterestModelAddr != "0x9f76E988eE3a0d5F13c9bd693F72CF8c203E3b9c") continue;
            let setInterestRateModelEncode = await cTokenInstance.contract.methods._setInterestRateModel(interestModelAddr).encodeABI();
            let setReserveFactorEncode = await cTokenInstance.contract.methods._setReserveFactor(reserveFactor).encodeABI();
            await multisigInstance.submitTransaction(cTokenInstance.address, 0, setInterestRateModelEncode);
            await multisigInstance.submitTransaction(cTokenInstance.address, 0, setReserveFactorEncode);
            let newInterestModelAddr = await cTokenInstance.interestRateModel();
            console.log(`oldInterestModel ${oldInterestModelAddr} is replaced with newInterestModel: ${newInterestModelAddr} for token ${cTokenName} : ${cTokenInstance.address}`);
        }
        callback();
    } catch (e) {
        console.log(e);
        callback(e);
    }
}