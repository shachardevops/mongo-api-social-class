const { User } = require('./../models/user');
const { Person } = require('./../models/person');
const { ClassRoom } = require('./../models/classRoom');

const authenticate = async (request, response, next) => {
  try {
    const token = request.header('x-auth');
    const user = await User.findByToken(token);
    if (!user) {
      console.log('exit');
      return Promise.reject();
    }
    const person = await Person.findById(user.person);
    user.person = person;
    const classRoom = await ClassRoom.findById(person.classRoom);
    person.classRoom = classRoom;
    request.person = person;
    request.user = user;
    request.token = token;
    next();
  } catch (error) {
    response.status(401).send(error);
  }
};
module.exports = {
  authenticate
};
