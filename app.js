const Web3 = require('web3');
const express = require('express');
const app = express()
const port = 3000;

//middelware init 
const bluebird = require('bluebird');

//redis init
const Redis = require('redis');
bluebird.promisifyAll(Redis);
const client = Redis.createClient();

const escrow = require('./build/contracts/escrow.json');
const HDWalletProvider = require('@truffle/hdwallet-provider');


const eaddress = '0xa06acBA102608d6b20d579cA4B6dd4801efD8A07'; //escrow address
const epkey = '0x92f27c8e9142a8a4c1507227a042d9332418bdb735a5c1bfb361b695eb5f567b';
const saddress = '0x8F27E89b3Dc32dCa74C276da5834f457D27dA5A6'; // seller address

let contract = null;
let web3 = null;

const deployContract = async (addr, _pkey) => {

    const provider = new HDWalletProvider(
        _pkey,
        'https://ropsten.infura.io/v3/7a9d9167ef4f4852870ce551762c639e'
    );
    web3 = new Web3(provider);
    //const id = await web3.eth.net.getId();
    //const deployedNetwork = escrow.networks[id];

    contract = new web3.eth.Contract(
        escrow.abi,
        //deployedNetwork.address
    );

    contract = await contract.deploy({ data: escrow.bytecode }).send({ from: addr });
}

// contract instance
const BuyerDeposit = async () => {



    await contract.methods.transferEth(eaddress).send({

        from: await client.getAsync('saddress'),
        value: web3.utils.toWei(await client.getAsync('amt'), "ether")

    });


}

const SellerWithdraw = async () => {


    await contract.methods.transferEth(saddress).send({
        from: eaddress,
        value: web3.utils.toWei(await client.getAsync('amt'), "ether")
    });


}



app.use(express.static('./'))
app.use('scripts', express(__dirname + './scripts'));

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }))

app.get('/', (req, res) => {


    res.render('pay');

})

barcode = '0';

const setinputs = async (req) => {
    client.setex('saddress', 3600, req.body.addr);
    client.setex('amt', 3600, req.body.amt);
    client.setex('pkey', 3600, req.body.pkey);
}

app.post('/pay', async (req, res) => {

    await setinputs(req);
    await deployContract(await client.getAsync('saddress'), await client.getAsync('pkey'));
    await BuyerDeposit();
    barcode = Math.floor(100000 + Math.random() * 900000);
    console.log(barcode);
    res.render('post');


})

app.post('/posttx', async (req, res) => {

    await deployContract(eaddress, epkey).catch((err) => { return console.log(err); });
    if (req.body.barcode == barcode) {
        await SellerWithdraw();
        console.log('Item delivered!');
        res.render('result', { result: 'successful!' });
    } else {

        await SellerWithdraw()
        console.log('Delivery failed! money returned..');
        res.render('result', { result: 'not successful.' });
    }



})

app.listen(port, () => console.info('Listening on port ' + port));