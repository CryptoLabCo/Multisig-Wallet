
// Create reference to the OpenZepplin test helper file
const {expectRevert} = require('@openzeppelin/test-helpers')

// Create reference to the Smart Contract we are testing
const Wallet = artifacts.require('Wallet')

// Test contract for Wallet Smart Contract
// accounts: array of accounts
contract('Wallet', (accounts) => {

  // Variable to point to the Wallet Smart Contract
  let wallet

  beforeEach(async () => {

    // Assign value to this wallet variable
    wallet = await Wallet.new([accounts[0], accounts[1], accounts[2]], 2)

    // Send ether to the contract
    // await: must use this since it's an async operation
    // value: send in wai units
    await web3.eth.sendTransaction({from: accounts[0], to: wallet.address, value: 1000})
  })

  describe('Smart Contract deployment:', () => {

    // If you want to run just this test then say: it.only(....
    it('Should have the correct approvers', async () => {

      // Get pointers to items on Wallet Smart Contract
      const approvers = await wallet.getApprovers();
      
      // Create Unit Tests
      assert(approvers.length === 3);
      assert(approvers[0] === accounts[0]);
      assert(approvers[1] === accounts[1]);
      assert(approvers[2] === accounts[2]);
    })

    it('Should have the correct quorum', async () => {

      // Get pointers to items on Wallet Smart Contract
      const quorum = await wallet.quorum();

      // Create Unit Tests
      // When comparing numbers you must use the JS compare. If the number is too large
      // the toNumber function will not work so you can use the toString for larger numbers.
      assert(quorum.toNumber() === 2); // or  assert(quorum.toString() === '2'); 
    })

    it('createTransfer: Should create transfer', async () => {

      // Call the createTransfer function: Will create a Transfer Struct
      // @param 1: Since we loaded 1000 wei into contract above we can now pass in 100 wei
      // @param 2: who will we be transfering this amount to if the transfer gets quorum
      // @param 3: {from: accounts[0]} defines who is call this function
      // Since this function does not return a value and is a transaction we donlt need the cosnt in front
      await wallet.createTransfer(100, accounts[5], {from: accounts[0]} )

      // Now that the Transfer Struct is created test the values inside the struct
      const transfers = await wallet.getTransfers();
      assert(transfers.length === 1);
      assert(transfers[0].id === '0');
      assert(transfers[0].amount === '100');
      assert(transfers[0].to === accounts[5]);
      assert(transfers[0].approvals === '0');
      assert(transfers[0].sent === false);
    })

    it('createTransfer: Should NOT create transfers if sender is not approved', async () => {

      // Ugly way
      /*try {
        // Call the createTransfer function: Will create a Transfer Struct
        // @param 1: Since we loaded 1000 wei into contract above we can now pass in 100 wei
        // @param 2: who will we be transfering this amount to if the transfer gets quorum
        // @param 3: {from: accounts[4]} defines who is call this function: set it to an account that is not approved to createTransfer 
        // Since this function does not return a value and is a transaction we donlt need the cosnt in front
        await wallet.createTransfer(100, accounts[5], {from: accounts[4]} )
      } catch(e) {

        console.log(e);
      }*/


      // Use the OpenZepplin Test Helper file. See reference at top of page
      // @param 1: call the function
      // @param 2: check to see if we get the correct error msg
      await expectRevert(

        // Call the createTransfer function: Will create a Transfer Struct
        // @param 1: Since we loaded 1000 wei into contract above we can now pass in 100 wei
        // @param 2: who will we be transfering this amount to if the transfer gets quorum
        // @param 3: {from: accounts[4]} defines who is call this function: set it to an account that is not approved to createTransfer 
        // Since this function does not return a value and is a transaction we donlt need the cosnt in front
        wallet.createTransfer(100, accounts[5], {from: accounts[4]} ),

        // The modifier error msg from Wallet Smart Contract
        // Checks if the error msg is the same 
        'only approver allowed'
      )
    })

    // Check if the Transfer Struct approvals property is increased by 1 when an approver runs this function
    it('approveTranafer: Should increment approvals', async () => {

      // Call the createTransfer function
      await wallet.createTransfer(100, accounts[5], {from: accounts[0]} );

      // Call the approveTransfer function
      await wallet.approveTransfer(0, {from: accounts[0]} );

      // Get a reference to the Transfers Struct
      const transfers = await wallet.getTransfers();

      // Get the current Wallet Smart Contract balance
      const balance = await web3.eth.getBalance(wallet.address);

      // Test to see if approvals was increased by 1, but the transfer was not sent
      assert(transfers[0].approvals === '1');
      assert(transfers[0].sent === false);
      assert(balance === '1000');
    })

    // Test to see that when we receive quorum that the transfer is sent to the recipient
    it('approveTranafer: Should send transfer if quorum reached', async () => {

      // Get account balance of address before transfer
      const balanceBefore = web3.utils.toBN(await web3.eth.getBalance(accounts[6]));

      // Call the createTransfer function
      await wallet.createTransfer(100, accounts[6], {from: accounts[0]} );

      // Call the approveTransfer function twice to get quorum
      await wallet.approveTransfer(0, {from: accounts[0]} ); 
      await wallet.approveTransfer(0, {from: accounts[1]} ); 

      // Get account balance of address after transfer
      const balanceAfter = web3.utils.toBN(await web3.eth.getBalance(accounts[6]));

      // Since used web3.utils to convert numbers now we can use built-in function to subtract
      // and validate the 100 wei was sent to the receiver address
      assert (balanceAfter.sub(balanceBefore).toNumber() === 100);
    })

    it('approveTransfer: Should NOT approve transfers if sender is not approved', async () => {

      // Call the createTransfer function
      await wallet.createTransfer(100, accounts[5], {from: accounts[0]} );

      await expectRevert(

        // Call the createTransfer function: Will create a Transfer Struct
        // @param 1: Since we loaded 1000 wei into contract above we can now pass in 100 wei
        // @param 2: who will we be transfering this amount to if the transfer gets quorum
        // @param 3: {from: accounts[4]} defines who is call this function: set it to an account that is not approved to createTransfer 
        // Since this function does not return a value and is a transaction we donlt need the cosnt in front
        wallet.approveTransfer(0, {from: accounts[4]} ),

        // The modifier error msg from Wallet Smart Contract
        // Checks if the error msg is the same 
        'only approver allowed'
      )
    })


    it('approveTransfer: Should NOT approve transfers if transfer already sent', async () => {

      // Call the createTransfer function
      await wallet.createTransfer(100, accounts[6], {from: accounts[0]} );

      // Call the approveTransfer function twice to get quorum
      await wallet.approveTransfer(0, {from: accounts[0]} ); 
      await wallet.approveTransfer(0, {from: accounts[1]} ); 

      await expectRevert(

        // Try to approve the transfer again by a new approver account
        wallet.approveTransfer(0, {from: accounts[2]} ),

        // The modifier error msg from Wallet Smart Contract
        // Checks if the error msg is the same 
        'transfer has already been sent'
      )
    })

    it('approveTransfer: Should NOT approve transfers twice by approver account', async () => {

      // Call the createTransfer function
      await wallet.createTransfer(100, accounts[6], {from: accounts[0]} );

      // Call the approveTransfer function twice to get quorum
      await wallet.approveTransfer(0, {from: accounts[0]} ); 
      
      await expectRevert(

        // Try to approve the transfer again by a new approver account
        wallet.approveTransfer(0, {from: accounts[0]} ),

        // The modifier error msg from Wallet Smart Contract
        // Checks if the error msg is the same 
        'cannot approve transfer twice'
      )
    })

  })

});

