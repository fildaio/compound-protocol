pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

import "./compound/CErc20Delegate.sol";
import "./compound/EIP20Interface.sol";
import "./Qstroller.sol";

interface HecoPool {
    struct PoolInfo {
        address lpToken;
    }

    struct UserInfo {
        uint256 amount;
    }

    function deposit(uint256, uint256) external;
    function withdraw(uint256, uint256) external;
    function mdx() view external returns (address);
    function poolInfo(uint256) view external returns (PoolInfo memory);
    function userInfo(uint256, address) view external returns (UserInfo memory);
    function pending(uint256, address) external view returns (uint256);
}


/**
 * @title Mdex LP Contract
 * @notice CToken which wraps Mdex's LP token
 */
contract QsMdxLPDelegate is CErc20Delegate {
    /**
     * @notice HecoPool address
     */
    address public hecoPool;

    /**
     * @notice MDX token address
     */
    address public mdx;

    /**
     * @notice Pool ID of this LP in HecoPool
     */
    uint public pid;

    /**
     * @notice fMdx address
     */
    address public fMdx;

    /**
     * @notice Comp address
     */
    address public comp;

    /**
     * @notice Container for rewards state
     * @member balance The balance of fMdx
     * @member index The last updated fMdx index
     * @member compBalance The balance of comp
     * @member compIndex The last updated comp index
     */
    struct RewardState {
        uint balance;
        uint index;
        uint compBalance;
        uint compIndex;
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
     * @notice The fMdx amount of every user
     */
    mapping(address => uint) public fTokenUserAccrued;

    /**
     * @notice The index of every comp supplier
     */
    mapping(address => uint) public compSupplierIndex;

    /**
     * @notice The comp amount of every user
     */
    mapping(address => uint) public compUserAccrued;

    /**
     * @notice Delegate interface to become the implementation
     * @param data The encoded arguments for becoming
     */
    function _becomeImplementation(bytes memory data) public {
        super._becomeImplementation(data);

        (address hecoPoolAddress_, address fMdxAddress_, uint pid_) = abi.decode(data, (address, address, uint));
        hecoPool = hecoPoolAddress_;
        mdx = HecoPool(hecoPool).mdx();
        fMdx = fMdxAddress_;

        comp = Qstroller(address(comptroller)).getCompAddress();

        HecoPool.PoolInfo memory poolInfo = HecoPool(hecoPool).poolInfo(pid_);
        require(poolInfo.lpToken == underlying, "mismatch underlying");
        pid = pid_;

        // Approve moving our LP into the heco pool contract.
        EIP20Interface(underlying).approve(hecoPoolAddress_, uint(-1));

        // Approve moving mdx rewards into the fMdx contract.
        EIP20Interface(mdx).approve(fMdxAddress_, uint(-1));
    }

    /**
     * @notice Manually claim rewards by user
     * @return The amount of fMdx rewards user claims
     */
    function claimMdx(address account) public returns (uint) {
        claimAndStakeMdx();

        updateLPSupplyIndex();
        updateSupplierIndex(account);

        // Get user's fMdx accrued.
        uint fTokenBalance = fTokenUserAccrued[account];
        if (fTokenBalance > 0) {
            uint err = CErc20(fMdx).redeem(fTokenBalance);
            require(err == 0, "redeem fmdx failed");

            lpSupplyState.balance = sub_(lpSupplyState.balance, fTokenBalance);

            EIP20Interface(mdx).transfer(account, mdxBalance());

            // Clear user's fMdx accrued.
            fTokenUserAccrued[account] = 0;
        }

        // Get user's comp accrued.
        uint compBalance = compUserAccrued[account];
        if (compBalance > 0) {
            lpSupplyState.compBalance = sub_(lpSupplyState.compBalance, compBalance);

            EIP20Interface(comp).transfer(account, compBalance);

            // Clear user's comp accrued.
            compUserAccrued[account] = 0;
        }

        return fTokenBalance;
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
        claimAndStakeMdx();

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
        HecoPool.UserInfo memory userInfo = HecoPool(hecoPool).userInfo(pid, address(this));
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

        // Deposit to HecoPool.
        HecoPool(hecoPool).deposit(pid, amount);

        if (mdxBalance() > 0) {
            // Send mdx rewards to fMdx.
            CErc20(fMdx).mint(mdxBalance());
        }

        harvestComp();

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
        // Withdraw the underlying tokens from HecoPool.
        HecoPool(hecoPool).withdraw(pid, amount);

        if (mdxBalance() > 0) {
            // Send mdx rewards to fMdx.
            CErc20(fMdx).mint(mdxBalance());
        }

        harvestComp();

        updateLPSupplyIndex();
        updateSupplierIndex(to);

        EIP20Interface token = EIP20Interface(underlying);
        require(token.transfer(to, amount), "unexpected EIP-20 transfer out return");
    }

    /*** Internal functions ***/

    function claimAndStakeMdx() internal {
        // Deposit 0 LP into HecoPool to claim mdx rewards.
        HecoPool(hecoPool).deposit(pid, 0);

        if (mdxBalance() > 0) {
            // Send mdx rewards to mdx pool.
            CErc20(fMdx).mint(mdxBalance());
        }

        harvestComp();
    }

    function harvestComp() internal {
        address[] memory holders = new address[](1);
        holders[0] = address(this);
        CToken[] memory cTokens = new CToken[](1);
        cTokens[0] = CToken(fMdx);

        // MdexLP contract will never borrow assets from Compound.
        Qstroller(address(comptroller)).claimComp(holders, cTokens, false, true);
    }

    function updateLPSupplyIndex() internal {
        uint fTokenBalance = fTokenBalance();
        uint fTokenAccrued = sub_(fTokenBalance, lpSupplyState.balance);
        uint supplyTokens = CToken(address(this)).totalSupply();
        Double memory ratio = supplyTokens > 0 ? fraction(fTokenAccrued, supplyTokens) : Double({mantissa: 0});
        Double memory index = add_(Double({mantissa: lpSupplyState.index}), ratio);

        uint compBalance = compBalance();
        uint compAccrued = sub_(compBalance, lpSupplyState.compBalance);
        Double memory compRatio = supplyTokens > 0 ? fraction(compAccrued, supplyTokens) : Double({mantissa: 0});
        Double memory compIndex = add_(Double({mantissa: lpSupplyState.compIndex}), compRatio);

        // Update lpSupplyState.
        lpSupplyState.index = index.mantissa;
        lpSupplyState.balance = fTokenBalance;
        lpSupplyState.compIndex = compIndex.mantissa;
        lpSupplyState.compBalance = compBalance;
    }

    function updateSupplierIndex(address supplier) internal {
        Double memory supplyIndex = Double({mantissa: lpSupplyState.index});
        Double memory supplierIndex = Double({mantissa: lpSupplierIndex[supplier]});
        Double memory deltaIndex = sub_(supplyIndex, supplierIndex);
        if (deltaIndex.mantissa > 0) {
            uint supplierTokens = CToken(address(this)).balanceOf(supplier);
            uint supplierDelta = mul_(supplierTokens, deltaIndex);
            fTokenUserAccrued[supplier] = add_(fTokenUserAccrued[supplier], supplierDelta);
            lpSupplierIndex[supplier] = supplyIndex.mantissa;
        }

        Double memory compSupplyIndex = Double({mantissa: lpSupplyState.compIndex});
        Double memory compSupplierIndex_ = Double({mantissa: compSupplierIndex[supplier]});
        Double memory deltaCompIndex = sub_(compSupplyIndex, compSupplierIndex_);
        if (deltaCompIndex.mantissa > 0) {
            uint supplierTokens = CToken(address(this)).balanceOf(supplier);
            uint supplierDelta = mul_(supplierTokens, deltaCompIndex);
            compUserAccrued[supplier] = add_(compUserAccrued[supplier], supplierDelta);
            compSupplierIndex[supplier] = compSupplyIndex.mantissa;
        }
    }

    function mdxBalance() internal view returns (uint) {
        return EIP20Interface(mdx).balanceOf(address(this));
    }

    function fTokenBalance() internal view returns (uint) {
        return EIP20Interface(fMdx).balanceOf(address(this));
    }

    function compBalance() internal view returns (uint) {
        return EIP20Interface(comp).balanceOf(address(this));
    }
}