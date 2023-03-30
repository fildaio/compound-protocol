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

// 30 * 60 * 24 * 365 (BlockTime: 2s)
let blocksPerYear = 15768000;

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

    if (network == "bttcTest" || network == "bttc") {
        let wBtt = "0x23181F21DEa5936e24163FFABa4Ea3B316B57f3C";
        let bttPriceSource = "0xF67EF5E77B350A81DcbA5430Bc8bE876eDa8D591";
        if (network == "bttcTest") {
            bttPriceSource = "0x9F6f0e5b626Bb0A50DF27Ff393a25A8B75200738";
            wBtt = "0x107742EB846b86CEaAF7528D5C85cddcad3e409A";
        }
        console.log("wBtt: ", wBtt);
        await deployer.deploy(InterestModel, blocksPerYear, baseRatePerYear, multiplierPerYear, jumpMultiplierPerYear, kink);
        addressFactory["CommonJumpInterestModel"] = InterestModel.address;
        await deployer.deploy(ChainLinkPriceOracle, bttPriceSource);
        let proxiedQstroller = await Qstroller.at(Unitroller.address);
        await proxiedQstroller._setPriceOracle(ChainLinkPriceOracle.address);
        console.log("Done to set price oracle.", await proxiedQstroller.oracle());
        addressFactory["ChainLinkPriceOracle"] = ChainLinkPriceOracle.address;
        await deployer.deploy(wrappedNativeDelegate);
        await deployer.deploy(wrappedNativeDelegator, wBtt, Unitroller.address, InterestModel.address, 0.02e18.toString(), "Filda BTT", "fBTT", 18, admin, wrappedNativeDelegate.address, "0x0");
        const wrappedNativeInstance = await wrappedNativeDelegator.deployed();
        await proxiedQstroller._supportMarket(wrappedNativeDelegator.address);
        console.log("Done to support market fBTT: ", wrappedNativeInstance.address);
        let bttCollateralFactor = 0.5e18.toString();
        await proxiedQstroller._setCollateralFactor(wrappedNativeInstance.address, bttCollateralFactor);
        console.log("Done to set collateral factor %s for fBTT %s", bttCollateralFactor, wrappedNativeInstance.address);
        addressFactory["fBTT"] = wrappedNativeInstance.address;
        await deployer.deploy(Maximillion, wrappedNativeInstance.address);
        addressFactory["Maximillion"] = Maximillion.address;
    }
    console.log("================= Copy and record below addresses ==============")
    console.log(addressFactory);
};
