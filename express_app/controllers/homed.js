const ethCrypto = require('eth-crypto');
const fs = require("fs");
const HDwalletprovider = require("@truffle/hdwallet-provider");
const Web3 = require("web3");
const session = require("express-session");
const CurrentRide = require("../models/Auction");
const Payment = require("../models/paymentSchema");

const abi = require("../user_contract").abi2;
const address = require("../user_contract").address2;



module.exports = (app) => {
    app.get("/homed", async (req, res) => {
        if (req.session.username !== undefined) {
            if (req.session.userType === "Driver") {
                const findExisting = await CurrentRide.find({
                    'bids.bidder': req.session.username
                });
                console.log(findExisting);

                if (findExisting.length === 0) {
                    const checkFinal = await CurrentRide.find({
                        finalBidder: req.session.username
                    });
                    if (checkFinal.length === 0) {
                        const allRecords = await CurrentRide.find({
                            status: "AVL"
                        }).sort({
                            createdAt: -1
                        });
                        const rides = allRecords.map((record) => ({
                            username: record.username,
                            to: record.to,
                            from: record.from,
                            dist: record.dist,
                            dura: record.dura,
                            range: [record.range[0], record.range[1]],
                            status: record.status,
                            bids: record.bids,
                            finalBidder: record.finalBidder,
                            finalValue: record.finalValue,
                            createdAt: record.createdAt
                        }));
                        console.log(rides);
                        res.render("homed", {
                            rides
                        });
                    } else {
                        res.redirect("/finald");
                    }
                } else {
                    const currentBid = findExisting[0];
                    let value;
                    for (var i = 0; i < currentBid.bids.length; i++) {
                        if (bidder = req.session.username) {
                            value = currentBid.bids[i].value;
                        }
                    }
                    res.render("dbid", {
                        from: currentBid.from,
                        to: currentBid.to,
                        value: value,
                        status: "pending"
                    });
                }
            } else {
                res.render("homer", {});
            }
        } else {
            res.redirect("/");
        }
    });




    app.post("/homed", async (req, res) => {
        const customerUsername = req.body.username;
        const value = req.body.value;
        const provider = new HDwalletprovider(
            "ccdddeb92b1f4367e837ca8adf3fd128a433b4737960013946b2d18263ea7781",
            'https://sepolia.infura.io/v3/3bd9ec3cd7924268a521a9ab04f95da8'
        );

        const web3 = new Web3(provider);

        console.log("provider set");

        const contract = new web3.eth.Contract(abi, address);

        const response = await contract.methods.get(req.session.username).call();
        console.log(value, response);
        const bid = {
            value: value,
            bidder: req.session.username,
            vehicle: response['2'],
            vehicleNo: response['3']
        }
        const insertValue = await CurrentRide.findOneAndUpdate({
            username: customerUsername
        }, {
            $push: {
                bids: bid
            }
        });
        console.log(insertValue);
        res.redirect("/homed");
    });


    app.get("/finald", async (req, res) => {
        if (req.session.username !== undefined) {

            const checkFinal = await CurrentRide.find({
                finalBidder: req.session.username
            });
            const provider = new HDwalletprovider(
                "ccdddeb92b1f4367e837ca8adf3fd128a433b4737960013946b2d18263ea7781",
                'https://sepolia.infura.io/v3/3bd9ec3cd7924268a521a9ab04f95da8'
            );
            const web3 = new Web3(provider);
            const contract = new web3.eth.Contract(abi, address);

            const response = await contract.methods.get(checkFinal[0].username).call();
            console.log(response);
            const customer = {
                name: response['5'],
                phoneNumber: response['1'],
                to: checkFinal[0].to,
                from: checkFinal[0].from,
                value: checkFinal[0].finalValue,
                username: checkFinal[0].username
            }

            if (checkFinal[0].status === "MET") {
                res.render("finald", {
                    result: customer,
                    message: null
                });
            } else {
                res.render("finald", {
                    result: customer,
                    message: "done"
                });
            }
        } else {
            res.redirect("/");
        }

    });
    app.post("/finald", async (req, res) => {

        // Find the ride details in the CurrentRide schema and make sure that the ride exists
        const currentRide = await CurrentRide.findOne({
            username: req.body.username
        });
        if (!currentRide) {
            return res.status(400).json({
                message: "Ride not found"
            });
        }

        // Set the consensus.driverEnd value to true in the currentride schema
        currentRide.consensus.driverEnd = true;
        await currentRide.save();

        // Check if both driverEnd and riderEnd are true and if yes, display a message to the Driver that Payment pending
        if (currentRide.consensus.driverEnd && currentRide.consensus.riderEnd) {
            res.send("Payment pending");
            return;
        }

        // Check if payment is completed for the ride. If yes, display a message to the driver that the payment was successful and render the payed.ejs view
        const payment = await Payment.findOne({
            username: req.body.username
        });
        if (payment && payment.completed) {
            const deleteAuction = await CurrentRide.findOneAndDelete({
                username: req.body.username
            });
            res.render("payed", {
                fare: deleteAuction.fare,
                from: deleteAuction.from,
                to: deleteAuction.to
            });
            return;
        }

        // If payment is not completed, display a message to the driver that the payment is pending
        res.send("Payment pending");
    });

    // GET route for /payed
    app.get("/payed", async (req, res) => {
        const {
            username
        } = req.query;

        // Find the ride details in the CurrentRide schema and make sure that the ride exists
        const currentRide = await CurrentRide.findOne({
            username
        });
        if (!currentRide) {
            return res.status(400).json({
                message: "Ride not found"
            });
        }

        // Check if payment is completed for the ride. If not, redirect the user back to the homed.ejs view
        const payment = await Payment.findOne({
            username
        });
        if (!payment || !payment.completed) {
            return res.redirect("/homed");
        }

        // Render the payed.ejs view and pass the required data
        res.render("payed", {
            fare: currentRide.fare,
            from: currentRide.from,
            to: currentRide.to
        });
    });

    // POST route for /payed
    app.post("/payed", async (req, res) => {
        // Verify the data sent by the payed.ejs view
        const {
            username
        } = req.body;

        // Perform necessary actions to verify and update the payment status
        // ...

        // Redirect the user back to the homed.ejs view
        res.redirect("/homed");
    });


}