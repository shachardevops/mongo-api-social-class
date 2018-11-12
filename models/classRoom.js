const mongoose = require('mongoose');
const { Schema } = mongoose;

const ClassRoom = mongoose.model(
  'ClassRoom',
  new Schema({
    _id: Schema.Types.ObjectId,
    name: {
      type: String,
      minlength: 1,
      required: true,
      unique: true,
      trim: true
    },
    teacher: { type: Schema.Types.ObjectId, ref: 'Person' },
    students: [{ type: Schema.Types.ObjectId, ref: 'Person' }]
  })
);

module.exports = {
  ClassRoom
};
