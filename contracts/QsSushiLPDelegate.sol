pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

import "./compound/CErc20Delegate.sol";
import "./compound/EIP20Interface.sol";
import "./Qstroller.sol";

interface IRewarder {
    function onSushiReward(uint256 pid, address user, address recipient, uint256 sushiAmount, uint256 newLpAmount) external;
    function pendingTokens(uint256 pid, address user, uint256 sushiAmount) external view returns (EIP20Interface[] memory, uint256[] memory);
}

interface MiniChefV2 {

    struct UserInfo {
        uint256 amount;
        int256 rewardDebt;
    }

    function lpToken(uint pid) external view returns(address);
    function rewarder(uint pid) external view returns(IRewarder);
    function deposit(uint256 pid, uint256 amount, address to) external;
    function withdraw(uint256 pid, uint256 amount, address to) external;
    function harvest(uint256 pid, address to) external;
    function SUSHI() view external returns (EIP20Interface);
    function userInfo(uint256 pid, address account) view external returns (UserInfo memory);
    function pendingSushi(uint256 _pid, address _user) external view returns (uint256 pending);
}

/**
 * @title sushi LP Contract
 * @notice CToken which wraps sushi's LP token
 */
contract QsSushiLPDelegate is CErc20Delegate {
    /**
     * @notice sushiPool
     */
    MiniChefV2 public sushiPool;

    /**
     * @notice sushi token
     */
    EIP20Interface public sushi;

    /**
     * @notice Pool ID of this LP in sushiPool
     */
    uint public pid;

    /**
     * @notice Pool ID of this LP in sushiPool
     */
    IRewarder public rewarder;

    /**
     * @notice reward tokens from IRewarder
     */
    EIP20Interface[]  public rewardTokens;

    /**
     * @notice Container for rewards state
     * @member balance The balance of sushi
     * @member index The last updated sushi index
     */
    struct RewardState {
        uint balance;
        uint index;
        mapping(address => uint) compBalance;
        mapping(address => uint) compIndex;
    }

    /**
     * @notice The state of LP supply
     */
    RewardState public lpSupplyState;

    /**
     * @notice The index of every LP supplier
     */
    mapping(address => uint) public lpSupplierIndex;

    /**
     * @notice The sushi amount of every user
     */
    mapping(address => uint) public sushiUserAccrued;

    /**
     * @notice The index of every comp supplier
     */
    mapping(address => mapping(address => uint)) public compSupplierIndex;

    /**
     * @notice The comp amount of every user
     */
    mapping(address => mapping(address => uint)) public compUserAccrued;

    /**
     * @notice Delegate interface to become the implementation
     * @param data The encoded arguments for becoming
     */
    function _becomeImplementation(bytes memory data) public {
        super._becomeImplementation(data);

        (address poolAddress_, uint pid_) = abi.decode(data, (address, uint));
        sushiPool = MiniChefV2(poolAddress_);
        sushi = sushiPool.SUSHI();

        rewarder = sushiPool.rewarder(pid_);

        pid = pid_;

        (rewardTokens, ) = rewarder.pendingTokens(pid, address(this), 0);

        // Approve moving our LP into the pool contract.
        EIP20Interface(sushiPool.lpToken(pid)).approve(poolAddress_, uint(-1));
    }

    /**
     * @notice Manually claim rewards by user
     * @return The amount of sushi rewards user claims
     */
    function claimRewards(address account) public returns (uint) {
        claimRewardsFromSushi();

        updateLPSupplyIndex();
        updateSupplierIndex(account);

        // Get user's sushi accrued.
        uint sushiBalance = sushiUserAccrued[account];
        if (sushiBalance > 0) {

            lpSupplyState.balance = sub_(lpSupplyState.balance, sushiBalance);

            // Clear user's sushi accrued.
            sushiUserAccrued[account] = 0;

            sushi.transfer(account, sushiBalance);
        }

        // Get user's comp accrued.
        mapping(address => uint) storage accured = compUserAccrued[account];
        for (uint8 i = 0; i < rewardTokens.length; i++) {
            address token = address(rewardTokens[i]);
            uint compBalance = accured[token];
            if (compBalance > 0) {
                lpSupplyState.compBalance[token] = sub_(lpSupplyState.compBalance[token], compBalance);

                // Clear user's comp accrued.
                compUserAccrued[account][token] = 0;

                rewardTokens[i].transfer(account, compBalance);
            }
        }


        return sushiBalance;
    }

    /*** CErc20 Overrides ***/
    /**
     * lp token does not borrow.
     */
    function borrow(uint borrowAmount) external returns (uint) {
        borrowAmount;
        require(false, "lptoken prohibits borrowing");
    }

    /**
     * lp token does not repayBorrow.
     */
    function repayBorrow(uint repayAmount) external returns (uint) {
        repayAmount;
        require(false, "lptoken prohibits repay");
    }

    function repayBorrowBehalf(address borrower, uint repayAmount) external returns (uint) {
        borrower;repayAmount;
        require(false, "lptoken prohibits repayBorrowBehalf");
    }

    function liquidateBorrow(address borrower, uint repayAmount, CTokenInterface cTokenCollateral) external returns (uint) {
        borrower;repayAmount;cTokenCollateral;
        require(false, "lptoken prohibits liquidate");
    }

    /*** CToken Overrides ***/

    /**
     * @notice Transfer `tokens` tokens from `src` to `dst` by `spender`
     * @param spender The address of the account performing the transfer
     * @param src The address of the source account
     * @param dst The address of the destination account
     * @param tokens The number of tokens to transfer
     * @return Whether or not the transfer succeeded
     */
    function transferTokens(address spender, address src, address dst, uint tokens) internal returns (uint) {
        claimRewardsFromSushi();

        updateLPSupplyIndex();
        updateSupplierIndex(src);
        updateSupplierIndex(dst);

        return super.transferTokens(spender, src, dst, tokens);
    }

    /*** Safe Token ***/

    /**
     * @notice Gets balance of this contract in terms of the underlying
     * @return The quantity of underlying tokens owned by this contract
     */
    function getCashPrior() internal view returns (uint) {
        MiniChefV2.UserInfo memory userInfo = sushiPool.userInfo(pid, address(this));
        return userInfo.amount;
    }

    /**
     * @notice Transfer the underlying to this contract and sweep into master chef
     * @param from Address to transfer funds from
     * @param amount Amount of underlying to transfer
     * @return The actual amount that is transferred
     */
    function doTransferIn(address from, uint amount) internal returns (uint) {
        // Perform the EIP-20 transfer in
        EIP20Interface token = EIP20Interface(underlying);
        require(token.transferFrom(from, address(this), amount), "unexpected EIP-20 transfer in return");

        // Deposit to sushi pool.
        sushiPool.deposit(pid, amount, address(this));

        updateLPSupplyIndex();
        updateSupplierIndex(from);

        return amount;
    }

    /**
     * @notice Transfer the underlying from this contract, after sweeping out of master chef
     * @param to Address to transfer funds to
     * @param amount Amount of underlying to transfer
     */
    function doTransferOut(address payable to, uint amount) internal {
        // Withdraw the underlying tokens from sushi pool.
        sushiPool.withdraw(pid, amount, address(this));

        EIP20Interface token = EIP20Interface(underlying);
        require(token.transfer(to, amount), "unexpected EIP-20 transfer out return");
    }

    function seizeInternal(address seizerToken, address liquidator, address borrower, uint seizeTokens) internal returns (uint) {
        claimRewardsFromSushi();

        updateLPSupplyIndex();
        updateSupplierIndex(liquidator);
        updateSupplierIndex(borrower);

        address safetyVault = Qstroller(address(comptroller)).qsConfig().safetyVault();
        updateSupplierIndex(safetyVault);

        return super.seizeInternal(seizerToken, liquidator, borrower, seizeTokens);
    }

    /**
     * @notice Sender redeems cTokens in exchange for the underlying asset
     * @dev Accrues interest whether or not the operation succeeds, unless reverted
     * @param redeemTokens The number of cTokens to redeem into underlying
     * @return uint 0=success, otherwise a failure (see ErrorReporter.sol for details)
     */
    function redeem(uint redeemTokens) external returns (uint) {
        // claim user's reward first
        claimRewards(msg.sender);

        return redeemInternal(redeemTokens);
    }

    /**
     * @notice Sender redeems cTokens in exchange for a specified amount of underlying asset
     * @dev Accrues interest whether or not the operation succeeds, unless reverted
     * @param redeemAmount The amount of underlying to redeem
     * @return uint 0=success, otherwise a failure (see ErrorReporter.sol for details)
     */
    function redeemUnderlying(uint redeemAmount) external returns (uint) {
        // claim user's reward first
        claimRewards(msg.sender);

        return redeemUnderlyingInternal(redeemAmount);
    }

    /*** Internal functions ***/

    function claimRewardsFromSushi() internal {
        sushiPool.harvest(pid, address(this));
    }

    function updateLPSupplyIndex() internal {
        uint sushiBalance = sushiBalance();
        uint sushiAccrued = sub_(sushiBalance, lpSupplyState.balance);
        uint supplyTokens = this.totalSupply();
        Double memory ratio = supplyTokens > 0 ? fraction(sushiAccrued, supplyTokens) : Double({mantissa: 0});
        Double memory index = add_(Double({mantissa: lpSupplyState.index}), ratio);


        // Update lpSupplyState.
        lpSupplyState.index = index.mantissa;
        lpSupplyState.balance = sushiBalance;

        for (uint8 i = 0; i < rewardTokens.length; i++) {
            address token = address(rewardTokens[i]);
            uint compBalance = compBalance(i);
            if (compBalance == 0) continue;
            uint compAccrued = sub_(compBalance, lpSupplyState.compBalance[token]);
            Double memory compRatio = supplyTokens > 0 ? fraction(compAccrued, supplyTokens) : Double({mantissa: 0});
            Double memory compIndex = add_(Double({mantissa: lpSupplyState.compIndex[token]}), compRatio);

            lpSupplyState.compIndex[token] = compIndex.mantissa;
            lpSupplyState.compBalance[token] = compBalance;
        }
    }

    function updateSupplierIndex(address supplier) internal {
        Double memory supplyIndex = Double({mantissa: lpSupplyState.index});
        Double memory supplierIndex = Double({mantissa: lpSupplierIndex[supplier]});
        Double memory deltaIndex = sub_(supplyIndex, supplierIndex);
        if (deltaIndex.mantissa > 0) {
            uint supplierTokens = this.balanceOf(supplier);
            uint supplierDelta = mul_(supplierTokens, deltaIndex);
            sushiUserAccrued[supplier] = add_(sushiUserAccrued[supplier], supplierDelta);
            lpSupplierIndex[supplier] = supplyIndex.mantissa;
        }

        mapping(address => uint) storage accured = compUserAccrued[supplier];
        mapping(address => uint) storage _compSupplierIndex = compSupplierIndex[supplier];

        for (uint8 i = 0; i < rewardTokens.length; i++) {
            address token = address(rewardTokens[i]);
            Double memory compSupplyIndex = Double({mantissa: lpSupplyState.compIndex[token]});
            Double memory compSupplierIndex_ = Double({mantissa: _compSupplierIndex[token]});
            Double memory deltaCompIndex = sub_(compSupplyIndex, compSupplierIndex_);
            if (deltaCompIndex.mantissa > 0) {
                uint supplierTokens = this.balanceOf(supplier);
                uint supplierDelta = mul_(supplierTokens, deltaCompIndex);

                accured[token] = add_(accured[token], supplierDelta);
                _compSupplierIndex[token] = compSupplyIndex.mantissa;
            }
        }

    }

    function sushiBalance() internal view returns (uint) {
        return sushi.balanceOf(address(this));
    }

    function compBalance(uint8 index) internal view returns (uint) {
        return index >= rewardTokens.length ? 0 : rewardTokens[index].balanceOf(address(this));
    }
}
