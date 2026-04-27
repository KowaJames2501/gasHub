const express = require('express');
const cors = require('cors'); 
const bcrypt = require('bcrypt');
const allroutes = require('./routes');
const jwt = require('jsonwebtoken');
const Path = require('path');

const app = express();
app.use(cors());
app.use(express.json());


app.use('/uploads', express.static(Path.join(__dirname, 'uploads')));
app.use("/api", allroutes);

app.get('/', (req, res) => {
  res.send('Welcome to the gas hub API');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port http://192.168.1.190:${PORT}`);
});