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
    const PRIVATE_KEY_1 = Buffer.from('8F82CAADF1B631C1AFE402805F88D4DD001B5D35ECD2CC3F49F383128433E486', 'hex');
    

    var abi;
    var contractAddress = "0xEF407d38e555a615011ad9c3D69C1529E3Ae3F78";
    var contractTransaction;

    var election_name ;
    var election_date ;
    var election_time ;
    var election_duration ;
    
    // Display welcome message on the root
    app.get('/', (request, response) => {
        response.send({
            message: 'Welcome to the OneVote Restful APIs'
        });
    });

    // Display all users
    app.get('/deploy_contract', (request, response) => {

        const input = fs.readFileSync('E:/Softwares/Xampp/htdocs/onevote/Election.sol');
        const output = solc.compile(input.toString(), 1);
        console.log(output);
        const bytecode = output.contracts[':Election'].bytecode;
        abi = JSON.parse(output.contracts[':Election'].interface);

        web3.eth.getTransactionCount(accountAddress, (err, txCount) => {
            //build the transaction
            const txObject = {
                nonce : web3.utils.toHex(txCount),
                data : '0x' + bytecode,
                gasLimit : web3.utils.toHex(10000000000),
                gasPrice : web3.utils.toHex(web3.utils.toWei('10', 'gwei'))
            }
            console.log(txObject);

            //Sign the transaction
            const tx = new Tx(txObject);
            tx.sign(PRIVATE_KEY_1);

            const serializedTransaction = tx.serialize();
            const raw = '0x' + serializedTransaction.toString('hex');

            // console.log("Serialized Transaction : ", serializedTransaction);
            // console.log("Raw : ", raw);

            //Broadcast the address
            web3.eth.sendSignedTransaction(raw, (err, txHash) =>{
                console.log("TxHash : ", txHash);
                console.log("Error : ", err);
            });

        });





        // // Contract object
        // const contract = web3.eth.Contract(abi);

        // // Deploy contract instance
        // const contractInstance = contract.new({

        //     data: '0x' + bytecode,
        //     from: accountAddress,
        //     gas: 90000000*2

        // }, (err, res) => {

        //     if (err) {
        //         console.log(err);
        //         return;
        //     }

        //     // If we have an address property, the contract was deployed
        //     if (res.address) {

        //         contractAddress = res.address;
        //         contractTransaction = res.transactionHash;
                
        //         response.send({
        //             message: 'Contract Deployed',
        //             contract_address: res.address,
        //             contract_transaction_hash: res.transactionHash,
        //             ABI : abi
        //         });
            
        //     }

        // });

    });

    //display contract details
    app.get('/get_contract_details', (request, response) => {

        var contract = new web3.eth.Contract(abi, contractAddress);
        console.log(contract);
        contract.methods.getPosts().call({from : accountAddress}, (err, name)=>{
            if(err == null){
               // election_name = name;
                console.log("Election Name : ", name);
            }
        })
        

    });


    // Add a new user
    app.post('/users', (request, response) => {
        pool.query('INSERT INTO users SET ?', request.body, (error, result) => {
            if (error) throw error;

            response.status(201).send(`User added with ID: ${result.insertId}`);
        });
    });

    

}

// Export the router
module.exports = router;