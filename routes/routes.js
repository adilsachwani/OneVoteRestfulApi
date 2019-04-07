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

    const contractABI = [{"constant":true,"inputs":[],"name":"getCandidates","outputs":[{"components":[{"name":"name","type":"string"},{"name":"voteCount","type":"uint256"},{"name":"postId","type":"uint256"}],"name":"","type":"tuple[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"posts","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"total_posts","outputs":[{"name":"","type":"int256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"election_date","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"candidatesCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"postsCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"candidates","outputs":[{"name":"name","type":"string"},{"name":"voteCount","type":"uint256"},{"name":"postId","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getPosts","outputs":[{"name":"","type":"string[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"election_id","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"votersCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"election_duration","outputs":[{"name":"","type":"int256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getVoters","outputs":[{"components":[{"name":"name","type":"string"},{"name":"email","type":"string"},{"name":"public_key","type":"string"},{"name":"vote","type":"bool"}],"name":"","type":"tuple[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"voters","outputs":[{"name":"name","type":"string"},{"name":"email","type":"string"},{"name":"public_key","type":"string"},{"name":"vote","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"total_voters","outputs":[{"name":"","type":"int256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"election_time","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"election_name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"}];


    // Display welcome message on the root
    app.get('/', (request, response) => {
        response.send({
            message: 'Welcome to the OneVote Restful APIs'
        });
    });


    //get election details
    app.get('/get_election_details/:transaction_hash', (request, response) => {

        const transaction_hash = request.params.transaction_hash;

        web3.eth.getTransactionReceipt(transaction_hash, (err, receipt) => {

            const contractAddress = receipt.contractAddress;
            const contract = new web3.eth.Contract(contractABI, contractAddress);
            
            contract.methods.election_name().call({from : accountAddress}).then((res)=> {

                response.send({
                    'election_name' : res
                });

            }).catch( (err) =>{
                console.log(err);
            });
        
        });

    });

    // Deploy election contract
    app.get('/deploy_contract/:election_id', (request, response) => {

        const election_id = request.params.election_id;

        const input = fs.readFileSync('C:/xampp/htdocs/onevote/Election.sol');
        const output = solc.compile(input.toString(), 1);
        const bytecode = output.contracts[':Election'].bytecode;

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

                    pool.query('UPDATE election SET transaction_hash = ? WHERE election_id = ?', [receipt.transactionHash, election_id], (error, result) => {

                        if(error){
                            response.send(
                                {
                                    "status" : false,
                                    "message" : error
                                }
                            )
                        }
            
                        if (result.affectedRows > 0){

                            response.send({
                                transaction_hash : receipt.transactionHash,
                                contract_address : receipt.contractAddress,
                                block_number : receipt.blockNumber,
                                gas_used: receipt.gasUsed
                            });

                        }
                        else{
                            response.send(
                                {
                                    "status" : false,
                                    "message" : "record not updated"
                                }
                            )
                        }
            
                    });
                
                });

            });
        
        });
    
    });

    //get all candidates of a election
    app.get('/get_all_candidates/:transaction_hash', (request, response) => {

        const transaction_hash = request.params.transaction_hash;

        web3.eth.getTransactionReceipt(transaction_hash, (err, receipt) => {

            const contractAddress = receipt.contractAddress;
            const contract = new web3.eth.Contract(contractABI, contractAddress);
            
            contract.methods.getCandidates().call({from : accountAddress}).then((res)=> {

                let candidates = [];

                for(let i=0; i<res.length; i++){
                    candidates.push(res[i][0]);
                }

                response.send({
                    'candidates' : candidates
                });

            }).catch( (err) =>{
                console.log(err);
            });
        
        });

    });


    //get all voters of a election
    app.get('/get_all_voters/:transaction_hash', (request, response) => {

        const transaction_hash = request.params.transaction_hash;

        web3.eth.getTransactionReceipt(transaction_hash, (err, receipt) => {

            const contractAddress = receipt.contractAddress;
            const contract = new web3.eth.Contract(contractABI, contractAddress);
            
            contract.methods.getVoters().call({from : accountAddress}).then((res)=> {

                let voters = [];

                for(let i=0; i<res.length; i++){
                    voters.push(res[i][0]);
                }

                response.send({
                    'voters' : voters
                });

            }).catch( (err) =>{
                console.log(err);
            });
        
        });

    });


    //get all posts of a election
    app.get('/get_all_posts/:transaction_hash', (request, response) => {

        const transaction_hash = request.params.transaction_hash;

        web3.eth.getTransactionReceipt(transaction_hash, (err, receipt) => {

            const contractAddress = receipt.contractAddress;
            var contract = new web3.eth.Contract(contractABI, contractAddress);
            
            contract.methods.getPosts().call({from : accountAddress}).then((res)=>{
            
                response.send({
                    'posts' : res
                });
            
            }).catch((err)=>{
                console.log(err);
            });

        });

    });

    //get all candidates of a election
    app.get('/get_post_candidates/:transaction_hash/:post_id', (request, response) => {

        const transaction_hash = request.params.transaction_hash;
        const post_id = request.params.post_id;

        web3.eth.getTransactionReceipt(transaction_hash, (err, receipt) => {

            const contractAddress = receipt.contractAddress;
            const contract = new web3.eth.Contract(contractABI, contractAddress);
            
            contract.methods.getCandidates().call({from : accountAddress}).then((res)=> {

                let candidates = [];

                for(let i=0; i<res.length; i++){
                    
                    if(bigToNum((res[i][2]) == post_id)){
                        candidates.push(res[i][0]);
                    }
                
                }

                response.send({
                    'candidates' : candidates
                });

            }).catch( (err) =>{
                console.log(err);
            });
        
        });

    });

    function bigToNum(bigNum){

        return web3.utils.hexToNumber(web3.utils.toHex(bigNum));

    }

}

// Export the router
module.exports = router;