const mongoose = require('mongoose');
const { Schema } = mongoose;
const moment = require('moment');
const Arrival = mongoose.model(
  'Arrival',
  new Schema({
    student: { type: Schema.Types.ObjectId, ref: 'Person' },
    classRoom: { type: Schema.Types.ObjectId, ref: 'ClassRoom' },
    arrived: {
      type: Boolean,
      required: true
    },
    name: String,
    image: String,
    created_on: {
      type: Date,
      // `Date.now()` returns the current unix timestamp as a number
      default: moment()
    }
  })
);

module.exports = {
  Arrival
};
