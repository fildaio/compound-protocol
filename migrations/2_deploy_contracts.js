const SimplePriceOracle = artifacts.require("QsSimplePriceOracle");
const MockPriceOracle = artifacts.require("MockPriceOracle");
const QsPriceOracleV2 = artifacts.require("QsPriceOracleV2");
const InterestModel = artifacts.require("CommonJumpInterestModel");
const Qstroller = artifacts.require("Qstroller");
const erc20Delegate = artifacts.require("CErc20Delegate");
const erc20Delegator = artifacts.require("CErc20Delegator");
const wrappedNativeDelegate = artifacts.require("CWrappedNativeDelegate");
const wrappedNativeDelegator = artifacts.require("CWrappedNativeDelegator");
const Unitroller = artifacts.require("Unitroller");
const CompoundLens = artifacts.require("CompoundLens");
const ChainLinkPriceOracle = artifacts.require("ChainlinkAdaptor");
const QsConfig = artifacts.require("QsConfig");
const Maximillion = artifacts.require("Maximillion");

// Mock Tokens
const TetherToken = artifacts.require("TetherToken");
const HFILToken = artifacts.require("HFILToken");
const ETHToken = artifacts.require("ETHToken");
const ELAToken = artifacts.require("ELAToken");
const MockWETH = artifacts.require("MockWETH");

// Parameters
const closeFactor = 0.5e18.toString();
const liquidationIncentive = 1.13e18.toString();
const reserveFactor = 0.3e18.toString();

const maxAssets = 10;

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
    console.log("Done to set quick silver config.", await  proxiedQstroller.qsConfig());

    await proxiedQstroller._setLiquidationIncentive(liquidationIncentive);
    console.log("Done to set liquidation incentive.");
    let incentive = await proxiedQstroller.liquidationIncentiveMantissa();
    console.log("New incentive: ", incentive.toString());

    await proxiedQstroller._setCloseFactor(closeFactor);
    result = await proxiedQstroller.closeFactorMantissa();
    console.log("Done to set close factor with value: ", result.toString());

    if (network == "development" || network == "eladev" || network == "elalocal" || network == "ethlocal" || network == "ethdev") {
        let compImpl = await unitrollerInstance.comptrollerImplementation();
        console.log("compImpl: " + compImpl);

        await deployer.deploy(InterestModel, blocksPerYear, baseRatePerYear, multiplierPerYear, jumpMultiplierPerYear, kink);

        await deployer.deploy(MockPriceOracle);
        await proxiedQstroller._setPriceOracle(MockPriceOracle.address);
        console.log("Done to set price oracle.", await proxiedQstroller.oracle());
        if (network == "eladev" || network == "elalocal") {
            await deployer.deploy(sELA, Unitroller.address, InterestModel.address, 0.02e18.toString(), "QuickSilver ELA", "sELA", 18, admin);
            await proxiedQstroller._supportMarket(sELA.address);
            console.log("Done to support market: ", sELA.address);
            let elaCollateralFactor = 0.15e18.toString();
            await proxiedQstroller._setCollateralFactor(sELA.address, elaCollateralFactor);
            console.log("Done to set collateral factor %s for %s", elaCollateralFactor, sELA.address);
            addressFactory["sELA"] = sELA.address;
            await deployer.deploy(Maximillion, sELA.address);
            addressFactory["Maximillion"] = Maximillion.address;

            // Handle Mocked ETH
            await deployer.deploy(ETHToken);
            await deployer.deploy(erc20Delegate);
            await deployer.deploy(erc20Delegator, ETHToken.address, Unitroller.address, InterestModel.address, 0.02e18.toString(), "QuickSilver ETH on ELA", "sElaETH", 18, admin, erc20Delegate.address, "0x0");
            const sETHElastosInstance = await erc20Delegator.deployed();
            await sETHElastosInstance._setReserveFactor(reserveFactor);
            await proxiedQstroller._supportMarket(erc20Delegator.address)
            let ETHElastosCollateralFactor = 0.5e18.toString();
            await proxiedQstroller._setCollateralFactor(erc20Delegator.address, ETHElastosCollateralFactor)
            console.log("Done to set collateral factor %s for %s", ETHElastosCollateralFactor, erc20Delegator.address);
            addressFactory["ETH"] = ETHToken.address;
            addressFactory["sETH"] = erc20Delegator.address;
        }

        if (network == "ethdev" || network == "ethlocal") {
            await deployer.deploy(sELA, Unitroller.address, InterestModel.address, 0.02e18.toString(), "QuickSilver ETH", "sETH", 18, admin);
            await proxiedQstroller._supportMarket(sELA.address);
            console.log("Done to support market: ", sELA.address);
            let elaCollateralFactor = 0.5e18.toString();
            await proxiedQstroller._setCollateralFactor(sELA.address, elaCollateralFactor)
            console.log("Done to set collateral factor %s for %s", elaCollateralFactor, sELA.address);
            addressFactory["sETH"] = sELA.address;
            await deployer.deploy(Maximillion, sELA.address);
            addressFactory["Maximillion"] = Maximillion.address;

            // Handle Mocked ETH
            await deployer.deploy(ELAToken);
            await deployer.deploy(erc20Delegate);
            await deployer.deploy(erc20Delegator, ELAToken.address, Unitroller.address, InterestModel.address, 0.02e18.toString(), "QuickSilver ELA on ETH", "sEthELA", 18, admin, erc20Delegate.address, "0x0");
            const sELAElastosInstance = await erc20Delegator.deployed();
            await sELAElastosInstance._setReserveFactor(reserveFactor);
            await proxiedQstroller._supportMarket(erc20Delegator.address)
            let ELAEthCollateralFactor = 0.15e18.toString();
            proxiedQstroller._setCollateralFactor(erc20Delegator.address, ELAEthCollateralFactor);
            console.log("Done to set collateral factor %s for %s", ELAEthCollateralFactor, erc20Delegator.address);
            addressFactory["ELA"] = ELAToken.address;
            addressFactory["sELA"] = erc20Delegator.address;
        }

        // Handle Wrapped Native
        await deployer.deploy(MockWETH);
        console.log("MockWETH: ", MockWETH.address);
        await deployer.deploy(wrappedNativeDelegate);
        await deployer.deploy(wrappedNativeDelegator, MockWETH.address, Unitroller.address, InterestModel.address, 0.02e18.toString(), "QuickSilver USDT", "sUSDT", 18, admin, erc20Delegate.address, "0x0");
        const wrappedNativeInstance = await wrappedNativeDelegator.deployed();
        await wrappedNativeInstance._setReserveFactor(reserveFactor);
        await proxiedQstroller._supportMarket(wrappedNativeDelegator.address)
        let wrappedNativeCollateralFactor = 0.8e18.toString();
        await proxiedQstroller._setCollateralFactor(wrappedNativeDelegator.address, wrappedNativeCollateralFactor);
        console.log("Done to set collateral factor %s for %s", wrappedNativeCollateralFactor, wrappedNativeDelegator.address);
        addressFactory["WETH"] = TetherToken.address;
        addressFactory["sWETH"] = erc20Delegator.address;

        // Handle Mocked USDT
        await deployer.deploy(TetherToken, "1000000000000000", "Tether USD", "USDT", 6);
        await deployer.deploy(erc20Delegate);
        await deployer.deploy(erc20Delegator, TetherToken.address, Unitroller.address, InterestModel.address, 0.02e6.toString(), "QuickSilver USDT", "sUSDT", 18, admin, erc20Delegate.address, "0x0");
        const sUSDTInstance = await erc20Delegator.deployed();
        await sUSDTInstance._setReserveFactor(reserveFactor);
        await proxiedQstroller._supportMarket(erc20Delegator.address)
        let usdtCollateralFactor = 0.8e18.toString();
        await proxiedQstroller._setCollateralFactor(erc20Delegator.address, usdtCollateralFactor);
        console.log("Done to set collateral factor %s for %s", usdtCollateralFactor, erc20Delegator.address);
        addressFactory["USDT"] = TetherToken.address;
        addressFactory["sUSDT"] = erc20Delegator.address;

        // Handle Mocked HFIL
        await deployer.deploy(HFILToken);
        await deployer.deploy(erc20Delegate);
        await deployer.deploy(erc20Delegator, HFILToken.address, Unitroller.address, InterestModel.address, 0.02e18.toString(), "QuickSilver HFIL", "sHFIL", 18, admin, erc20Delegate.address, "0x0");

        // const sHFIL = erc20Delegator;
        const sHFILInstance = await erc20Delegator.deployed();
        await sHFILInstance._setReserveFactor(reserveFactor);

        await proxiedQstroller._supportMarket(erc20Delegator.address);
        let hfilCollateralFactor = 0.5e18.toString();
        await proxiedQstroller._setCollateralFactor(erc20Delegator.address, hfilCollateralFactor);
        let hfilCollateralFactorAfter = await proxiedQstroller.markets(erc20Delegator.address);
        console.log("Done to set collateral factor %s for HFIL %s", hfilCollateralFactorAfter.collateralFactorMantissa, erc20Delegator.address);
        addressFactory["HFIL"] = HFILToken.address;
        addressFactory["sHFIL"] = erc20Delegator.address;

        let allSupportedMarkets = await proxiedQstroller.getAllMarkets();
        console.log(allSupportedMarkets);
    }

    if (network == "ropsten") {
        await deployer.deploy(TetherToken, "1000000000000000", "Tether USD", "USDT", 6);

        await deployer.deploy(erc20Delegate);
        await deployer.deploy(erc20Delegator, TetherToken.address, Unitroller.address, InterestModel.address, 0.02e6.toString(), "QuickSilver USDT", "sUSDT", 18, admin, erc20Delegate.address, "0x0");

        await proxiedQstroller._supportMarket(erc20Delegator.address);
        console.log("Done to support market: ", erc20Delegator.address);

        let allSupportedMarkets = await proxiedQstroller.getAllMarkets();
        console.log("allSupportedMarkets: ", allSupportedMarkets);
    }

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

    if (network == "hecotest" || network == "heco") {
        await deployer.deploy(sELA, Unitroller.address, InterestModel.address, 0.02e18.toString(), "Filda HT", "fHT", 18, admin);
        await proxiedQstroller._supportMarket(sELA.address);
        console.log("Done to support market fHT: ", sELA.address);
        let htCollateralFactor = 0.15e18.toString();
        await proxiedQstroller._setCollateralFactor(sELA.address, htCollateralFactor);
        console.log("Done to set collateral factor %s for fHT %s", htCollateralFactor, sELA.address);
        addressFactory["fHT"] = sELA.address;
        await deployer.deploy(Maximillion, sELA.address);
        addressFactory["Maximillion"] = Maximillion.address;
    }

    if (network == "arbitrum" || network == "arbitrumtest") {
        blocksPerYear = 2102400
        let wETH = "0x82af49447d8a07e3bd95bd0d56f35241523fbab1";
        let ethPriceSource = "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612";
        if (network == "arbitrumtest") {
            ethPriceSource = "0x5f0423B1a6935dc5596e7A24d98532b67A0AeFd8";
            // Handle Wrapped Native
            await deployer.deploy(MockWETH);
            wETH = MockWETH.address;
            console.log("wETH: ", wETH);
        }
        addressFactory["wETH"] = wETH;
        await deployer.deploy(InterestModel, blocksPerYear, baseRatePerYear, multiplierPerYear, jumpMultiplierPerYear, kink);
        addressFactory["InterestModel"] = InterestModel.address;
        await deployer.deploy(ChainLinkPriceOracle, ethPriceSource);
        let proxiedQstroller = await Qstroller.at(Unitroller.address);
        await proxiedQstroller._setPriceOracle(ChainLinkPriceOracle.address);
        console.log("Done to set price oracle.", await proxiedQstroller.oracle());
        addressFactory["ChainLinkPriceOracle"] = ChainLinkPriceOracle.address;
        await deployer.deploy(wrappedNativeDelegate);
        await deployer.deploy(wrappedNativeDelegator, wETH, Unitroller.address, InterestModel.address, 0.02e18.toString(), "Filda ETH", "fETH", 18, admin, wrappedNativeDelegate.address, "0x0");
        const wrappedNativeInstance = await wrappedNativeDelegator.deployed();
        await proxiedQstroller._supportMarket(wrappedNativeDelegator.address);
        console.log("Done to support market fETH: ", wrappedNativeInstance.address);
        let ethCollateralFactor = 0.65e18.toString();
        await proxiedQstroller._setCollateralFactor(wrappedNativeInstance.address, ethCollateralFactor);
        console.log("Done to set collateral factor %s for fBNB %s", ethCollateralFactor, wrappedNativeInstance.address);
        addressFactory["fETH"] = wrappedNativeInstance.address;
        await deployer.deploy(Maximillion, wrappedNativeInstance.address);
        addressFactory["Maximillion"] = Maximillion.address;
    }

    if (network == "bsctest" || network == "bsc") {
        let wBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
        let bnbPriceSource = "0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE";
        if (network == "bsctest") {
            bnbPriceSource = "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526";
            // Handle Wrapped Native
            await deployer.deploy(MockWETH);
            wBNB = MockWETH.address;
            console.log("wBNB: ", wBNB);
        }
        addressFactory["wBNB"] = wBNB;
        await deployer.deploy(InterestModel, blocksPerYear, baseRatePerYear, multiplierPerYear, jumpMultiplierPerYear, kink);
        addressFactory["InterestModel"] = InterestModel.address;
        await deployer.deploy(ChainLinkPriceOracle, bnbPriceSource);
        let proxiedQstroller = await Qstroller.at(Unitroller.address);
        await proxiedQstroller._setPriceOracle(ChainLinkPriceOracle.address);
        console.log("Done to set price oracle.", await proxiedQstroller.oracle());
        addressFactory["ChainLinkPriceOracle"] = ChainLinkPriceOracle.address;

        await deployer.deploy(wrappedNativeDelegate);
        await deployer.deploy(wrappedNativeDelegator, wBNB, Unitroller.address, InterestModel.address, 0.02e18.toString(), "Filda BNB", "fBNB", 18, admin, wrappedNativeDelegate.address, "0x0");
        const wrappedNativeInstance = await wrappedNativeDelegator.deployed();
        await proxiedQstroller._supportMarket(wrappedNativeDelegator.address);
        console.log("Done to support market fBNB: ", wrappedNativeInstance.address);
        let bnbCollateralFactor = 0.65e18.toString();
        await proxiedQstroller._setCollateralFactor(wrappedNativeInstance.address, bnbCollateralFactor);
        console.log("Done to set collateral factor %s for fBNB %s", bnbCollateralFactor, wrappedNativeInstance.address);
        addressFactory["fBNB"] = wrappedNativeInstance.address;
        await deployer.deploy(Maximillion, wrappedNativeInstance.address);
        addressFactory["Maximillion"] = Maximillion.address;
    }

    if (network == "matictest" || network == "matic") {
        // 20 * 60 * 24 * 365 (BlockTime: 3s)
        blocksPerYear = 15768000;
        let maticPriceSource = "0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada";
        let wMatic = "0x695d5E7171d239043e36C706C3f1e9A18CDAf930";

        if (network == "matic") {
            maticPriceSource = "0xAB594600376Ec9fD91F8e885dADF0CE036862dE0";
            wMatic = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";
        }
        
        await deployer.deploy(InterestModel, blocksPerYear, baseRatePerYear, multiplierPerYear, jumpMultiplierPerYear, kink);
        await deployer.deploy(ChainLinkPriceOracle, maticPriceSource);
        let proxiedQstroller = await Qstroller.at(Unitroller.address);
        await proxiedQstroller._setPriceOracle(ChainLinkPriceOracle.address);
        console.log("Done to set price oracle.", await proxiedQstroller.oracle());
        addressFactory["ChainLinkPriceOracle"] = ChainLinkPriceOracle.address;

        await deployer.deploy(wrappedNativeDelegate);
        await deployer.deploy(wrappedNativeDelegator, wMatic, Unitroller.address, InterestModel.address, 0.02e18.toString(), "Filda Matic", "fMatic", 18, admin, wrappedNativeDelegate.address, "0x0");
        const wrappedNativeInstance = await wrappedNativeDelegator.deployed();
        await proxiedQstroller._supportMarket(wrappedNativeDelegator.address);
        console.log("Done to support market fMatic: ", wrappedNativeInstance.address);
        let maticCollateralFactor = 0.8e18.toString();
        await proxiedQstroller._setCollateralFactor(wrappedNativeInstance.address, maticCollateralFactor);
        console.log("Done to set collateral factor %s for fMatic %s", maticCollateralFactor, wrappedNativeInstance.address);
        addressFactory["fMatic"] = wrappedNativeInstance.address;
        await deployer.deploy(Maximillion, wrappedNativeInstance.address);
        addressFactory["Maximillion"] = Maximillion.address;
    }

    if (network == "IoTeXTest" || network == "IoTeX") {
        // 12 * 60 * 24 * 365 (BlockTime: 5s)
        blocksPerYear = 6307200;
        let wIotx = "0xa00744882684c3e4747faefd68d283ea44099d03";
        let iotxPriceSource = "0x267Ef702F3422cC55C617218a4fB84446F5Ec646";
        if (network == "IoTeXTest") {
            iotxPriceSource = "0xe7b1764da9c047be53ec980f7af46268912e31cd";
            // Handle Wrapped Native
            await deployer.deploy(MockWETH);
            wIotx = MockWETH.address;
            console.log("wIotx: ", wIotx);
        }
        await deployer.deploy(InterestModel, blocksPerYear, baseRatePerYear, multiplierPerYear, jumpMultiplierPerYear, kink);
        await deployer.deploy(ChainLinkPriceOracle, iotxPriceSource);
        let proxiedQstroller = await Qstroller.at(Unitroller.address);
        await proxiedQstroller._setPriceOracle(ChainLinkPriceOracle.address);
        console.log("Done to set price oracle.", await proxiedQstroller.oracle());
        addressFactory["ChainLinkPriceOracle"] = ChainLinkPriceOracle.address;
        await deployer.deploy(wrappedNativeDelegate);
        await deployer.deploy(wrappedNativeDelegator, wIotx, Unitroller.address, InterestModel.address, 0.02e18.toString(), "Filda IOTX", "fIOTX", 18, admin, wrappedNativeDelegate.address, "0x0");
        const wrappedNativeInstance = await wrappedNativeDelegator.deployed();
        await proxiedQstroller._supportMarket(wrappedNativeDelegator.address);
        console.log("Done to support market fIOTX: ", wrappedNativeInstance.address);
        let iotxCollateralFactor = 0.5e18.toString();
        await proxiedQstroller._setCollateralFactor(wrappedNativeInstance.address, iotxCollateralFactor);
        console.log("Done to set collateral factor %s for fIOTX %s", iotxCollateralFactor, wrappedNativeInstance.address);
        addressFactory["fIOTX"] = wrappedNativeInstance.address;
        await deployer.deploy(Maximillion, wrappedNativeInstance.address);
        addressFactory["Maximillion"] = Maximillion.address;
    }
    console.log("================= Copy and record below addresses ==============")
    console.log(addressFactory);
};
