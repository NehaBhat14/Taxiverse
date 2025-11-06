const ethCrypto = require('eth-crypto');
const fs = require("fs");
const HDwalletprovider = require("@truffle/hdwallet-provider");
const Web3 = require("web3");
const session = require("express-session");
var mongoose = require('mongoose');
const cookie = require("cookie-parser");

const abi = require("../user_contract").abi2;
const address = require("../user_contract").address2;


const createIdentity = require("./create_identity");
const Profiles = require('../models/Profiles');

require("dotenv").config();

module.exports = (app) => {

    app.get("/signupd", (req, res) => {
        if (req.session.identity !== undefined) {
            res.redirect("/homed");
        } else {
            res.render("signupd", {
                message: null
            });
        }
    });

    app.post("/signupd", async (req, res) => {
        var name = req.body.name;
        var phno = req.body.phno;
        var username = req.body.email;
        var password = req.body.password;
        var vehicle = req.body.vehicle;
        var vehicleNo = req.body.vehicle_num;
        var userType = 'Driver';

        // Creating identity
        var identity = createIdentity();

        console.log(identity);
        const publicKey = identity.publicKey;
        const privateKey = identity.privateKey;

        const newCompressed = ethCrypto.publicKey.compress(
            publicKey
        );
        identity.compressed = newCompressed;

        // Setting provider and web3
        const provider = new HDwalletprovider(
            "ccdddeb92b1f4367e837ca8adf3fd128a433b4737960013946b2d18263ea7781",
            'https://sepolia.infura.io/v3/3bd9ec3cd7924268a521a9ab04f95da8'
        );

        const web = new Web3(provider);

        console.log("provider set");

        const contract = new web.eth.Contract(abi, address);

        try {
            const response = await contract.methods.set(name, username, phno, vehicle, vehicleNo, userType, password, privateKey).send({
                from: "0x78E0F6ECb2cC7E14E3D52d03335322218FEb4A55"
            });

            req.session.username = username;
            req.session.privateKey = privateKey;
            req.session.userType = userType;

            res.redirect("/homed");

        } catch (err) {
            console.log(err);
            res.status(500).send('Error occurred while processing your request.');
        }

    });



}