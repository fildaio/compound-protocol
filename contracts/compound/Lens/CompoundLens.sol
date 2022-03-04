pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

import "../CErc20.sol";
import "../../SToken.sol";
import "../CToken.sol";
import "../PriceOracle.sol";
import "../EIP20Interface.sol";
import "../Governance/GovernorAlpha.sol";
import "../Governance/Comp.sol";
import "../../QsMdxLPDelegate.sol";
import "../../QsQuickDualLPDelegate.sol";
import "../../QsQuickLPDelegate.sol";
import "../../QsGlideLPDelegate.sol";
import "../../IStakingDualRewards.sol";
import "../../IStakingRewards.sol";
import "../../MasterChef.sol";
import "../../DragonLair.sol";
import "../SafeMath.sol";

interface ComptrollerLensInterface {
    function markets(address) external view returns (bool, uint);
    function oracle() external view returns (PriceOracle);
    function getAccountLiquidity(address) external view returns (uint, uint, uint);
    function getAssetsIn(address) external view returns (CToken[] memory);
    function claimComp(address) external;
    function compAccrued(address) external view returns (uint);
}

contract CompoundLens {
    using SafeMath for uint256;

    struct CTokenMetadata {
        address cToken;
        uint exchangeRateCurrent;
        uint supplyRatePerBlock;
        uint borrowRatePerBlock;
        uint reserveFactorMantissa;
        uint totalBorrows;
        uint totalReserves;
        uint totalSupply;
        uint totalCash;
        bool isListed;
        uint collateralFactorMantissa;
        address underlyingAssetAddress;
        uint cTokenDecimals;
        uint underlyingDecimals;
    }

    function cTokenMetadataExpand(SToken cToken) public returns (
        uint collateralFactorMantissa,
        uint exchangeRateCurrent,
        uint supplyRatePerBlock,
        uint borrowRatePerBlock,
        uint reserveFactorMantissa,
        uint totalBorrows,
        uint totalReserves, uint totalSupply, uint totalCash,
        bool isListed, address underlyingAssetAddress,
        uint underlyingDecimals) {
        CTokenMetadata memory cTokenData = cTokenMetadata(cToken);
        exchangeRateCurrent = cTokenData.exchangeRateCurrent;
        supplyRatePerBlock = cTokenData.supplyRatePerBlock;
        borrowRatePerBlock = cTokenData.borrowRatePerBlock;
        reserveFactorMantissa = cTokenData.reserveFactorMantissa;
        totalBorrows = cTokenData.totalBorrows;
        totalReserves = cTokenData.totalReserves;
        totalSupply = cTokenData.totalSupply;
        totalCash = cTokenData.totalCash;
        isListed = cTokenData.isListed;
        collateralFactorMantissa = cTokenData.collateralFactorMantissa;
        underlyingAssetAddress = cTokenData.underlyingAssetAddress;
        underlyingDecimals = cTokenData.underlyingDecimals;
    }

    function cTokenMetadata(SToken cToken) public returns (CTokenMetadata memory) {
        uint exchangeRateCurrent = cToken.exchangeRateCurrent();
        ComptrollerLensInterface comptroller = ComptrollerLensInterface(address(cToken.comptroller()));
        (bool isListed, uint collateralFactorMantissa) = comptroller.markets(address(cToken));
        address underlyingAssetAddress;
        uint underlyingDecimals;

        if (cToken.isNativeToken()) {
            underlyingAssetAddress = address(0);
            underlyingDecimals = 18;
        } else {
            CErc20 cErc20 = CErc20(address(cToken));
            underlyingAssetAddress = cErc20.underlying();
            underlyingDecimals = EIP20Interface(cErc20.underlying()).decimals();
        }

        return CTokenMetadata({
            cToken: address(cToken),
            exchangeRateCurrent: exchangeRateCurrent,
            supplyRatePerBlock: cToken.supplyRatePerBlock(),
            borrowRatePerBlock: cToken.borrowRatePerBlock(),
            reserveFactorMantissa: cToken.reserveFactorMantissa(),
            totalBorrows: cToken.totalBorrows(),
            totalReserves: cToken.totalReserves(),
            totalSupply: cToken.totalSupply(),
            totalCash: cToken.getCash(),
            isListed: isListed,
            collateralFactorMantissa: collateralFactorMantissa,
            underlyingAssetAddress: underlyingAssetAddress,
            cTokenDecimals: cToken.decimals(),
            underlyingDecimals: underlyingDecimals
        });
    }

    function cTokenMetadataAll(SToken[] calldata cTokens) external returns (CTokenMetadata[] memory) {
        uint cTokenCount = cTokens.length;
        CTokenMetadata[] memory res = new CTokenMetadata[](cTokenCount);
        for (uint i = 0; i < cTokenCount; i++) {
            res[i] = cTokenMetadata(cTokens[i]);
        }
        return res;
    }

    struct CTokenBalances {
        address cToken;
        uint balanceOf;
        uint borrowBalanceCurrent;
        uint balanceOfUnderlying;
        uint tokenBalance;
        uint tokenAllowance;
    }

    function cTokenBalances(SToken cToken, address payable account) public returns (CTokenBalances memory) {
        uint balanceOf = cToken.balanceOf(account);
        uint borrowBalanceCurrent = cToken.borrowBalanceCurrent(account);
        uint balanceOfUnderlying = cToken.balanceOfUnderlying(account);
        uint tokenBalance;
        uint tokenAllowance;

        if (cToken.isNativeToken()) {
            tokenBalance = account.balance;
            tokenAllowance = account.balance;
        } else {
            CErc20 cErc20 = CErc20(address(cToken));
            EIP20Interface underlying = EIP20Interface(cErc20.underlying());
            tokenBalance = underlying.balanceOf(account);
            tokenAllowance = underlying.allowance(account, address(cToken));
        }

        return CTokenBalances({
            cToken: address(cToken),
            balanceOf: balanceOf,
            borrowBalanceCurrent: borrowBalanceCurrent,
            balanceOfUnderlying: balanceOfUnderlying,
            tokenBalance: tokenBalance,
            tokenAllowance: tokenAllowance
        });
    }

    function cTokenBalancesAll(SToken[] calldata cTokens, address payable account) external returns (CTokenBalances[] memory) {
        uint cTokenCount = cTokens.length;
        CTokenBalances[] memory res = new CTokenBalances[](cTokenCount);
        for (uint i = 0; i < cTokenCount; i++) {
            res[i] = cTokenBalances(cTokens[i], account);
        }
        return res;
    }

    struct CTokenUnderlyingPrice {
        address cToken;
        uint underlyingPrice;
    }

    function cTokenUnderlyingPrice(CToken cToken) public view returns (CTokenUnderlyingPrice memory) {
        ComptrollerLensInterface comptroller = ComptrollerLensInterface(address(cToken.comptroller()));
        PriceOracle priceOracle = comptroller.oracle();

        return CTokenUnderlyingPrice({
            cToken: address(cToken),
            underlyingPrice: priceOracle.getUnderlyingPrice(cToken)
        });
    }

    function cTokenUnderlyingPriceAll(CToken[] calldata cTokens) external view returns (CTokenUnderlyingPrice[] memory) {
        uint cTokenCount = cTokens.length;
        CTokenUnderlyingPrice[] memory res = new CTokenUnderlyingPrice[](cTokenCount);
        for (uint i = 0; i < cTokenCount; i++) {
            res[i] = cTokenUnderlyingPrice(cTokens[i]);
        }
        return res;
    }

    struct AccountLimits {
        CToken[] markets;
        uint liquidity;
        uint shortfall;
    }

    function getAccountLimits(ComptrollerLensInterface comptroller, address account) public view returns (AccountLimits memory) {
        (uint errorCode, uint liquidity, uint shortfall) = comptroller.getAccountLiquidity(account);
        require(errorCode == 0);

        return AccountLimits({
            markets: comptroller.getAssetsIn(account),
            liquidity: liquidity,
            shortfall: shortfall
        });
    }

    function getAccountLimitsExpand(ComptrollerLensInterface comptroller, address account) public view returns (uint liquidity, uint shortfall,  CToken[] memory markets) {
        AccountLimits memory accountLimits = getAccountLimits(comptroller, account);
        liquidity = accountLimits.liquidity;
        shortfall = accountLimits.shortfall;
        markets = accountLimits.markets;
    }

    struct GovReceipt {
        uint proposalId;
        bool hasVoted;
        bool support;
        uint96 votes;
    }

    function getGovReceipts(GovernorAlpha governor, address voter, uint[] memory proposalIds) public view returns (GovReceipt[] memory) {
        uint proposalCount = proposalIds.length;
        GovReceipt[] memory res = new GovReceipt[](proposalCount);
        for (uint i = 0; i < proposalCount; i++) {
            GovernorAlpha.Receipt memory receipt = governor.getReceipt(proposalIds[i], voter);
            res[i] = GovReceipt({
                proposalId: proposalIds[i],
                hasVoted: receipt.hasVoted,
                support: receipt.support,
                votes: receipt.votes
            });
        }
        return res;
    }

    struct GovProposal {
        uint proposalId;
        address proposer;
        uint eta;
        address[] targets;
        uint[] values;
        string[] signatures;
        bytes[] calldatas;
        uint startBlock;
        uint endBlock;
        uint forVotes;
        uint againstVotes;
        bool canceled;
        bool executed;
    }

    function setProposal(GovProposal memory res, GovernorAlpha governor, uint proposalId) internal view {
        (
            ,
            address proposer,
            uint eta,
            uint startBlock,
            uint endBlock,
            uint forVotes,
            uint againstVotes,
            bool canceled,
            bool executed
        ) = governor.proposals(proposalId);
        res.proposalId = proposalId;
        res.proposer = proposer;
        res.eta = eta;
        res.startBlock = startBlock;
        res.endBlock = endBlock;
        res.forVotes = forVotes;
        res.againstVotes = againstVotes;
        res.canceled = canceled;
        res.executed = executed;
    }

    function getGovProposals(GovernorAlpha governor, uint[] calldata proposalIds) external view returns (GovProposal[] memory) {
        GovProposal[] memory res = new GovProposal[](proposalIds.length);
        for (uint i = 0; i < proposalIds.length; i++) {
            (
                address[] memory targets,
                uint[] memory values,
                string[] memory signatures,
                bytes[] memory calldatas
            ) = governor.getActions(proposalIds[i]);
            res[i] = GovProposal({
                proposalId: 0,
                proposer: address(0),
                eta: 0,
                targets: targets,
                values: values,
                signatures: signatures,
                calldatas: calldatas,
                startBlock: 0,
                endBlock: 0,
                forVotes: 0,
                againstVotes: 0,
                canceled: false,
                executed: false
            });
            setProposal(res[i], governor, proposalIds[i]);
        }
        return res;
    }

    struct CompBalanceMetadata {
        uint balance;
        uint votes;
        address delegate;
    }

    function getCompBalanceMetadata(Comp comp, address account) external view returns (CompBalanceMetadata memory) {
        return CompBalanceMetadata({
            balance: comp.balanceOf(account),
            votes: uint256(comp.getCurrentVotes(account)),
            delegate: comp.delegates(account)
        });
    }

    struct CompBalanceMetadataExt {
        uint balance;
        uint votes;
        address delegate;
        uint allocated;
    }

    function getCompBalanceMetadataExt(Comp comp, ComptrollerLensInterface comptroller, address account) external returns (CompBalanceMetadataExt memory) {
        uint balance = comp.balanceOf(account);
        comptroller.claimComp(account);
        uint newBalance = comp.balanceOf(account);
        uint accrued = comptroller.compAccrued(account);
        uint total = add(accrued, newBalance, "sum comp total");
        uint allocated = sub(total, balance, "sub allocated");

        return CompBalanceMetadataExt({
            balance: balance,
            votes: uint256(comp.getCurrentVotes(account)),
            delegate: comp.delegates(account),
            allocated: allocated
        });
    }

    function getCompBalanceWithAccrued(Comp comp, ComptrollerLensInterface comptroller, address account) external returns (uint balance, uint allocated) {
        balance = comp.balanceOf(account);
        comptroller.claimComp(account);
        uint newBalance = comp.balanceOf(account);
        uint accrued = comptroller.compAccrued(account);
        uint total = add(accrued, newBalance, "sum comp total");
        allocated = sub(total, balance, "sub allocated");
    }

    function getLpRewardPending(QsMdxLPDelegate lpCtoken, address account) public returns (uint mdxReward, uint compReward) {
        CErc20 mdx = CErc20(lpCtoken.mdx());
        Comp comp = Comp(lpCtoken.comp());

        uint mdxBalance = mdx.balanceOf(account);
        uint compBalance = comp.balanceOf(account);

        lpCtoken.claimMdx(account);
        uint newMdxBalance = mdx.balanceOf(account);
        uint newCompBalance = comp.balanceOf(account);

        mdxReward = sub(newMdxBalance, mdxBalance, "sub allocated");
        compReward = sub(newCompBalance, compBalance, "sub allocated");
    }

    function getLpRewardPending(address lpCtoken, uint8 rewardTokenCount, address account) public returns (uint[] memory rewards) {
        QsQuickDualLPDelegate delegate = QsQuickDualLPDelegate(lpCtoken);

        uint[] memory rewardTokensBalance = new uint[](rewardTokenCount);
        for (uint8 i = 0; i < rewardTokenCount; i++) {
            rewardTokensBalance[i] = CErc20(delegate.rewardsTokens(i)).balanceOf(account);
        }

        delegate.claimRewards(account);
        rewards = new uint[](rewardTokenCount);
        for (uint8 i = 0; i < rewardTokenCount; i++) {
            rewards[i] = sub(CErc20(delegate.rewardsTokens(i)).balanceOf(account), rewardTokensBalance[i], "sub allocated");
        }
    }

    // The actual calculation is the daily periodic rate
    function getQuickDualLpAPY(QsQuickDualLPDelegate lp, address dQUICK, uint priceA, uint priceB, uint priceLp) public view returns(uint apyA, uint apyB) {
        IStakingDualRewards stakingRewards = lp.stakingRewards();
        uint rewardRateA = stakingRewards.rewardRateA();
        uint rewardRateB = stakingRewards.rewardRateB();

        uint totalSupply = stakingRewards.totalSupply();

        if (address(stakingRewards.rewardsTokenA()) == dQUICK) {
            DragonLair lair = DragonLair(dQUICK);
            rewardRateA = lair.dQUICKForQUICK(rewardRateA);
        }

        if (address(stakingRewards.rewardsTokenB()) == dQUICK) {
            DragonLair lair = DragonLair(dQUICK);
            rewardRateB = lair.dQUICKForQUICK(rewardRateB);
        }

        // 60 * 60 * 24 = 86400
        apyA = rewardRateA.mul(1e8).mul(86400).div(totalSupply).mul(priceA).div(priceLp);
        apyB = rewardRateB.mul(1e8).mul(86400).div(totalSupply).mul(priceB).div(priceLp);
    }

    // The actual calculation is the daily periodic rate
    function getQuickLpAPY(QsQuickLPDelegate lp, address dQUICK, uint price, uint priceLp) public view returns(uint apy) {
        IStakingRewards stakingRewards = lp.stakingRewards();
        uint rewardRate = stakingRewards.rewardRate();

        uint totalSupply = stakingRewards.totalSupply();

        if (address(stakingRewards.rewardsToken()) == dQUICK) {
            DragonLair lair = DragonLair(dQUICK);
            rewardRate = lair.dQUICKForQUICK(rewardRate);
        }

        // 60 * 60 * 24 = 86400
        apy = rewardRate.mul(1e8).mul(86400).div(totalSupply).mul(price).div(priceLp);
    }

    function getGlideLpAPR(QsGlideLPDelegate lp, uint pid, uint price, uint priceLp) public view returns(uint apr) {
        MasterChef pool = lp.glidePool();
        // reward per block
        uint reward = pool.reward();

        MasterChef.PoolInfo memory poolInfo = pool.poolInfo(pid);
        uint totalAllocPoint = pool.totalAllocPoint();

        // 5 seconds per block
        // 60 * 60 * 24 / 5 = 17280
        // 65% to user
        reward = reward.mul(650).div(1000).mul(poolInfo.allocPoint).div(totalAllocPoint);

        apr = reward.mul(1e8).mul(17280).div(poolInfo.lpSupply).mul(price).div(priceLp);
    }

    struct CompVotes {
        uint blockNumber;
        uint votes;
    }

    function getCompVotes(Comp comp, address account, uint32[] calldata blockNumbers) external view returns (CompVotes[] memory) {
        CompVotes[] memory res = new CompVotes[](blockNumbers.length);
        for (uint i = 0; i < blockNumbers.length; i++) {
            res[i] = CompVotes({
                blockNumber: uint256(blockNumbers[i]),
                votes: uint256(comp.getPriorVotes(account, blockNumbers[i]))
            });
        }
        return res;
    }

    function add(uint a, uint b, string memory errorMessage) internal pure returns (uint) {
        uint c = a + b;
        require(c >= a, errorMessage);
        return c;
    }

    function sub(uint a, uint b, string memory errorMessage) internal pure returns (uint) {
        require(b <= a, errorMessage);
        uint c = a - b;
        return c;
    }
}
