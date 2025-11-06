const ethCrypto = require('eth-crypto');
const fs = require("fs");
const HDwalletprovider = require("@truffle/hdwallet-provider");
const Web3 = require("web3");
const session = require("express-session");
var mongoose = require('mongoose');

const abi = require("../user_contract").abi2;
const address = require("../user_contract").address2;

const cookie = require("cookie-parser");

//const abi=require("../family_tree_details").abi;
//const address=require("../family_tree_details").address;
//const byteCode=require("../family_tree_details").bytecode;
const createIdentity = require("./create_identity");
const Profiles = require('../models/Profiles');

require("dotenv").config();

module.exports = (app) => {

    app.get("/signupr", (req, res) => {
        if (req.session.username !== undefined) {
            res.redirect("/homer");
        } else {
            res.render("signupr", {
                message: null
            });
        }
    });
    /*app.get("/login", (req,res) => {
        res.redirect("login");

    });*/

    app.post("/signupr", async (req, res) => {
        const name = req.body.name;
        const phno = req.body.phno;
        const username = req.body.email;
        const password = req.body.password;
        const userType = 'Rider';
        const vehicle = "";
        const vehicleNo = "";
        // Creating identity
        var identity = createIdentity();
        console.log(identity);
        const publicKey = identity.publicKey;
        const privateKey = identity.privateKey;
        const newCompressed = ethCrypto.publicKey.compress(
            publicKey
        );
        identity.compressed = newCompressed;

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
            // Handle successful response here
        } catch (err) {
            console.log(err);
            // Handle error here, for example:
            res.status(500).send('Error occurred while processing your request.');
        }




        req.session.username = username;
        req.session.privateKey = privateKey;
        req.session.userType = userType;

        res.redirect("/homer");
    });
}