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
const CreditOracle = artifacts.require("CreditOracle");

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
    await deployer.deploy(CreditOracle);

    addressFactory["Qstroller"] = Unitroller.address;
    addressFactory["QsConfig"] = QsConfig.address;
    addressFactory["CompoundLens"] = CompoundLens.address;
    addressFactory["CreditOracle"] = CreditOracle.address;

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
    await proxiedQstroller._setCreditOracle(CreditOracle.address);
    console.log("Done to set credit oracle.", CreditOracle.address);

    await proxiedQstroller._setLiquidationIncentive(liquidationIncentive);
    console.log("Done to set liquidation incentive.");
    let incentive = await proxiedQstroller.liquidationIncentiveMantissa();
    console.log("New incentive: ", incentive.toString());

    await proxiedQstroller._setCloseFactor(closeFactor);
    result = await proxiedQstroller.closeFactorMantissa();
    console.log("Done to set close factor with value: ", result.toString());

    if (network == "elatest") {
        const ethOnEla = "0x23f1528e61d0af04faa7cff8c7ce9046d9130789";
        const filOnEla = "0xd3f1be7f74d25f39184d2d0670966e2e837562e3";
        const usdtOnEla = "0xa7daaf45ae0b2e567eb563fb57ea9cfffdfd73dd";
        const usdcOnEla = "0x9064a6dae8023033e5119a3a3bdff65736cfe9e2"

        // Handle ethOnEla
        await deployer.deploy(erc20Delegate);
        await deployer.deploy(erc20Delegator, ethOnEla, Unitroller.address, InterestModel.address, 0.02e18.toString(), "QuickSilver ETH on Elastos", "sElaETH", 18, admin, erc20Delegate.address, "0x0");
        const sETHInstance = await erc20Delegator.deployed();
        await sETHInstance._setReserveFactor(reserveFactor);

        let qsControllerInstance = await Qstroller.at(unitrollerInstance.address);
        await qsControllerInstance._supportMarket(sETHInstance.address);
        console.log("Done to support market sETH: ", sETHInstance.address);

        let ethOnElaCollateralFactor = 0.5e18.toString();
        await qsControllerInstance._setCollateralFactor(sETHInstance.address, ethOnElaCollateralFactor);
        console.log("Done to set collateral factor %s for sETH %s", ethOnElaCollateralFactor, sETHInstance.address);
        addressFactory["ETH"] = ethOnEla;
        addressFactory["sETH"] = erc20Delegator.address;

        // Handle filOnEla
        await deployer.deploy(erc20Delegate);
        await deployer.deploy(erc20Delegator, filOnEla, Unitroller.address, InterestModel.address, 0.02e18.toString(), "QuickSilver ethHFIL", "sEthHFIL", 18, admin, erc20Delegate.address, "0x0");
        const sHFILInstance = await erc20Delegator.deployed();
        await sHFILInstance._setReserveFactor(reserveFactor);

        await qsControllerInstance._supportMarket(sHFILInstance.address);
        console.log("Done to support market sHFIL: ", sHFILInstance.address);

        let hfilOnElaCollateralFactor = 0.5e18.toString();
        await qsControllerInstance._setCollateralFactor(sHFILInstance.address, hfilOnElaCollateralFactor);
        console.log("Done to set collateral factor %s for sHFIL %s", hfilOnElaCollateralFactor, sHFILInstance.address);
        addressFactory["HFIL"] = filOnEla;
        addressFactory["sHFIL"] = erc20Delegator.address;

        // Handle usdtOnEla
        await deployer.deploy(erc20Delegate);
        await deployer.deploy(erc20Delegator, usdtOnEla, Unitroller.address, InterestModel.address, 0.02e6.toString(), "QuickSilver ethUSDT", "sEthUSDT", 18, admin, erc20Delegate.address, "0x0");
        const sUSDTInstance = await erc20Delegator.deployed();
        await sUSDTInstance._setReserveFactor(reserveFactor);

        await qsControllerInstance._supportMarket(sUSDTInstance.address);
        console.log("Done to support market sUSDT: ", sUSDTInstance.address);

        let usdtOnElaCollateralFactor = 0.5e18.toString();
        await qsControllerInstance._setCollateralFactor(sUSDTInstance.address, usdtOnElaCollateralFactor);
        console.log("Done to set collateral factor %s for sUSDT %s", usdtOnElaCollateralFactor, sUSDTInstance.address);
        addressFactory["USDT"] = usdtOnEla;
        addressFactory["sUSDT"] = erc20Delegator.address;

        // Handle usdcOnEla
        await deployer.deploy(erc20Delegate);
        await deployer.deploy(erc20Delegator, usdcOnEla, Unitroller.address, InterestModel.address, 0.02e6.toString(), "QuickSilver ethUSDC", "sEthUSDC", 18, admin, erc20Delegate.address, "0x0");
        const sUSDCInstance = await erc20Delegator.deployed();
        await sUSDCInstance._setReserveFactor(reserveFactor);

        await qsControllerInstance._supportMarket(sUSDCInstance.address);
        console.log("Done to support market sUSDC: ", sUSDCInstance.address);

        let usdcOnElaCollateralFactor = 0.5e18.toString();
        await qsControllerInstance._setCollateralFactor(sUSDCInstance.address, usdcOnElaCollateralFactor);
        console.log("Done to set collateral factor %s for sUSDC %s", usdcOnElaCollateralFactor, sUSDCInstance.address);
        addressFactory["USDC"] = usdcOnEla;
        addressFactory["sUSDC"] = erc20Delegator.address;

        // handle native token ELA
        await deployer.deploy(sELA, Unitroller.address, InterestModel.address, 0.02e18.toString(), "QuickSilver ELA", "sELA", 18, admin);
        await qsControllerInstance._supportMarket(sELA.address);
        console.log("Done to support market sELA: ", sELA.address);
        let elaCollateralFactor = 0.15e18.toString();
        await qsControllerInstance._setCollateralFactor(sELA.address, elaCollateralFactor);
        console.log("Done to set collateral factor %s for sELA %s", elaCollateralFactor, sELA.address);
        addressFactory["sELA"] = sELA.address;
        await deployer.deploy(Maximillion, sELA.address);
        addressFactory["Maximillion"] = Maximillion.address;
    }

    if (network == "elaeth") {
        // 12 * 60 * 24 * 365 (BlockTime: 5s)
        blocksPerYear = 6307200;
        let wEla = "0x517E9e5d46C1EA8aB6f78677d6114Ef47F71f6c4";
        let priceOracleAddress = "0x5117b046517ffa18d4d9897090d0537ff62a844a";
        await deployer.deploy(InterestModel, blocksPerYear, baseRatePerYear, multiplierPerYear, jumpMultiplierPerYear, kink);
        // await deployer.deploy(QsPriceOracleForEla, wEla);
        let proxiedQstroller = await Qstroller.at(Unitroller.address);
        await proxiedQstroller._setPriceOracle(priceOracleAddress);
        console.log("Done to set price oracle.", await proxiedQstroller.oracle());
        addressFactory["QsPriceOracleForEla"] = priceOracleAddress;
        await deployer.deploy(wrappedNativeDelegate);
        await deployer.deploy(wrappedNativeDelegator, wEla, Unitroller.address, InterestModel.address, 0.02e18.toString(), "Filda ELA", "fELA", 18, admin, wrappedNativeDelegate.address, "0x0");
        const wrappedNativeInstance = await wrappedNativeDelegator.deployed();
        await proxiedQstroller._supportMarket(wrappedNativeDelegator.address);
        console.log("Done to support market fela: ", wrappedNativeInstance.address);
        let elaCollateralFactor = 0.5e18.toString();
        await proxiedQstroller._setCollateralFactor(wrappedNativeInstance.address, elaCollateralFactor);
        console.log("Done to set collateral factor %s for fEla %s", elaCollateralFactor, wrappedNativeInstance.address);
        addressFactory["fEla"] = wrappedNativeInstance.address;
        await deployer.deploy(Maximillion, wrappedNativeInstance.address);
        addressFactory["Maximillion"] = Maximillion.address;
    }
    console.log("================= Copy and record below addresses ==============")
    console.log(addressFactory);
};
