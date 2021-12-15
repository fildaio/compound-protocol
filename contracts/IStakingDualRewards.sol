pragma solidity ^0.5.16;

import "./compound/EIP20Interface.sol";

interface IStakingDualRewards {
    function lastTimeRewardApplicable() external view returns (uint256);

    function rewardPerTokenA() external view returns (uint256);
    function rewardPerTokenB() external view returns (uint256);

    function rewardRateA() external view returns (uint256);
    function rewardRateB() external view returns (uint256);

    function earnedA(address account) external view returns (uint256);

    function earnedB(address account) external view returns (uint256);

    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    // Mutative

    function stake(uint256 amount) external;

    function withdraw(uint256 amount) external;

    function getReward() external;

    function stakingToken() external view returns(EIP20Interface);
    function rewardsTokenA() external view returns(EIP20Interface);
    function rewardsTokenB() external view returns(EIP20Interface);
}

