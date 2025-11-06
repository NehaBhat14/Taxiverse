const ethCrypto = require('eth-crypto');
const fs = require("fs");
const HDwalletprovider = require("@truffle/hdwallet-provider");
const Web3 = require("web3");
const session = require("express-session");
const CurrentRide = require("../models/Auction");
const Payment = require("../models/paymentSchema");
const abi = require("../user_contract").abi2;
const address = require("../user_contract").address2;
const express = require('express');
const Razorpay = require('razorpay');
const razorpay = new Razorpay({
    key_id: 'rzp_test_SSELMuJomrwZ1i',
    key_secret: 'cxoRaErElvdqIS8MQj2RcSxB'
});
const app = express();
app.use(express.json());

const axios = require('axios');
const geocodingAPIKey = process.env.MAPS_API_KEY;
app.use(express.json());
const calculateFare = require('../models/fareCalculator').calculateFare;


module.exports = (app) => {
    app.get("/homer", async (req, res) => {

        if (req.session.username !== undefined) {
            if (req.session.userType === "Rider") {
                const dbRecord = await CurrentRide.findOne({
                    username: req.session.username
                });
                if (dbRecord === null) {
                    res.render("homer");
                } else {
                    res.redirect("/currentbids");
                }
            } else {
                res.render("homed");
            }
        } else {
            res.redirect("/");
        }


    });

    app.post("/homer", async (req, res) => {
        console.log(req.body);
        if (req.session.username) {
            app.use(express.json());
            const from = req.body.from;
            const to = req.body.to;
            const dist = String(req.body.dist);
            const time = String(req.body.dura);

            const distanceNum = Number(dist.replace(/[^\d.]/g, ''));

            console.log(distanceNum);

            const geocodingAPIUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(to)}&key=AIzaSyDt_Ie8k___t-51kX_dHUmPzXMzB6zBRIs`;
            console.log(to);
            const response = await axios.get(geocodingAPIUrl);
            console.log(response.data.results[0].address_components);
            const localityType = response.data.results[0].address_components.find(component => component.types.includes('locality')).long_name;

            console.log(localityType);

            const fareRange = calculateFare(distanceNum, localityType);

            console.log(fareRange);

            const currentRide = new CurrentRide({

                from: from,
                to: to,
                dist: dist,
                dura: time,
                range: fareRange,
                username: req.session.username,
                status: "AVL",
                bids: []
            });
            await currentRide.save()
                .then(() => {
                    console.log("Current ride saved successfully.");
                })
                .catch((err) => {
                    console.error(err);
                });

            req.session.On = true;
            res.redirect("/currentbids");
        }

    });




    app.get("/currentbids", async (req, res) => {
        if (req.session.username) {
            const dbRecord = await CurrentRide.findOne({
                username: req.session.username
            });
            console.log(dbRecord);

            if (dbRecord.status === "BOK" || dbRecord.status === "MET") {
                res.redirect("/finalr");
            } else {
                let message = null;
                const bids = dbRecord.bids;
                if (bids.length === 0) {
                    // console.log(bids);
                    message = "No bids yet";
                }
                res.render("bid", {
                    to: dbRecord.to,
                    from: dbRecord.from,
                    range: dbRecord.range,
                    bids: bids,
                    message: message
                });
            }
        } else {
            res.redirect("/");
        }
    });

    app.post("/currentbids", async (req, res) => {
        if (req.session.username) {
            const bidder = req.body.bidder;
            const value = req.body.value;
            const resp = await CurrentRide.findOneAndUpdate({
                username: req.session.username
            }, {
                finalBidder: bidder,
                finalValue: value,
                status: "BOK",
                $set: {
                    bids: []
                }
            });
            console.log(resp);

            res.redirect("/finalr");
        }
    });

    app.get("/finalr", async (req, res) => {
        if (req.session.username !== undefined) {
            const getBidder = await CurrentRide.find({
                username: req.session.username
            });
            const provider = new HDwalletprovider(
                "ccdddeb92b1f4367e837ca8adf3fd128a433b4737960013946b2d18263ea7781",
                'https://sepolia.infura.io/v3/3bd9ec3cd7924268a521a9ab04f95da8'
            );
            const web3 = new Web3(provider);

            console.log("provider set");

            const contract = new web3.eth.Contract(abi, address);
            console.log(getBidder[0]);
            const response = await contract.methods.get(getBidder[0].finalBidder).call();

            const final = {
                name: response['5'],
                phoneNumber: response['1'],
                value: getBidder[0].finalValue,
                vehicle: response['2'],
                vehicleNo: response['3']

            }
            const status = getBidder[0].status;
            if (status === "MET") {
                res.render("finalr", {
                    final: final,
                    message: "done"
                });
            } else {
                res.render("finalr", {
                    final: final,
                    message: null
                });
            }
        } else {
            res.redirect("/");
        }

    });
    app.post('/finalr', async (req, res) => {
        try {
            // Set riderEnd to true in CurrentRide schema
            const currentRide = await CurrentRide.findOneAndUpdate({
                username: req.session.username
            }, {
                "consensus.riderEnd": true
            }, {
                new: true
            });
            if (!currentRide) {
                return res.status(404).json({
                    message: "Ride not found"
                });
            }

            // Check if driverEnd is also true in CurrentRide schema
            if (!currentRide.consensus.driverEnd) {
                return res.status(400).json({
                    message: "Driver has not ended the ride yet"
                });
            }

            // Get payment details from CurrentRide schema
            const {
                finalBidder,
                finalValue,
                to,
                from,
                name,
            } = currentRide;

            // Create payment in Payment schema
            const payment = new Payment({
                fare: finalValue,
                driver_username: finalBidder,
                rider_username: req.session.username
            });
            await payment.save();

            const options = {
                amount: finalValue * 100, // Amount in paisa
                currency: "INR",
                receipt: payment._id.toString(),
                payment_capture: '1'
            };

            // Create Razorpay order and render payment page
            razorpay.orders.create(options, function(err, order) {
                if (err) {
                    console.log(err);
                    return res.status(500).json({
                        message: "Failed to create order",
                    });
                }
                // render the payment page with the Razorpay order ID
                res.render('payment', {
                    key_id: razorpay.key_id,
                    order_id: order.id,
                    amount: order.amount,
                    to: to,
                    from: from,
                    email: req.session.username,
                    name: name,
                });
            });

        } catch (err) {
            console.error(err);
            return res.status(500).json({
                message: "Internal server error"
            });
        }
    });

    app.post('/payment/success', async (req, res) => {
        try {
            // Update fields in CurrentRide schema
            await CurrentRide.findOneAndUpdate({
                username: req.session.username
            }, {
                $set: {
                    status: 'ENDED',
                    'consensus.driverEnd': false,
                    'consensus.riderEnd': false,
                    finalBidder: null,
                    finalValue: null,
                    bids: []
                }
            });

            // Update fields in Payment schema
            await Payment.findOneAndUpdate({
                _id: req.body.razorpay_order_id
            }, {
                $set: {
                    status: 'completed',
                    transaction_id: req.body.razorpay_payment_id
                }
            });

            res.render('payment-success', {
                title: 'Payment Success',
                paymentId: req.body.razorpay_payment_id,
                orderId: req.body.razorpay_order_id
            });
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal Server Error');
        }
    });

}