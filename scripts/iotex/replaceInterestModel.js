const CommonJumpInterestModel = artifacts.require("CommonJumpInterestModel");
const CToken = artifacts.require("CToken");
const Qstroller = artifacts.require("Qstroller");
const Unitroller = artifacts.require("Unitroller");
const MultisigWallet = artifacts.require("MultisigWallet"); 

const baseRatePerYear = 0.03e18.toString();
const multiplierPerYear = 0.3e18.toString();
const jumpMultiplierPerYear = 4.25e18.toString();
const kink = 0.92e18.toString();
const reserveFactor = 0.35e18.toString();
let multisigWallet = "0x7bF022EbD8C7F839ffD9e1A1dE3a5e62788E12c4";

module.exports = async function(callback) {
    try {
        // 12 * 60 * 24 * 365 (BlockTime: 5s)
        const blocksPerYear = 6307200;
        // let newInterestModel = await CommonJumpInterestModel.new(blocksPerYear, baseRatePerYear, multiplierPerYear, jumpMultiplierPerYear, kink);
        // console.log("newInterestModel: ", newInterestModel.address)
        let market = "0xAeE67519049092AB91EFD033f7d350D62b9f166B";
        let newInterestModelAddress = "0x4f3f8d2d984869Cab8A3A1aE5d919c501038B051";
        // let newInterestModelAddress = newInterestModel.address;
        let cTokenInstance = await CToken.at(market); 
        let setInterestRateEncode = await cTokenInstance.contract.methods._setInterestRateModel(newInterestModelAddress).encodeABI();

        let walletInstance = await MultisigWallet.at(multisigWallet);
        await walletInstance.submitTransaction(cTokenInstance.address, 0, setInterestRateEncode);

        // let allSupportedMarkets = ["0x7cfB238C628f321bA905D1beEc2bfB18AE56Fcdb"]
        // let unitrollerInstance = await Unitroller.deployed();
        // let proxiedQstroller = await Qstroller.at(unitrollerInstance.address);
        // // let allSupportedMarkets = await proxiedQstroller.getAllMarkets();
        // for (market of allSupportedMarkets) {
        //     let interestModelAddr = newInterestModel.address;
        //     let cTokenInstance = await CToken.at(market);
        //     let cTokenName = await cTokenInstance.name();
        //     console.log(`cTokenName: ${cTokenName}`)
        //     let oldInterestModelAddr = await cTokenInstance.interestRateModel();
        //     //if (oldInterestModelAddr != "0x9f76E988eE3a0d5F13c9bd693F72CF8c203E3b9c") continue;
        //     await cTokenInstance._setInterestRateModel(interestModelAddr);
        //     // await cTokenInstance._setReserveFactor(reserveFactor);
        //     let newInterestModelAddr = await cTokenInstance.interestRateModel();
        //     console.log(`oldInterestModel ${oldInterestModelAddr} is replaced with newInterestModel: ${newInterestModelAddr} for token ${cTokenName} : ${cTokenInstance.address}`);
        // }
        callback();
    } catch (e) {
        console.log(e);
        callback(e);
    }
}