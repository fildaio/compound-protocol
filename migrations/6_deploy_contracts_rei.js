const MockPriceOracle = artifacts.require("MockPriceOracle");
const QsPriceOracleForEla = artifacts.require("QsPriceOracleForEla");
const InterestModel = artifacts.require("CommonJumpInterestModel");
const Qstroller = artifacts.require("Qstroller");
const erc20Delegate = artifacts.require("CErc20Delegate");
const erc20Delegator = artifacts.require("CErc20Delegator");
const wrappedNativeDelegate = artifacts.require("CWrappedNativeDelegate");
const wrappedNativeDelegator = artifacts.require("CWrappedNativeDelegator");
const Unitroller = artifacts.require("Unitroller");
const CompoundLens = artifacts.require("CompoundLens");
const QsConfig = artifacts.require("QsConfig");
const Maximillion = artifacts.require("Maximillion");

// Parameters
const closeFactor = 0.5e18.toString();
const liquidationIncentive = 1.13e18.toString();

// 20 * 60 * 24 * 365 (BlockTime: 3s)
let blocksPerYear = 10512000; 

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
    console.log("Done to set system config.", await  proxiedQstroller.qsConfig());

    await proxiedQstroller._setLiquidationIncentive(liquidationIncentive);
    console.log("Done to set liquidation incentive.");
    let incentive = await proxiedQstroller.liquidationIncentiveMantissa();
    console.log("New incentive: ", incentive.toString());

    await proxiedQstroller._setCloseFactor(closeFactor);
    result = await proxiedQstroller.closeFactorMantissa();
    console.log("Done to set close factor with value: ", result.toString());

    if (network == "rei") {
        let wREI = "0x2545AF3D8b11e295bB7aEdD5826021AB54F71630";
        await deployer.deploy(InterestModel, blocksPerYear, baseRatePerYear, multiplierPerYear, jumpMultiplierPerYear, kink);
        await deployer.deploy(QsPriceOracleForEla, wREI);
        let priceOracleAddress = QsPriceOracleForEla.address;
        let proxiedQstroller = await Qstroller.at(Unitroller.address);
        await proxiedQstroller._setPriceOracle(priceOracleAddress);
        console.log("Done to set price oracle.", await proxiedQstroller.oracle());
        addressFactory["QsPriceOracleForEla"] = priceOracleAddress;
        await deployer.deploy(wrappedNativeDelegate);
        await deployer.deploy(wrappedNativeDelegator, wREI, Unitroller.address, InterestModel.address, 0.02e18.toString(), "Filda REI", "fREI", 18, admin, wrappedNativeDelegate.address, "0x0");
        const wrappedNativeInstance = await wrappedNativeDelegator.deployed();
        await proxiedQstroller._supportMarket(wrappedNativeDelegator.address);
        console.log("Done to support market fREI: ", wrappedNativeInstance.address);
        let reiCollateralFactor = 0.4e18.toString();
        await proxiedQstroller._setCollateralFactor(wrappedNativeInstance.address, reiCollateralFactor);
        console.log("Done to set collateral factor %s for fREI %s", reiCollateralFactor, wrappedNativeInstance.address);
        addressFactory["fREI"] = wrappedNativeInstance.address;
        await deployer.deploy(Maximillion, wrappedNativeInstance.address);
        addressFactory["Maximillion"] = Maximillion.address;
    }
    console.log("================= Copy and record below addresses ==============")
    console.log(addressFactory);
};
