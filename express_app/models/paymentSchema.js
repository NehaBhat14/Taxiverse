const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  order_id: { type: String },
  transaction_id: { type: String },
  status: { type: String },
  fare: { type: Number },
  driver_username: { type: String },
  rider_username: { type: String },
  created_at: {
    type: Date,
    default: Date.now
  },
  ride_ended: { type: Boolean, default: false }
});

const Payment = mongoose.model("Payment", PaymentSchema);

module.exports = Payment;