pragma solidity ^0.5.16;

interface ICreditOracle {
    function getCreditCollateralRatio(address account) external view returns (uint);
}