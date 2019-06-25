// Load the MySQL connection
const pool = require('../data/config');

// Route the app
const router = app => {

    const Web3 = require('web3');
    const fs = require('fs');
    const solc = require('solc');
    const Tx = require('ethereumjs-tx');
    const nodemailer = require('nodemailer');
    const dateFormat = require('dateformat');
    const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));


    const accountAddress = '0x13AB9be743BBBd271Ed766Fe20fc5c4Ed8a64F4C';
    const privateKey = Buffer.from('8F82CAADF1B631C1AFE402805F88D4DD001B5D35ECD2CC3F49F383128433E486', 'hex');

    const contractABI = [{"constant":true,"inputs":[],"name":"getCandidates","outputs":[{"components":[{"name":"cadidateId","type":"uint256"},{"name":"name","type":"string"},{"name":"voteCount","type":"uint256"},{"name":"postId","type":"uint256"}],"name":"","type":"tuple[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"posts","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"total_posts","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"election_date","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"candidatesCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"postsCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"candidates","outputs":[{"name":"cadidateId","type":"uint256"},{"name":"name","type":"string"},{"name":"voteCount","type":"uint256"},{"name":"postId","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getPosts","outputs":[{"name":"","type":"string[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"postId","type":"uint256"},{"name":"candidateId","type":"uint256"},{"name":"voterId","type":"uint256"}],"name":"castVote","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[],"name":"election_id","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"votersCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"election_duration","outputs":[{"name":"","type":"int256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getVoters","outputs":[{"components":[{"name":"name","type":"string"},{"name":"email","type":"string"},{"name":"public_key","type":"string"},{"name":"vote","type":"uint256[3]"},{"name":"hasVoted","type":"bool"}],"name":"","type":"tuple[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"voters","outputs":[{"name":"name","type":"string"},{"name":"email","type":"string"},{"name":"public_key","type":"string"},{"name":"hasVoted","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"total_voters","outputs":[{"name":"","type":"int256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"election_time","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"election_name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"}];

    var transporter = nodemailer.createTransport({

        service: 'gmail',
        
        auth: {
            user: 'onevote.voting@gmail.com',
            pass: 'onevote1996'
        }
    
    });


    //Display welcome message on the root
    app.get('/', (request, response) => {
        response.send({
            message: 'Welcome to the OneVote Restful APIs'
        });
    });


    //Voter login election
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
                    
                    if( res[i][2].toString() == public_address && res[i][4] == false) {
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
                        'msg' : 'Voter not in voter list or already casted the vote.'
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


    //Get election details
    app.get('/get_election_details/:transaction_hash', (request, response) => {

        const transaction_hash = request.params.transaction_hash;

        web3.eth.getTransactionReceipt(transaction_hash, (err, receipt) => {

            const contractAddress = receipt.contractAddress;
            const contract = new web3.eth.Contract(contractABI, contractAddress);

            let election_name, election_date, election_time, election_duration;
            
            contract.methods.election_name.call({from : accountAddress}).then((res)=> {

                election_name = res;

                contract.methods.election_date.call({from : accountAddress}).then((res)=> {
                    
                    election_date = dateFormat(res, 'dS mmmm, yyyy');

                    contract.methods.election_time.call({from : accountAddress}).then((res)=> {
                    
                        election_time = timeConvert(res);

                        contract.methods.election_duration.call({from : accountAddress}).then((res)=> {
                    
                            election_duration = bigToNum(res);

                            response.send({

                                'election_details' : {
                                    'election_name' : election_name,
                                    'election_date' : election_date,
                                    'election_time' : election_time,
                                    'election_duration' : election_duration
                                }
                            
                            });

                        }).catch( (err) =>{
                            console.log(err);
                        });
    
                    }).catch( (err) =>{
                        console.log(err);
                    });

                }).catch( (err) =>{
                    console.log(err);
                });

            }).catch( (err) =>{
                console.log(err);
            });
        
        });

    });


    // Deploy election contract
    app.get('/deploy_contract/:election_id', (request, response) => {

        const election_id = request.params.election_id;

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

                web3.eth.getTransactionReceipt(txHash, (err, receipt) => {

                    var query = "SELECT e.*, v.voter_email FROM election e INNER JOIN voter v ON e.election_id = v.election_id WHERE e.election_id = ?"; 

                    pool.query(query, election_id, (error, result) => {

                        if(error){
                            
                            console.log(error);
                            
                        } else{

                            let emails = "";
                            let title = result[0]['election_title'];
                            let date = dateFormat(result[0]['election_date'], 'dS mmmm, yyyy');
                            let time = timeConvert(result[0]['election_time']);

                            for(var i=0 ; i<result.length; i++){

                                if(i != result.length-1){
                                    
                                    emails += result[i]['voter_email'] + ",";
                                
                                } else {
                                    
                                    emails += result[i]['voter_email'];
                                
                                }
                                
                            }

                            const mailOptions = {
                                
                                from: 'onevote.voting@gmail.com',
                                to: emails,
                                subject: 'OneVote Election Details - ' + title,
                                html: 
                                
                                '<p>Dear Voter,</p>' +
                                '<p>You have been registered for voting in <b>'+ title +'</b> on <b>' + date + '</b> at <b>' + time + '</b>.</p>' +
                                '<p>Transaction Hash is <b>' + receipt.transactionHash + '</b></p>' +
                                '<p>You can cast your vote through OneVote Webpage which is completely secured thorugh Blockchain: http://www.localhost/onevotehome</p>' +
                                '<footer>' +
                                    '<div>' +
                                        '<a target="_blank" href="http://www.localhost:81/onevotehome">' +
                                            '<img src="http://neditec.org.pk/images/onevote_email_footer.jpg" style="width:100%;" border="0" alt="Null">' +
                                        '</a>' +
                                    '</div>' +
                                '</footer>'
                            
                            };

                            transporter.sendMail(mailOptions, function (err, info) {
                        
                                if (err) {
                                    console.log("Hello it's error time.");
                                } else {
                                    console.log('Email sent: ' + info.response);
                                }
                             });

                             response.send({
                                'transaction_hash' : receipt.transactionHash,
                                'contract_address' : receipt.contractAddress,
                                'block_number' : receipt.blockNumber,
                                'gas_used' : receipt.gasUsed
                            });

                        }
            
                    });
                
                }).catch( (err) =>{
                    console.log(err);
                });

            }).catch( (err) =>{
                console.log(err);
            });
        
        }).catch( (err) =>{
            console.log(err);
        });
    
    });
    

    //Get all candidates of a election
    app.get('/get_all_candidates/:transaction_hash', (request, response) => {

        const transaction_hash = request.params.transaction_hash;

        web3.eth.getTransactionReceipt(transaction_hash, (err, receipt) => {

            const contractAddress = receipt.contractAddress;
            const contract = new web3.eth.Contract(contractABI, contractAddress);
            
            contract.methods.getCandidates().call({from : accountAddress}).then((res)=> {

                let candidates = [];

                for(let i=0; i<res.length; i++){
                    
                    candidates.push( {
                        'id' : bigToNum(res[i][0]),
                        'name' : res[i][1],
                        'post_id' : bigToNum(res[i][3]),
                        'vote_count' : bigToNum(res[i][2])
                    });
                
                }

                response.send({
                    'candidates' : candidates
                });

            }).catch( (err) =>{
                console.log(err);
            });
        
        });

    });


    //Get all voters of a election
    app.get('/get_all_voters/:transaction_hash', (request, response) => {

        const transaction_hash = request.params.transaction_hash;

        web3.eth.getTransactionReceipt(transaction_hash, (err, receipt) => {

            const contractAddress = receipt.contractAddress;
            const contract = new web3.eth.Contract(contractABI, contractAddress);
            
            contract.methods.getVoters().call({from : accountAddress}).then((res)=> {

                let voters = [];

                for(let i=0; i<res.length; i++){

                    let votes = [];

                    for(let j=0; j<res[i][3].length; j++){
                        votes.push(bigToNum(res[i][3][j]))
                    }
                    
                    voters.push( {
                        'name' : res[i][0],
                        'email' : res[i][1],
                        'public_key' : res[i][2],
                        'has_voted' : res[i][4],
                        'votes' : votes
                    });
                
                }

                response.send({
                    'voters' : voters
                });

            }).catch( (err) =>{
                console.log(err);
            });
        
        });

    });


    //Get all posts of a election
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


    //Get candidates of a post
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


    //Casting vote
    app.get('/cast_vote/:candidate_id/:post_id/:voter_id/:transaction_hash/:public_address', (request, response) => {

        const transaction_hash = request.params.transaction_hash;
        const post_id = request.params.post_id;
        const voter_id = request.params.voter_id;
        const candidate_id = request.params.candidate_id;
        const public_address = request.params.public_address;

        web3.eth.getTransactionReceipt(transaction_hash, (err, receipt) => {

            const contractAddress = receipt.contractAddress;
            const contract = new web3.eth.Contract(contractABI, contractAddress);

            contract.methods.castVote(post_id,candidate_id,voter_id).send({from: public_address}, (error, transactionHash) => {

                web3.eth.getTransactionReceipt(transactionHash, (err, receipt) => {
                    
                response.send({
            
                    'vote_transaction_hash' : receipt.transactionHash,
                    'contract_address' : receipt.to,
                    'receipt' : receipt
                });

                }).catch( (err) =>{
                    console.log(err);
                });
            
            }).catch( (err) =>{
                console.log(err);
            });
    
        }).catch( (err) =>{
            console.log(err);
        });

    });


    //Get candidate by name
    app.get('/get_candidate_by_name/:transaction_hash/:candidate_name', (request, response) => {

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


    //Get election stats
    app.get('/get_election_stats/:transaction_hash', (request, response) => {

        const transaction_hash = request.params.transaction_hash;

        web3.eth.getTransactionReceipt(transaction_hash, (err, receipt) => {

            const contractAddress = receipt.contractAddress;
            const contract = new web3.eth.Contract(contractABI, contractAddress);

            let results = [];
            
            contract.methods.getPosts().call({from : accountAddress}).then((res)=> {

                let posts = res;

                contract.methods.getCandidates().call({from : accountAddress}).then((res)=> {

                    for(let i=0; i<posts.length; i++){

                        let candidates = [];
                        let vote_count = 0;

                        for(let j=0; j<res.length; j++){
                            
                            if(bigToNum(res[j][3]) == i){

                                candidates.push({
                                    "candidate_id" : bigToNum(res[j][0]),
                                    "candidate_name" : res[j][1],
                                    "vote_count" : bigToNum(res[j][2]),
                                    "vote_percentage" : 0
                                });

                                vote_count += bigToNum(res[j][2]);
                            }
                        
                        }

                        for(let j=0; j<candidates.length; j++){
                            const p = (candidates[j]['vote_count'] / vote_count) * 100;
                            candidates[j]['vote_percentage'] = parseFloat(Math.round(p * 100) / 100).toFixed(2);
                        }

                        results.push( {
                            'post_id' : i,
                            'post_name' : posts[i],
                            'vote_count' : vote_count,
                            'candidates' : candidates
                        });
                    
                    }

                    response.send({
                        'results' : results
                    });

                }).catch( (err) =>{
                    console.log(err);
                });
                
            }).catch( (err) =>{
                console.log(err);
            });
        
        });

    });


    //Get vote details
    app.get('/get_vote_details/:transaction_hash', (request, response) => {

        const transaction_hash = request.params.transaction_hash;

        web3.eth.getTransactionReceipt(transaction_hash, (err, receipt) => {

            const contract = new web3.eth.Contract(contractABI, receipt.to);
            const public_address = receipt.from;
            let candidateIds = [];
            let candidates = [];
            let votes = [];

            contract.methods.getVoters().call({from : public_address}).then((res)=> {

                for(let i=0; i<res.length; i++){

                    if(res[i][2].toLowerCase() == public_address.toLowerCase()){
                        for(let j=0; j<res[i][3].length; j++){
                            candidateIds.push(bigToNum(res[i][3][j]))
                        }
                        break;
                    }
                
                }

                contract.methods.getCandidates().call({from : public_address}).then((res)=> {

                    for(let i=0; i<res.length; i++){

                        for(let j=0; j<candidateIds.length; j++){
                            if(bigToNum(res[i][0]) == candidateIds[j]){
                                candidates.push(res[i][1]);
                            }
                        }

                    }
                    
                    contract.methods.getPosts().call({from : public_address}).then((res)=> {

                        for(let i=0; i<res.length; i++){
                            votes.push({
                                'post' : res[i],
                                'candidate' : candidates[i]
                            })
                        }

                        response.send({
                            'votes' : votes
                        });
    
                    }).catch((err) =>{
                        console.log(err);
                    });

                }).catch((err) =>{
                    console.log(err);
                });

            }).catch((err) =>{
                console.log(err);
            });
        
        }).catch( (err) =>{
            console.log(err);
        });
    
    });


    //Send transaction mail
    app.post('/send_transaction_mail', (request, response) => {

        const email = request.body.email;
        const election_name = request.body.election_name;
        const transaction_hash = request.body.transaction_hash;
        
        let hashes = "";

        for(let i=0; i<transaction_hash.length; i++){
            hashes += '<br/>' + (i+1) + '- <b>' + transaction_hash[i]  + '</b>';
        }

        const mailOptions = {
                                
            from: 'onevote.voting@gmail.com',
            to: email,
            subject: 'OneVote Election Vote Casted - ' + election_name,
            html: 

            '<p>Dear Voter,</p>' +
            '<p>Congratulations your vote(s) has been casted successfully.</p>' +
            '<p>Transaction Hash(s) are:' + hashes + '</p>' +

            '<p>You can track your vote and see the results through OneVote Web App which is completely secured thorugh Blockchain: http://www.localhost/onevotehome/results</p>' +
            '<footer>' +
                '<div>' +
                    '<a target="_blank" href="http://www.localhost:81/onevotehome">' +
                        '<img src="http://neditec.org.pk/images/onevote_email_footer.jpg" style="width:100%;" border="0" alt="Null">' +
                    '</a>' +
                '</div>' +
            '</footer>'
        
        };

        transporter.sendMail(mailOptions, function (err, info) {
    
            if (err) {
                response.send({
                    'status' : false
                });
            } else {
                response.send({
                    'status' : true
                });
            }
        
        });

    });




    function bigToNum(bigNum){

        return web3.utils.hexToNumber(web3.utils.toHex(bigNum));

    }

    function timeConvert(time) {
        // Check correct time format and split into components
        time = time.toString ().match (/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];
      
        if (time.length > 1) { // If time format correct
          time = time.slice (1);  // Remove full string match value
          time[5] = +time[0] < 12 ? ' AM' : ' PM'; // Set AM/PM
          time[0] = +time[0] % 12 || 12; // Adjust hours
        }
        
        return time.join (''); // return adjusted time or original string
    }

}

// Export the router
module.exports = router;