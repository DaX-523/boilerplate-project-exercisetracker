const express = require('express')
const app = express()
const cors = require('cors')
const mongodb = require('mongodb');
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
require('dotenv').config()
const ObjectId = mongodb.ObjectId;

const userSchema = new mongoose.Schema({
  username: String
})

const exerciseSchema = new mongoose.Schema({
	userId: String,
	username: String,
	description: { type: String, required: true },
	duration: { type: Number, required: true },
	date: String,
});

const User = mongoose.model('Users', userSchema);

let Exercise = mongoose.model('Exercise', exerciseSchema);


app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: false}))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/users', async function(req, res) {
  const users = await User.find();
  res.json(users)
})

app.post('/api/users', async function(req, res) {
  const username = req.body.username;
  await User.create({username: username});
  const userObj = await User.findOne({username: username}).select({username: 0});
  const userId = userObj._id.toString();
  res.json({
    username: username,
    _id: userId
  })
})



app.post('/api/users/:_id/exercises', async function(req, res) {
  const userId = req.params._id;
  const description = req.body.description;
  const duration = +req.body.duration;
  let date = req.body.date;

  const userObj = await User.findById(new ObjectId(userId));
  const username = userObj.username;
  if (!date) {
		date = new Date().toISOString().substring(0, 10);
	}

let newExercise = new Exercise({
			userId: userObj._id,
			username: username,
			description: description,
			duration: duration,
			date: date,
		});
  await newExercise.save();
  res.json({
    username: username,
    description: description,
    duration: duration,
    date: new Date(newExercise.date).toDateString(),
    _id: userId
  })
})

app.get('/api/users/:_id/logs', async function(req, res) {
  const userId = req.params._id;
  const from = req.query.from || new Date(0).toISOString().substring(0, 10);
	const to =
		req.query.to || new Date(Date.now()).toISOString().substring(0, 10);
	const limit = Number(req.query.limit) || 0;

console.log('fml', from, to, limit)
 const userObj = await User.findById(new ObjectId(userId));

	let exercises = await Exercise.find({
		userId: userId,
		date: { $gte: from, $lte: to },
	})
		.select({_id: 0, userId: 0, username: 0})
		.limit(limit)
	let parsedDatesLog = exercises.map((exercise) => {
		return {
			description: exercise.description,
			duration: exercise.duration,
			date: new Date(exercise.date).toDateString(),
		};
	});

	res.json({
		_id: userObj._id,
		username: userObj.username,
		count: parsedDatesLog.length,
		log: parsedDatesLog,
	});
})

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb+srv://dax523:7355608@cluster0.poi9kq7.mongodb.net/fcc', { useNewUrlParser: true, useUnifiedTopology: true });

}

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
