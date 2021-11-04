pragma solidity ^0.5.16;

import "./compound/CErc20.sol";
import "./Ownable.sol";

contract FTokenStorage is Ownable {
    mapping(address => address) _ftokens;
    address public WETH;

    constructor(address wETH, address fETH) public {
        WETH = wETH;
        _ftokens[wETH] = fETH;
    }

    function addFTokens(address[] calldata assets, address[] calldata ftokens) external onlyOwner {
        _addFTokens(assets, ftokens);
    }

    function _addFTokens(address[] memory assets, address[] memory ftokens) private {
        require(assets.length == ftokens.length, "FTokenStorage: invalid parameter");

        for (uint i = 0; i < assets.length; i++) {
            if (ftokens[i] != address(0) && CErc20(ftokens[i]).underlying() != assets[i]) {
                continue;
            }
            _ftokens[assets[i]] = ftokens[i];
        }
    }

    function ftoken(address asset) external view returns (address) {
        return _ftokens[asset];
    }
}
