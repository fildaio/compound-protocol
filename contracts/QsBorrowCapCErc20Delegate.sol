pragma solidity ^0.5.16;

import "./compound/CErc20Delegate.sol";
/**
 * @title CErc20Delegate Contract with borrow cap supported
 * @notice CToken which has borrow cap
 */
contract QsBorrowCapCErc20Delegate is CErc20Delegate {
    uint public borrowCap;

    event BorrowCapChanged(uint oldBorrowCap, uint newBorrowCap);

    function _setBorrowCap(uint newBorrowCap) public {
        require(msg.sender == admin, "only the admin may call _setBorrowCap");

        uint oldBorrowCap = borrowCap;
        borrowCap = newBorrowCap;

        emit BorrowCapChanged(oldBorrowCap, borrowCap);
    }

    /**
     * @notice Sender borrows assets from the protocol to their own address
     * @param borrowAmount The amount of the underlying asset to borrow
     * @return uint 0=success, otherwise a failure (see ErrorReporter.sol for details)
     */
    function borrowInternal(uint borrowAmount) internal returns (uint) {
        uint totalBorrowsNew = add_(totalBorrows, borrowAmount);
        require(totalBorrowsNew <= borrowCap, "Exceed borrow cap");

        return super.borrowInternal(borrowAmount);
    }
}