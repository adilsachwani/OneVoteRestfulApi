// Load the MySQL pool connection
const pool = require('../data/config');

// Route the app
const router = app => {

    const Web3 = require('web3');
    const fs = require('fs');
    const solc = require('solc');
    const Tx = require('ethereumjs-tx');
    const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));

    const accountAddress = '0x13AB9be743BBBd271Ed766Fe20fc5c4Ed8a64F4C';
    const privateKey = Buffer.from('8F82CAADF1B631C1AFE402805F88D4DD001B5D35ECD2CC3F49F383128433E486', 'hex');

    const contractABI = [{"constant":true,"inputs":[],"name":"getCandidates","outputs":[{"components":[{"name":"cadidateId","type":"uint256"},{"name":"name","type":"string"},{"name":"voteCount","type":"uint256"},{"name":"postId","type":"uint256"}],"name":"","type":"tuple[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"posts","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"total_posts","outputs":[{"name":"","type":"int256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"election_date","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"candidatesCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"postsCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"candidates","outputs":[{"name":"cadidateId","type":"uint256"},{"name":"name","type":"string"},{"name":"voteCount","type":"uint256"},{"name":"postId","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getPosts","outputs":[{"name":"","type":"string[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"postId","type":"uint256"},{"name":"candidateId","type":"uint256"},{"name":"voterId","type":"uint256"}],"name":"castVote","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[],"name":"election_id","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"votersCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"election_duration","outputs":[{"name":"","type":"int256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getVoters","outputs":[{"components":[{"name":"name","type":"string"},{"name":"email","type":"string"},{"name":"public_key","type":"string"},{"name":"vote","type":"uint256[3]"}],"name":"","type":"tuple[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"voters","outputs":[{"name":"name","type":"string"},{"name":"email","type":"string"},{"name":"public_key","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"total_voters","outputs":[{"name":"","type":"int256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"election_time","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"election_name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"}];

    // Display welcome message on the root
    app.get('/', (request, response) => {
        response.send({
            message: 'Welcome to the OneVote Restful APIs'
        });
    });

    //voter login election
    app.get('/voter_login/:transaction_hash/:public_address', (request, response) => {

        const transaction_hash = request.params.transaction_hash;
        const public_address = request.params.public_address;

        web3.eth.getTransactionReceipt(transaction_hash, (err, receipt) => {

            const contractAddress = receipt.contractAddress;
            const contract = new web3.eth.Contract(contractABI, contractAddress);
            
            contract.methods.getVoters().call({from : public_address}).then((res)=> {

                let check = false;
                let voter_name;
                let voter_id;

                for(let i=0; i<res.length; i++){
                    
                    if( res[i][2] == public_address) {
                        check = true;
                    }

                    if(check){
                        voter_name = res[i][0];
                        voter_id = i;
                        break;
                    }
                
                }

                if(check){
                    response.send({
                        'status' : true,
                        'msg' : 'Login Successful',
                        'voter_name' : voter_name,
                        'voter_id' : voter_id
                    });
                } else {
                    response.send({
                        'status' : false,
                        'msg' : 'Voter not in voter list'
                    });
                }

            }).catch( (err) =>{
                response.send({
                    'status' : false,
                    'msg' : 'Invalid Voter Address'
                });
            });
        
        }).catch( (err) =>{
            response.send({
                'status' : false,
                'msg' : 'Invalid Transaction Hash'
            });
        });

    });


    //get election details
    app.get('/get_election_details/:transaction_hash', (request, response) => {

        const transaction_hash = request.params.transaction_hash;

        web3.eth.getTransactionReceipt(transaction_hash, (err, receipt) => {

            const contractAddress = receipt.contractAddress;
            const contract = new web3.eth.Contract(contractABI, contractAddress);
            
            contract.methods.election_name.call({from : accountAddress}).then((res)=> {

                response.send({
                    'election_name' : res
                });

            }).catch( (err) =>{
                console.log(err);
            });
        
        });

    });

    // Deploy election contract
    app.get('/deploy_contract', (request, response) => {

        const input = fs.readFileSync('E:/Softwares/Xampp/htdocs/onevote/Election.sol');
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

                    response.send({
             
                        'transaction_hash' : txHash
                    });

            }).catch( (err) =>{
                console.log(err);
            });
        
        }).catch( (err) =>{
            console.log(err);
        });
    
    });

    //get all candidates of a election
    app.get('/get_all_candidates/:transaction_hash', (request, response) => {

        const transaction_hash = request.params.transaction_hash;

        web3.eth.getTransactionReceipt(transaction_hash, (err, receipt) => {

            const contractAddress = receipt.contractAddress;
            const contract = new web3.eth.Contract(contractABI, contractAddress);
            
            contract.methods.getCandidates().call({from : accountAddress}).then((res)=> {

                response.send({
                    'candidates' : res
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
                    voters.push(res[i]);
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

    //get candidates of a election
    app.get('/get_post_candidates/:transaction_hash/:post_id', (request, response) => {

        const transaction_hash = request.params.transaction_hash;
        const post_id = request.params.post_id;

        web3.eth.getTransactionReceipt(transaction_hash, (err, receipt) => {

            const contractAddress = receipt.contractAddress;
            const contract = new web3.eth.Contract(contractABI, contractAddress);
            
            contract.methods.getCandidates().call({from : accountAddress}).then((res)=> {

                let candidates = [];

                for(let i=0; i<res.length; i++){
                    
                    if(bigToNum((res[i][3]) == post_id)){
                        candidates.push(res[i][1]);
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

    //  // casting vote
    //  app.get('/cast_vote/:candidate_id/:post_id/:voter_id/:transaction_hash/:public_address/:private_address', (request, response) => {

    //     const transaction_hash = request.params.transaction_hash;
    //     const post_id = request.params.post_id;
    //     const voter_id = request.params.voter_id;
    //     const candidate_id = request.params.candidate_id;
    //     const public_address = request.params.public_address;
    //     const private_address = request.params.private_address;

    //     const privateKey = Buffer.from(private_address, 'hex');

    //     web3.eth.getTransactionReceipt(transaction_hash, (err, receipt) => {

    //         const contractAddress = receipt.contractAddress;
    //         const contract = new web3.eth.Contract(contractABI, contractAddress);
           
    //     web3.eth.getTransactionCount(accountAddress, (err, txCount) => {

    //           //build the transaction
    //             const txObject = {
    //             nonce : web3.utils.toHex(txCount),
    //             gasLimit : web3.utils.toHex(1000000000),
    //             gasPrice : web3.utils.toHex(web3.utils.toWei('10', 'gwei')),
    //             data : contract.methods.castVote(post_id,candidate_id,voter_id).encodeABI()
    //         }

    //             //Sign the transaction
    //             const tx = new Tx(txObject);
    //             tx.sign(privateKey);
    
    //             const serializedTransaction = tx.serialize();
    //             const raw = '0x' + serializedTransaction.toString('hex');

    //                //Broadcast the address
    //             web3.eth.sendSignedTransaction(raw, (err, txHash) =>{

    //             response.send({
         
    //                 'vote_transaction_hash' : txHash
    //             });

    //          }).catch( (err) =>{
    //              console.log(err);
    //          });
    

    //      }).catch( (err) =>{
    //         console.log(err);
    //     });

    //     }).catch( (err) =>{
    //         console.log(err);
    //     });

    // });

         // casting vote
         app.get('/cast_vote/:candidate_id/:post_id/:voter_id/:transaction_hash/:public_address', (request, response) => {

            const transaction_hash = request.params.transaction_hash;
            const post_id = request.params.post_id;
            const voter_id = request.params.voter_id;
            const candidate_id = request.params.candidate_id;
            const public_address = request.params.public_address;
            // const private_address = request.params.private_address;
    
            // const privateKey = Buffer.from(private_address, 'hex');

            web3.eth.getTransactionReceipt(transaction_hash, (err, receipt) => {

                const contractAddress = receipt.contractAddress;
                const contract = new web3.eth.Contract(contractABI, contractAddress);

                contract.methods.castVote(post_id,candidate_id,voter_id).send({from: public_address}, (error, transactionHash) => {
                    
                    response.send({
         
                        'vote_transaction_hash' : transactionHash
                    });


                }).catch( (err) =>{
                    console.log(err);
                });

            

            }).catch( (err) =>{
                console.log(err);
            });

        });

     //get a single candidate
     app.get('/get_candidate/:transaction_hash/:candidate_name', (request, response) => {

        const transaction_hash = request.params.transaction_hash;
        const candidate_name = request.params.candidate_name;

        web3.eth.getTransactionReceipt(transaction_hash, (err, receipt) => {

            const contractAddress = receipt.contractAddress;
            const contract = new web3.eth.Contract(contractABI, contractAddress);
            
            contract.methods.getCandidates().call({from : accountAddress}).then((res)=> {

                let candidate_id;

                for(let i=0; i<res.length; i++){
                    
                    if((res[i][1]) == candidate_name){
                        candidate_id = bigToNum(res[i][0]);
                    }
                
                }

                response.send({
                    'candidate_id' : candidate_id
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