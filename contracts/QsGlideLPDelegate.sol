pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

import "./compound/CErc20Delegate.sol";
import "./compound/EIP20Interface.sol";
import "./Qstroller.sol";
import "./FTokenStorage.sol";

interface IRewarder {
    function pendingTokens(uint256 pid, address user, uint256 sushiAmount) external view returns (EIP20Interface[] memory, uint256[] memory);
}

interface MasterChef {

    struct UserInfo {
        uint256 amount;
        int256 rewardDebt;
    }

    struct PoolInfo {
        EIP20Interface lpToken;           // Address of LP token contract.
        uint256 allocPoint;       // How many allocation points assigned to this pool. GLIDEs to distribute per block.
        uint256 lastRewardBlock;  // Last block number that GLIDEs distribution occurs.
        uint256 accGlidePerShare; // Accumulated GLIDEs per share, times 1e18. See below.
        uint256 lpSupply;
    }

    function poolInfo(uint pid) external view returns(PoolInfo memory);
    function deposit(uint256 pid, uint256 amount) external;
    function withdraw(uint256 pid, uint256 amount) external;
    function glide() view external returns (EIP20Interface);
    function userInfo(uint256 pid, address account) view external returns (UserInfo memory);
}

/**
 * @title glide LP Contract
 * @notice CToken which wraps glide's LP token
 */
contract QsGlideLPDelegate is CErc20Delegate {
    /**
     * @notice glidePool
     */
    MasterChef public glidePool;

    /**
     * @notice Pool ID of this LP in glidePool
     */
    uint public pid;

    /**
     * @notice reward tokens
     */
    address[] public rewardsTokens;

    mapping(address => address) public rewardsFToken;

    /**
     * @notice Container for rewards state
     * @member balance The balance of token
     * @member index The last updated token index
     */
    struct RewardState {
        uint balance;
        uint index;
    }

    /**
     * @notice The state of LP supply
     */
    mapping(address => RewardState) public lpSupplyStates;

    /**
     * @notice The index of every LP supplier
     */
    mapping(address => mapping(address => uint)) public lpSupplierIndex;

    /**
     * @notice The token amount of every user
     */
    mapping(address => mapping(address => uint)) public tokenUserAccrued;

    bool public harvestComp;

    /**
     * @notice Delegate interface to become the implementation
     * @param data The encoded arguments for becoming
     */
    function _becomeImplementation(bytes memory data) public {
        super._becomeImplementation(data);

        (address poolAddress_, uint pid_, address ftokenStorageAddr) = abi.decode(data, (address, uint, address));
        glidePool = MasterChef(poolAddress_);
        MasterChef.PoolInfo memory poolInfo = glidePool.poolInfo(pid_);
        require(underlying == address(poolInfo.lpToken), "mismatch underlying");

        pid = pid_;

        bool pushComp = false;
        if (rewardsTokens.length == 0) {
            pushComp = true;
            rewardsTokens.push(address(glidePool.glide()));
        }

        FTokenStorage ftokenStorage = FTokenStorage(ftokenStorageAddr);
        for (uint8 i = 0; i < rewardsTokens.length; i++) {
            // ignore native token, delegator cannot send value
            if(rewardsTokens[i] == ftokenStorage.WETH()) continue;

            address ftoken = ftokenStorage.ftoken(rewardsTokens[i]);
            if (ftoken == address(0)) continue;

            harvestComp = true;
            rewardsFToken[rewardsTokens[i]] = ftoken;

            // Approve moving rewards into the fToken contract.
            EIP20Interface(rewardsTokens[i]).approve(ftoken, uint(-1));
        }

        if (harvestComp && pushComp) {
            rewardsTokens.push(Qstroller(address(comptroller)).getCompAddress());
        }

        // Approve moving our LP into the pool contract.
        EIP20Interface(underlying).approve(poolAddress_, uint(-1));
    }

    /**
     * @notice Manually claim rewards by user
     * @return The amount of sushi rewards user claims
     */
    function claimRewards(address account) public returns (uint) {
        claimRewardsFromGlide();

        updateLPSupplyIndex();
        updateSupplierIndex(account);

        mintToFilda();

        // Get user's token accrued.
        for (uint8 i = 0; i < rewardsTokens.length; i++) {
            address token = rewardsTokens[i];

            uint accrued = tokenUserAccrued[account][token];
            if (accrued == 0) continue;

            lpSupplyStates[token].balance = sub_(lpSupplyStates[token].balance, accrued);

            if (rewardsFToken[token] != address(0)) {
                uint err = CErc20(rewardsFToken[token]).redeemUnderlying(accrued);
                require(err == 0, "redeem ftoken failed");
            }

                // Clear user's token accrued.
            tokenUserAccrued[account][token] = 0;

            EIP20Interface(token).transfer(account, accrued);
        }

        return 0;
    }

    function setRewardFToken(address token, address ftoken) external {
        require(msg.sender == admin, "Caller must be admin");
        require(token != address(0), "invalid param");

        if (ftoken != address(0)) {
            require(token == CErc20(ftoken).underlying(), "mismatch underlying");
            if(!harvestComp) harvestComp = true;
        }

        if (ftoken == address(0) && rewardsFToken[token] != address(0) && lpSupplyStates[token].balance > 0) {
            CErc20(rewardsFToken[token]).redeemUnderlying(lpSupplyStates[token].balance);
        }

        rewardsFToken[token] = ftoken;
    }

    /*** CErc20 Overrides ***/
    /**
     * lp token does not borrow.
     */
    function borrow(uint borrowAmount) external returns (uint) {
        borrowAmount;
        require(false);
    }

    /**
     * lp token does not repayBorrow.
     */
    function repayBorrow(uint repayAmount) external returns (uint) {
        repayAmount;
        require(false);
    }

    function repayBorrowBehalf(address borrower, uint repayAmount) external returns (uint) {
        borrower;repayAmount;
        require(false);
    }

    function liquidateBorrow(address borrower, uint repayAmount, CTokenInterface cTokenCollateral) external returns (uint) {
        borrower;repayAmount;cTokenCollateral;
        require(false);
    }

    function flashLoan(IERC3156FlashBorrower receiver, address token, uint256 amount, bytes calldata data) external returns (bool) {
        receiver;token;amount;data;
        require(false);
    }

    function _addReserves(uint addAmount) external returns (uint) {
        addAmount;
        require(false);
    }

    function _reduceReserves(uint reduceAmount) external nonReentrant returns (uint) {
        reduceAmount;
        require(false);
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
        claimRewardsFromGlide();

        updateLPSupplyIndex();
        updateSupplierIndex(src);
        updateSupplierIndex(dst);

        mintToFilda();

        return super.transferTokens(spender, src, dst, tokens);
    }

    /*** Safe Token ***/

    /**
     * @notice Gets balance of this contract in terms of the underlying
     * @return The quantity of underlying tokens owned by this contract
     */
    function getCashPrior() internal view returns (uint) {
        MasterChef.UserInfo memory userInfo = glidePool.userInfo(pid, address(this));
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
        super.doTransferIn(from, amount);

        // Deposit to sushi pool.
        glidePool.deposit(pid, amount);

        claimRewardsFromGlide();

        updateLPSupplyIndex();
        updateSupplierIndex(from);

        mintToFilda();

        return amount;
    }

    /**
     * @notice Transfer the underlying from this contract, after sweeping out of master chef
     * @param to Address to transfer funds to
     * @param amount Amount of underlying to transfer
     */
    function doTransferOut(address payable to, uint amount) internal {
        // Withdraw the underlying tokens from sushi pool.
        glidePool.withdraw(pid, amount);
        super.doTransferOut(to, amount);
    }

    function seizeInternal(address seizerToken, address liquidator, address borrower, uint seizeTokens) internal returns (uint) {
        claimRewardsFromGlide();

        updateLPSupplyIndex();
        updateSupplierIndex(liquidator);
        updateSupplierIndex(borrower);

        address safetyVault = Qstroller(address(comptroller)).qsConfig().safetyVault();
        updateSupplierIndex(safetyVault);

        mintToFilda();

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

    function claimRewardsFromGlide() internal {
        glidePool.deposit(pid, 0);

        if (harvestComp) {
            // harvestComp
            Qstroller(address(comptroller)).claimComp(address(this));
        }
    }

    function mintToFilda() internal {
        for (uint8 i = 0; i < rewardsTokens.length; i++) {
            address token = rewardsTokens[i];
            if (rewardsFToken[token] == address(0)) continue;

            uint balance = tokenBalance(token);
            if (balance == 0) continue;
            CErc20(rewardsFToken[token]).mint(balance);
        }
    }

    function updateLPSupplyIndex() internal {
        for (uint8 i = 0; i < rewardsTokens.length; i++) {
            address token = rewardsTokens[i];

            uint balance = tokenBalance(token);
            uint tokenAccrued = sub_(balance, lpSupplyStates[token].balance);
            uint supplyTokens = this.totalSupply();
            Double memory ratio = supplyTokens > 0 ? fraction(tokenAccrued, supplyTokens) : Double({mantissa: 0});
            Double memory index = add_(Double({mantissa: lpSupplyStates[token].index}), ratio);

            lpSupplyStates[token].index = index.mantissa;
            lpSupplyStates[token].balance = balance;
        }
    }

    function updateSupplierIndex(address supplier) internal {
        for (uint8 i = 0; i < rewardsTokens.length; i++) {
            address token = rewardsTokens[i];

            Double memory supplyIndex = Double({mantissa: lpSupplyStates[token].index});
            Double memory supplierIndex = Double({mantissa: lpSupplierIndex[supplier][token]});
            Double memory deltaIndex = sub_(supplyIndex, supplierIndex);

            if (deltaIndex.mantissa > 0) {
                uint supplierTokens = this.balanceOf(supplier);
                uint supplierDelta = mul_(supplierTokens, deltaIndex);
                tokenUserAccrued[supplier][token] = add_(tokenUserAccrued[supplier][token], supplierDelta);
                lpSupplierIndex[supplier][token] = supplyIndex.mantissa;
            }
        }
    }

    function tokenBalance(address token) internal view returns (uint) {
        return EIP20Interface(token).balanceOf(address(this));
    }
}
