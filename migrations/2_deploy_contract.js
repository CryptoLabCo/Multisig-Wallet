const Wallet = artifacts.require("Wallet");

// Copy code from 1_initial_migration.js
// _network: the network we will deploy to. For testing it's Ganache
// accounts: Array of addresses. For testing will use the first 3 address in Ganache
module.exports = async function (deployer, _network, accounts) {

  // Call the Constructor of Wallet Smart Contract and pass in parameters
  // @param 1: Array of address approvers
  // @param 2: Number of approvers required to meet quorum
  // Since this will take some time to deploy we set the await and async keywords
  await deployer.deploy(Wallet, [accounts[0], accounts[0], accounts[0]], 2);

  // Get pointer to Wallet Smart Contract
  const wallet = await Wallet.deployed();

  // Send 10000 wei to our Wallet Smart Contract
  await web3.eth.sendTransaction({from: accounts[0], to: wallet.address, value: 10000});
};
