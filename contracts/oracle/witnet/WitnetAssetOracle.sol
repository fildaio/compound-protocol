pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

import "../../ChainlinkAggregatorV3Interface.sol";
import "../../Ownable.sol";
import "../../compound/SafeMath.sol";
import "./IERC2362.sol";

contract WitnetAssetOracle is ChainlinkAggregatorV3Interface, Ownable {
    using SafeMath for uint;

    uint8 private decimals_;
    string private description_;
    IERC2362 public baseOracle;

    address public asset;
    bytes32 public assetId;

    constructor(
        uint8 _decimals,
        string memory _description,
        IERC2362 _baseOracle,
        address _asset,
        bytes32 _assetId
        ) public {
        require(_asset != address(0), "BandAssetOracle: asset address is zero");
        decimals_ = _decimals;
        description_ = _description;
        baseOracle = _baseOracle;
        asset = _asset;
        assetId = _assetId;
    }

    function decimals() external view returns (uint8) {
        return decimals_;
    }

    function description() external view returns (string memory) {
        return description_;
    }

    function version() external view returns (uint256) {
        return 1;
    }

    function getRoundData(uint80 _roundId) public
    view
    returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        roundId = _roundId;
        (answer, updatedAt,) = baseOracle.valueFor(assetId);
        startedAt = 0;
        answeredInRound = 0;
    }

    function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound) {
        return getRoundData(0);
    }

    function setBaseOracle(IERC2362 _baseOracle) external onlyOwner {
        baseOracle = _baseOracle;
    }
}
