const Myescrow = artifacts.require("escrow");

module.exports = function (deployer) {
  deployer.deploy(Myescrow);
};
