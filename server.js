const express = require('express');
const _ = require('lodash');
const bodyParser = require('body-parser');
const moment = require('moment');
const { mongoose } = require('./db/mongoose');
const { Arrival } = require('./models/arrival');
const { User } = require('./models/user');
const { authenticate } = require('./middleware/authenticate');
const { ClassRoom } = require('./models/classRoom');
const { Person } = require('./models/person');

const day = moment().startOf('day');
const tomorrow = moment(day).endOf('day');
const app = express();
const port = process.env.PORT || 3000;
app.use(bodyParser.json());

app.get('/arrivals', (req, res) => {
  Arrival.find().then(
    arrivals => {
      res.send({ arrivals });
    },
    e => {
      res.status(400).send(e);
    }
  );
});
app.get('/classrooms', async (req, res) => {
  try {
    let classRooms = await ClassRoom.find();
    classRooms = classRooms.map(classRoom => {
      return classRoom._doc.name;
    });
    res.status(200).send({ classRooms });
  } catch (error) {
    res.status(400).send({ error });
  }
});
app.post('/arrivals', authenticate, async (request, response) => {
  const id = request.body.id;
  const today = moment().startOf('day');
  const tomorrow = moment(today).endOf('day');

  try {
    const person = await Person.findOne({ id });
    if (!person) {
      throw 'person not exist';
    }
    if (person.teacher) {
      throw 'You are not a student';
    }
    let arrival = await Arrival.findOne({
      created_on: { $gte: today.toDate(), $lt: tomorrow.toDate() },
      student: person
    });
    if (arrival) {
      throw 'you already arrived';
    }
    arrival = new Arrival({
      classRoom: request.person.classRoom,
      student: person,
      arrived: true,
      image: person.image,
      name: person.name
    });
    await arrival.save();
    response.status(200).send('Your arrival has been received');
  } catch (error) {
    response.status(400).send(error);
  }
});

app.post('/arrivals/date', authenticate, async (request, response) => {
  try {
    const today = moment(request.body.date);
    const tomorrow = moment(today).endOf('day');
    let arrivals = await Arrival.find({
      created_on: { $gte: today.toDate(), $lt: tomorrow.toDate() },
      classRoom: request.person.classRoom
    });
    if (!arrivals) {
      throw 'no arrivals';
    }
    arrivals = arrivals.map(arrival => {
      const name = arrival.name;
      const image = arrival.image;
      const at = moment(arrival.created_on).format('h:mm a');
      return { name, image, at };
    });

    response.status(200).send({ arrivals });
  } catch (error) {
    response.status(400).send(error);
  }
});

app.get('/users/me', authenticate, (request, response) => {
  const user = request.user;
  const person = request.person;
  response.send({ user, person });
});

app.post('/arrivals/check', authenticate, async (request, response) => {
  const id = request.body.id;
  const today = moment().startOf('day');
  const tomorrow = moment(today).endOf('day');

  try {
    const person = await Person.findOne({ id });
    if (!person) {
      throw 'person not exist';
    }
    if (person.teacher) {
      throw 'You are not a student';
    }
    let arrival = await Arrival.findOne({
      created_on: { $gte: today.toDate(), $lt: tomorrow.toDate() },
      student: person
    });
    if (arrival) {
      throw 'you already arrived';
    }

    response.status(200).send('not arrived yet');
  } catch (error) {
    response.status(400).send(error);
  }
});
app.post('/users/login', async (req, res) => {
  const body = _.pick(req.body, ['email', 'password']);
  try {
    const user = await User.findByCredentials(body.email, body.password);
    const token = await user.generateAuthToken();
    const person = await Person.findById(user.person);

    res
      .status(200)
      .header('x-auth', token)
      .send({ user, person });
  } catch (error) {
    res.status(400).send();
  }
});

app.delete('/users/me/token', authenticate, (request, response) => {
  request.user
    .removeToken(request.token)
    .then(() => {
      response.status(200).send();
    })
    .catch(err => {
      response.status(400).send();
    });
});

app.post('/register', async (request, response) => {
  try {
    const className = request.body.className;
    const teacher = request.body.teacher;
    const id = request.body.id;
    const email = request.body.email;
    const password = request.body.password;
    const image = request.body.image;
    let classRoom = await ClassRoom.findOne({ name: className });
    let person = await Person.findOne({ id });
    let user = await User.findOne({ email });
    if (user) {
      throw 'user already exist please pick another email';
    }
    if (person) {
      throw 'Person already exist please pick another id';
    }
    if (classRoom && teacher) {
      throw 'Teacher the class already exist';
    } else if (!classRoom && !teacher) {
      throw 'Student the class not exist';
    }

    person = new Person({
      _id: new mongoose.Types.ObjectId(),
      name: request.body.name,
      teacher: teacher,
      id,
      image
    });
    await person.save();
    user = new User({
      _id: new mongoose.Types.ObjectId(),
      email,
      password,
      person: person._id
    });
    await user.save();

    const token = await user.generateAuthToken();
    if (teacher && !classRoom) {
      classRoom = new ClassRoom({
        _id: new mongoose.Types.ObjectId(),
        name: className,
        teacher: person._id
      });
      await classRoom.save();
      person.classRoom = classRoom._id;
      await person.save();
      response
        .status(200)
        .header('x-auth', token)
        .send({ person, classRoom, user });
    } else if (!teacher && classRoom) {
      classRoom.students.push(person);
      await classRoom.save();
      person.classRoom = classRoom._id;
      await person.save();
      response
        .status(200)
        .header('x-auth', token)
        .send({ person, classRoom, user });
    } else {
      throw 'something went wrong';
    }
  } catch (err) {
    console.log(err);
    response.status(400).send(err);
  }
});

app.listen(port, () => {
  console.log(`Started on port ${port}`);
});
