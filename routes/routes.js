// Load the MySQL pool connection
const pool = require('../data/config');

// Route the app
const router = app => {
    
    // Display welcome message on the root
    app.get('/', (request, response) => {
        response.send({
            message: 'Welcome to the Node.js Express REST API!'
        });
    });

    // Display all users
    app.get('/deploy_contract', (request, response) => {

        const Web3 = require('web3');
        const fs = require('fs');
        const solc = require('solc');

        const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));

        const input = fs.readFileSync('C:/xampp/htdocs/onevote/Election.sol');
        const output = solc.compile(input.toString(), 1);
        console.log(output);
        const bytecode = output.contracts[':Election'].bytecode;
        const abi = JSON.parse(output.contracts[':Election'].interface);

        // Contract object
        const contract = web3.eth.contract(abi);

        // Deploy contract instance
        const contractInstance = contract.new({

            data: '0x' + bytecode,
            from: web3.eth.coinbase,
            gas: 90000000*2

        }, (err, res) => {

            if (err) {
                console.log(err);
                return;
            }

            // If we have an address property, the contract was deployed
            if (res.address) {
                
                response.send({
                    message: 'Contract Deployed',
                    contract_address: res.address,
                    contract_transaction_hash: res.transactionHash
                });
            
            }

        });

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
