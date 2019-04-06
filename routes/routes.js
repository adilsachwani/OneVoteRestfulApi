// Load the MySQL pool connection
const pool = require('../data/config');

// Route the app
const router = app => {

    const Web3 = require('web3');
    const fs = require('fs');
    const solc = require('solc');
    const Tx = require('ethereumjs-tx');
    const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));

    const accountAddress = '0x70a47E1Be460464bE8Dc17F2FDEEf2dC306f274d';
    const privateKey = Buffer.from('d051b5b1e1cda01278161f21ddd71425f00cbd8081c841231b9ad794399c18f0', 'hex');
    
    // Display welcome message on the root
    app.get('/', (request, response) => {
        response.send({
            message: 'Welcome to the OneVote Restful APIs'
        });
    });

    // Display all users
    app.get('/deploy_contract', (request, response) => {

        const input = fs.readFileSync('C:/xampp/htdocs/onevote/Election.sol');
        const output = solc.compile(input.toString(), 1);
        const bytecode = output.contracts[':Election'].bytecode;
        abi = JSON.parse(output.contracts[':Election'].interface);

        web3.eth.getTransactionCount(accountAddress, (err, txCount) => {
            
            //build the transaction
            const txObject = {
                nonce : web3.utils.toHex(txCount),
                data : '0x' + bytecode,
                gasLimit : web3.utils.toHex(1000000000),
                gasPrice : web3.utils.toHex(web3.utils.toWei('10', 'gwei'))
            }

            //Sign the transaction
            const tx = new Tx(txObject);
            tx.sign(privateKey);

            const serializedTransaction = tx.serialize();
            const raw = '0x' + serializedTransaction.toString('hex');

            //Broadcast the address
            web3.eth.sendSignedTransaction(raw, (err, txHash) =>{

                web3.eth.getTransactionReceipt(txHash, (err, receipt) => {
                    
                    response.send({
                        transaction_hash : receipt.transactionHash,
                        contract_address : receipt.contractAddress,
                        block_number : receipt.blockNumber,
                        gas_used: receipt.gasUsed
                    })
                
                });

            });
        
        });
    
    });

    //display contract details
    app.get('/get_election_details', (request, response) => {

        const contractAddress = '0x9a8b3Cf0c8125b74c63A56865e0AfA2698707eb4';
        const contractABI = [{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"posts","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"total_posts","outputs":[{"name":"","type":"int256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"election_date","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"candidatesCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"postsCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"candidates","outputs":[{"name":"name","type":"string"},{"name":"voteCount","type":"uint256"},{"name":"postId","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"election_id","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"votersCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"election_duration","outputs":[{"name":"","type":"int256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"election_secret_key","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"voters","outputs":[{"name":"name","type":"string"},{"name":"email","type":"string"},{"name":"public_key","type":"string"},{"name":"vote","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"total_voters","outputs":[{"name":"","type":"int256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"election_time","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"election_name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"}];

        var contract = new web3.eth.Contract(contractABI, contractAddress);

        contract.methods.candidates(2).call({from : accountAddress}, (err, candidate) => {
            console.log(candidate['name'])
        });     

    });    

}

// Export the router
module.exports = router;