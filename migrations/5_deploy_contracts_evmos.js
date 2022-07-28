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
    const reserveFactor = 0.15e18.toString();

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


    if (network == "auroratest" || network == "aurora") {
        // 60/7 * 60 * 24 * 365 (BlockTime: 7s)
        blocksPerYear = 4505142;
        let weth = "0x9d29f395524b3c817ed86e2987a14c1897aff849";
        if (network == "aurora") {
            weth = "0xc9bdeed33cd01541e1eed10f90519d2c06fe3feb";
        }
        await deployer.deploy(QsPriceOracleForEla, weth);
        let priceOracleAddress = QsPriceOracleForEla.address;
        await deployer.deploy(InterestModel, blocksPerYear, baseRatePerYear, multiplierPerYear, jumpMultiplierPerYear, kink);
        let proxiedQstroller = await Qstroller.at(Unitroller.address);
        await proxiedQstroller._setPriceOracle(priceOracleAddress);
        console.log("Done to set price oracle.", await proxiedQstroller.oracle());
        addressFactory["QsPriceOracleForEla"] = priceOracleAddress;
        await deployer.deploy(wrappedNativeDelegate);
        await deployer.deploy(wrappedNativeDelegator, weth, Unitroller.address, InterestModel.address, 0.02e18.toString(), "Filda ETH", "fETH", 18, admin, wrappedNativeDelegate.address, "0x0");
        const wrappedNativeInstance = await wrappedNativeDelegator.deployed();
        await wrappedNativeInstance._setReserveFactor(reserveFactor);
        console.log("Done to set reserve factor to %s", reserveFactor);
        await proxiedQstroller._supportMarket(wrappedNativeDelegator.address);
        console.log("Done to support market fETH: ", wrappedNativeInstance.address);
        let collateralFactor = 0.5e18.toString();
        await proxiedQstroller._setCollateralFactor(wrappedNativeInstance.address, collateralFactor);
        console.log("Done to set collateral factor %s for fETH %s", collateralFactor, wrappedNativeInstance.address);
        addressFactory["fEla"] = wrappedNativeInstance.address;
        await deployer.deploy(Maximillion, wrappedNativeInstance.address);
        addressFactory["Maximillion"] = Maximillion.address;
    }
    console.log("================= Copy and record below addresses ==============")
    console.log(addressFactory);
};
