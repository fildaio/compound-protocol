const InterestModel = artifacts.require("CommonJumpInterestModel");
const Qstroller = artifacts.require("Qstroller");
const wrappedNativeDelegate = artifacts.require("CWrappedNativeDelegate");
const wrappedNativeDelegator = artifacts.require("CWrappedNativeDelegator");
const Unitroller = artifacts.require("Unitroller");
const CompoundLens = artifacts.require("CompoundLens");
const ChainLinkPriceOracle = artifacts.require("ChainlinkAdaptor");
const QsConfig = artifacts.require("QsConfig");
const Maximillion = artifacts.require("Maximillion");

// Parameters
const closeFactor = 0.5e18.toString();
const liquidationIncentive = 1.13e18.toString();
const reserveFactor = 0.3e18.toString();

const maxAssets = 10;

// 10 * 60 * 24 * 365 (BlockTime: 6s)
let blocksPerYear = 5256000;

let addressFactory = {};
module.exports = async function(deployer, network) {
    await deployer.deploy(Unitroller);
    await deployer.deploy(Qstroller);
    await deployer.deploy(CompoundLens);
    await deployer.deploy(QsConfig, "0x0000000000000000000000000000000000000000");

    addressFactory["Qstroller"] = Unitroller.address;
    addressFactory["QsConfig"] = QsConfig.address;
    addressFactory["CompoundLens"] = CompoundLens.address;

    let unitrollerInstance = await Unitroller.deployed();
    let qstrollerInstance = await Qstroller.deployed();
    let qsConfigInstance = await QsConfig.deployed();
    let admin = await qstrollerInstance.admin();
    console.log("admin: ", admin);

    await unitrollerInstance._setPendingImplementation(Qstroller.address);
    await qstrollerInstance._become(Unitroller.address);
    await qsConfigInstance._setPendingSafetyGuardian(admin);
    await qsConfigInstance._acceptSafetyGuardian();
    const baseRatePerYear = 0.03e18.toString();
    const multiplierPerYear = 0.3e18.toString();
    const jumpMultiplierPerYear = 5e18.toString();
    const kink = 0.95e18.toString();
    const reserveFactor = 0.2e18.toString();

    let proxiedQstroller = await Qstroller.at(Unitroller.address);

    await proxiedQstroller._setQsConfig(QsConfig.address);
    console.log("Done to set quick silver config.", await  proxiedQstroller.qsConfig());

    await proxiedQstroller._setLiquidationIncentive(liquidationIncentive);
    console.log("Done to set liquidation incentive.");
    let incentive = await proxiedQstroller.liquidationIncentiveMantissa();
    console.log("New incentive: ", incentive.toString());

    await proxiedQstroller._setCloseFactor(closeFactor);
    result = await proxiedQstroller.closeFactorMantissa();
    console.log("Done to set close factor with value: ", result.toString());

    if (network == "kavaTest" || network == "kava") {
        let fNativeTokenName = "Filda KAVA";
        let fNativeTokenSymbol = "fKAVA";
        let wNativeToken = "0xc86c7C0eFbd6A49B35E8714C5f59D99De09A225b";
        let nativeTokenPriceSource = "0x5117b046517ffA18d4d9897090D0537fF62A844A";
        if (network == "kavaTest") {
            nativeTokenPriceSource = "0x6ebF83dC8C13f6e1e92ba20Fec0Af459d61B060b";
            wNativeToken = "0xfa95d53e0b6e82b2137faa70fd7e4a4dc70da449";
        }
        console.log("wNativeToken: ", wNativeToken);
        await deployer.deploy(InterestModel, blocksPerYear, baseRatePerYear, multiplierPerYear, jumpMultiplierPerYear, kink);
        addressFactory["CommonJumpInterestModel"] = InterestModel.address;
        await deployer.deploy(ChainLinkPriceOracle, nativeTokenPriceSource);
        let proxiedQstroller = await Qstroller.at(Unitroller.address);
        await proxiedQstroller._setPriceOracle(ChainLinkPriceOracle.address);
        console.log("Done to set price oracle.", await proxiedQstroller.oracle());
        addressFactory["ChainLinkPriceOracle"] = ChainLinkPriceOracle.address;
        await deployer.deploy(wrappedNativeDelegate);
        await deployer.deploy(wrappedNativeDelegator, wNativeToken, Unitroller.address, InterestModel.address, 0.02e18.toString(), fNativeTokenName, fNativeTokenSymbol, 18, admin, wrappedNativeDelegate.address, "0x0");
        const wrappedNativeInstance = await wrappedNativeDelegator.deployed();
        await proxiedQstroller._supportMarket(wrappedNativeDelegator.address);
        console.log("Done to support market fKAVA: ", wrappedNativeInstance.address);
        let collateralFactor = 0.5e18.toString();
        await proxiedQstroller._setCollateralFactor(wrappedNativeInstance.address, collateralFactor);
        console.log("Done to set collateral factor %s for %s %s", collateralFactor, fNativeTokenSymbol, wrappedNativeInstance.address);
        addressFactory[fNativeTokenSymbol] = wrappedNativeInstance.address;
        await deployer.deploy(Maximillion, wrappedNativeInstance.address);
        addressFactory["Maximillion"] = Maximillion.address;
    }
    console.log("================= Copy and record below addresses ==============")
    console.log(addressFactory);
};
