pragma solidity ^0.5.16;

import "./compound/CToken.sol";
import "./Qstroller.sol";
import "./IERC3156FlashBorrower.sol";
import "./IWETH.sol";

contract SToken is CToken {
    struct LiquidationLocalVars {
        uint borrowerTokensNew;
        uint liquidatorTokensNew;
        uint safetyVaultTokensNew;
        uint safetyVaultTokens;
        uint liquidatorSeizeTokens;
    }

    function seizeInternal(address seizerToken, address liquidator, address borrower, uint seizeTokens) internal returns (uint) {
        /* Fail if seize not allowed */
        uint allowed = comptroller.seizeAllowed(address(this), seizerToken, liquidator, borrower, seizeTokens);
        if (allowed != 0) {
            return failOpaque(Error.COMPTROLLER_REJECTION, FailureInfo.LIQUIDATE_SEIZE_COMPTROLLER_REJECTION, allowed);
        }

        /* Fail if borrower = liquidator */
        if (borrower == liquidator) {
            return fail(Error.INVALID_ACCOUNT_PAIR, FailureInfo.LIQUIDATE_SEIZE_LIQUIDATOR_IS_BORROWER);
        }

        LiquidationLocalVars memory vars;
        MathError mathErr;

        QsConfig qsConfig = Qstroller(address(comptroller)).qsConfig();
        uint liquidationIncentive = comptroller.getLiquidationIncentive(seizerToken);
        (vars.liquidatorSeizeTokens, vars.safetyVaultTokens) = qsConfig.calculateSeizeTokenAllocation(seizeTokens, liquidationIncentive);
        address safetyVault = qsConfig.safetyVault();
        /*
         * We calculate the new borrower and liquidator token balances, failing on underflow/overflow:
         *  borrowerTokensNew = accountTokens[borrower] - seizeTokens
         *  liquidatorTokensNew = accountTokens[liquidator] + seizeTokens
         */
        (mathErr, vars.borrowerTokensNew) = subUInt(accountTokens[borrower], seizeTokens);
        if (mathErr != MathError.NO_ERROR) {
            return failOpaque(Error.MATH_ERROR, FailureInfo.LIQUIDATE_SEIZE_BALANCE_DECREMENT_FAILED, uint(mathErr));
        }

        (mathErr, vars.liquidatorTokensNew) = addUInt(accountTokens[liquidator], vars.liquidatorSeizeTokens);
        if (mathErr != MathError.NO_ERROR) {
            return failOpaque(Error.MATH_ERROR, FailureInfo.LIQUIDATE_SEIZE_BALANCE_INCREMENT_FAILED, uint(mathErr));
        }

        (mathErr, vars.safetyVaultTokensNew) = addUInt(accountTokens[safetyVault], vars.safetyVaultTokens);
        if (mathErr != MathError.NO_ERROR) {
            return failOpaque(Error.MATH_ERROR, FailureInfo.LIQUIDATE_SEIZE_BALANCE_INCREMENT_FAILED, uint(mathErr));
        }

        /////////////////////////
        // EFFECTS & INTERACTIONS
        // (No safe failures beyond this point)

        /* We write the previously calculated values into storage */
        accountTokens[borrower] = vars.borrowerTokensNew;
        accountTokens[liquidator] = vars.liquidatorTokensNew;
        accountTokens[safetyVault] = vars.safetyVaultTokensNew;

        /* Emit a Transfer event */
        emit Transfer(borrower, liquidator, vars.liquidatorSeizeTokens);
        emit Transfer(borrower, safetyVault, vars.safetyVaultTokens);

        return uint(Error.NO_ERROR);
    }

    function isNativeToken() public pure returns (bool) {
        return false;
    }

    /**
     * @dev The amount of currency available to be lent.
     * @param token The loan currency.
     * @return The amount of `token` that can be borrowed.
     */
    function maxFlashLoan(address token) external view returns (uint256) {
        token;
        return Qstroller(address(comptroller)).getFlashLoanCap(address(this));
    }

    /**
     * @dev The fee to be charged for a given loan.
     * @param token The loan currency.
     * @param amount The amount of tokens lent.
     * @return The amount of `token` to be charged for the loan, on top of the returned principal.
     */
    function flashFee(address token, uint256 amount) external view returns (uint256) {
        token;
        return getFlashFeeInternal(token, amount);
    }

    function getFlashFeeInternal(address token, uint256 amount) internal view returns (uint256) {
        token;
        return Qstroller(address(comptroller)).qsConfig().getFlashFee(msg.sender, address(this), amount);
    }

    /**
     * @dev Initiate a flash loan.
     * @param receiver The receiver of the tokens in the loan, and the receiver of the callback.
     * @param token The loan currency.
     * @param amount The amount of tokens lent.
     * @param data Arbitrary data structure, intended to contain user-defined parameters.
     */
    function flashLoan(IERC3156FlashBorrower receiver, address token, uint256 amount, bytes calldata data) external returns (bool) {
        token;
        require(accrueInterest() == uint(Error.NO_ERROR), "Accrue interest failed");
        
        Qstroller(address(comptroller)).flashLoanAllowed(address(this), address(receiver), amount);

        uint cashBefore = getCashPrior();
        require(cashBefore >= amount, "Insufficient liquidity");
        // 1. calculate fee
        uint fee = getFlashFeeInternal(token, amount);
        // 2. transfer fund  to receiver
        doFlashLoanTransferOut(address(uint160(address(receiver))), token, amount);
        // 3. update totalBorrows
        totalBorrows = add_(totalBorrows, amount);
        // 4. execute receiver's callback function
        require(receiver.onFlashLoan(msg.sender, token, amount, fee, data) ==
                keccak256("ERC3156FlashBorrowerInterface.onFlashLoan"),
                "IERC3156: Callback failed"
        );
        // 5. check cash balance
        uint256 repaymentAmount = add_(amount, fee);
        doFlashLoanTransferIn(address(receiver), token, repaymentAmount);
        uint cashAfter = getCashPrior();
        require(cashAfter == add_(cashBefore, fee), "Inconsistent balance");

        (MathError err, uint reservesFee)= mulScalarTruncate(Exp({mantissa: reserveFactorMantissa}), fee);
        require(err == MathError.NO_ERROR, "Error to calculate flashloan reserve fee");
        totalReserves = add_(totalReserves, reservesFee);
        totalBorrows = sub_(totalBorrows, amount);
        return true;
    }

    function doFlashLoanTransferOut(address payable receiver, address token, uint amount) internal {
        token;
        doTransferOut(receiver, amount);
    }

    function doFlashLoanTransferIn(address receiver, address token, uint amount) internal {
        token;
        doTransferIn(receiver, amount);
    }
}