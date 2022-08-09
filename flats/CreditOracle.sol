// File: contracts/Ownable.sol

pragma solidity ^0.5.16;

contract Ownable {
    address public _owner;
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor () internal {
        _owner = msg.sender;

        emit OwnershipTransferred(address(0), msg.sender);
    }

    function owner() public view returns (address) {
        return _owner;
    }

    modifier onlyOwner() {
        require(_owner == msg.sender, "Ownable: caller is not the owner");
        _;
    }

    function renounceOwnership() public onlyOwner {
        emit OwnershipTransferred(_owner, address(0));
        _owner = address(0);
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }
}

// File: contracts/ICreditOracle.sol

pragma solidity ^0.5.16;

interface ICreditOracle {
    function getCreditCollateralRatio(address account) external view returns (uint);
}

// File: contracts/CreditOracle.sol

pragma solidity ^0.5.16;


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
