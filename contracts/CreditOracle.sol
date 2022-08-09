pragma solidity ^0.5.16;

import "./Ownable.sol";
import "./ICreditOracle.sol";

contract CreditOracle is ICreditOracle, Ownable {
    mapping(address => uint) private creditCollateralRatio;

    mapping(address => bool) public creditAdmin;

    modifier onlyCreditAdmin {
        require(creditAdmin[msg.sender], "Credit Admin required");
        _;
    }

    event CreditAdminChanged(address creditAdmin, bool);
    event CreditCollateralRatioChanged(address account, uint oldRatio, uint newRatio);

    constructor() public {
        creditAdmin[msg.sender] = true;

        emit CreditAdminChanged(msg.sender, true);
    }

    function updateCreditCollateralRatio(address account, uint accountCreditRatio) external onlyCreditAdmin {
        emit CreditCollateralRatioChanged(account, creditCollateralRatio[account], accountCreditRatio);

        creditCollateralRatio[account] = accountCreditRatio;
    }

    function getCreditCollateralRatio(address account) external view returns (uint) {
        return creditCollateralRatio[account];
    }

    function addCreditAdmin(address newCreditAdmin) external onlyOwner {
        creditAdmin[newCreditAdmin] = true;

        emit CreditAdminChanged(newCreditAdmin, true);
    }

     function removeCreditAdmin(address oldCreditAdmin) external onlyOwner {
        creditAdmin[oldCreditAdmin] = false;

        emit CreditAdminChanged(oldCreditAdmin, false);
    }
}