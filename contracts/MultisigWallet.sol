pragma solidity ^0.5.16;

interface MultisigWallet {
    function submitTransaction(address destination, uint value, bytes calldata data) external returns (uint transactionId);
}