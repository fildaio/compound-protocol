pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

import "../../ChainlinkAggregatorV3Interface.sol";
import "../../Ownable.sol";
import "../../compound/SafeMath.sol";
import "./IStdReference.sol";

contract BandAssetOracle is ChainlinkAggregatorV3Interface, Ownable {
    using SafeMath for uint;

    uint8 private decimals_;
    string private description_;
    IStdReference public baseOracle;

    address public asset;
    string public assetSymbol;

    constructor(
        uint8 _decimals,
        string memory _description,
        IStdReference _baseOracle,
        address _asset,
        string memory _assetSymbol
        ) public {
        require(_asset != address(0), "BandAssetOracle: asset address is zero");
        decimals_ = _decimals;
        description_ = _description;
        baseOracle = _baseOracle;
        asset = _asset;
        assetSymbol = _assetSymbol;
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
        IStdReference.ReferenceData memory priceInfo = baseOracle.getReferenceData(assetSymbol, "USD");
        uint price = priceInfo.rate;
        startedAt = 0;
        updatedAt = priceInfo.lastUpdatedBase;

        if (decimals_ < 18) {
            answer = int(price.div(10 ** (18 - uint(decimals_))));
        } else if (decimals_ > 18) {
            answer = int(price.mul(10 ** (uint(decimals_) - 18)));
        } else {
            answer = int(price);
        }

        answeredInRound = 0;
    }

    function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound) {
        return getRoundData(0);
    }

    function setBaseOracle(IStdReference _baseOracle) external onlyOwner {
        baseOracle = _baseOracle;
    }
}
