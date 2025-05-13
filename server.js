const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', 
  },
});

app.use(cors());
app.use(express.json());


const polls = new Map();


app.post('/createPoll', (req, res) => {
  const { pollid, optionsList } = req.body;

  if (polls.has(pollid)) {
    return res.status(400).json({ message: 'Poll ID already exists.' });
  }

  const options = {};
  optionsList.forEach(option => {
    options[option] = 0;
  });

  polls.set(pollid, options);
  res.status(201).json({ message: 'Poll created successfully.' });
});


app.post('/castVote', (req, res) => {
  const { pollid, optionVoted } = req.body;

  if (!polls.has(pollid)) {
    return res.status(404).json({ message: 'Poll not found.' });
  }

  const options = polls.get(pollid);
  if (!options.hasOwnProperty(optionVoted)) {
    return res.status(400).json({ message: 'Invalid voting option.' });
  }

  options[optionVoted]++;
  io.emit(`poll-${pollid}`, options); 
  res.json({ message: 'Vote recorded.' });
});


app.get('/getPollResults/:pollid', (req, res) => {
  const pollid = req.params.pollid;

  if (!polls.has(pollid)) {
    return res.status(404).json({ message: 'Poll not found.' });
  }

  res.json(polls.get(pollid));
});


io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});


const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});