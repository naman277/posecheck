const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();

connectDB(); // safe: it warns if MONGO_URI is not set

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.use('/api/auth', require('./routes/auth'));

// placeholder for sessions routes (we'll add controller soon)
app.use('/api/sessions', require('./routes/sessions'));

// in backend/index.js (or your main server file)
const registerRouter = require('./routes/register');
app.use('/api/auth', registerRouter);


// in backend/index.js (or app.js)
const sessionsRouter = require('./routes/sessions');
app.use('/api/sessions', sessionsRouter);

const meRouter = require('./routes/me');
app.use('/api/me', meRouter);

app.get("/", (req, res) => {
  res.send("PoseCheck Backend is running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
