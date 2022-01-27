pragma solidity ^0.5.16;

import "./ChainlinkAggregatorV3Interface.sol";
import "./IUniswapV2Pair.sol";
import "./compound/SafeMath.sol";
import "./Ownable.sol";
import "./ICurveRegistry.sol";
import "./ICurvePool.sol";
import "./ChainlinkAdaptor.sol";

interface IERC20Decimal {
    function decimals() external view returns (uint8);
}

contract QsCurveV1Oracle is ChainlinkAggregatorV3Interface, Ownable {
    using SafeMath for uint;

    uint8 private decimals_;
    string private description_;

    ChainlinkAdaptor public adaptor;

    struct UnderlyingToken {
        uint8 decimals; // token decimals
        address token; // token address
        ChainlinkAggregatorV3Interface priceSource; // token price source
    }

    UnderlyingToken[] public ulTokens; // from LP token to underlying tokens
    address public curvelp;
    address public curvePool;

    struct RoundData {
        uint80 roundId;
        uint256 answer;
        uint256 startedAt;
        uint256 updatedAt;
        uint80 answeredInRound;
    }

    constructor(
        uint8 _decimals,
        string memory _description,
        ICurveRegistry _registry,
        address _lp,
        address[] memory _tokenPriceSources) public {
        decimals_ = _decimals;
        description_ = _description;

        curvelp = _lp;

        address pool = _registry.get_pool_from_lp_token(_lp);
        require(pool != address(0), 'no corresponding pool for lp token');
        curvePool = pool;
        (uint n, ) = _registry.get_n_coins(pool);
        require(n == _tokenPriceSources.length, "price source length is not equal to token length");
        address[8] memory tokens = _registry.get_coins(pool);
        for (uint i = 0; i < n; i++) {
            ulTokens.push(
                UnderlyingToken({token: tokens[i], decimals: IERC20Decimal(tokens[i]).decimals(),
                     priceSource: ChainlinkAggregatorV3Interface(_tokenPriceSources[i])})
            );
        }
    }

    function ulTokenLength() external view returns (uint256) {
        return ulTokens.length;
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
        _roundId;
        uint256 minAnswer = uint(-1);
        uint8 priceDecimals;

        uint n = ulTokens.length;
        for (uint idx = 0; idx < n; idx++) {
            UnderlyingToken memory ulToken = ulTokens[idx];

            RoundData memory data;
            int256 tempAnswer;
            (data.roundId, tempAnswer, data.startedAt, data.updatedAt, data.answeredInRound) = ulToken.priceSource.latestRoundData();
            if (tempAnswer > 0) {
                data.answer = uint256(tempAnswer);
            }

            if (data.answer < minAnswer) {
                minAnswer = data.answer;
                roundId = data.roundId;
                startedAt = data.startedAt;
                updatedAt = data.updatedAt;
                answeredInRound = data.answeredInRound;
                priceDecimals = ulToken.priceSource.decimals();
            }
        }
        require(minAnswer != uint(-1), 'no min px');
        // use min underlying token prices
        minAnswer = minAnswer.mul(ICurvePool(curvePool).get_virtual_price()).div(1e18);
        if (decimals_ < priceDecimals) minAnswer = minAnswer.div(10**(uint(priceDecimals - decimals_)));
        if (decimals_ > priceDecimals) minAnswer = minAnswer.mul(10**(uint(decimals_ - priceDecimals)));

        answer = int256(minAnswer);
    }

    function latestRoundData()
    external
    view
    returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return getRoundData(0);
    }
}
