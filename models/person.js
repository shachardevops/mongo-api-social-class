const mongoose = require('mongoose');
const { Schema } = mongoose;
const Person = mongoose.model(
  'Person',
  new Schema({
    _id: Schema.Types.ObjectId,
    name: String,
    id: {
      type: String,
      required: true,
      minlength: 1,
      trim: true,
      unique: true
    },
    image: String,
    teacher: Boolean,
    classRoom: { type: Schema.Types.ObjectId, ref: 'ClassRoom' }
  })
);

module.exports = {
  Person
};
