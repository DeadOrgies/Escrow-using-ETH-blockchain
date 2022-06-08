// SPDX-License-Identifier: MIT
pragma solidity 0.6.0;

// Defining a Contract
contract escrow {

    function transferEth(address payable addr) public payable {
        addr.transfer(msg.value);
    }

}
