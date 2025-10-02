const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const { sendNotification } = require("./functions/Notification");
require('dotenv').config();

//functions
const Progress_func = require('./functions/Progress');
const Streak_func = require('./functions/Streak');

 // Connect DB once here
require('./config/mongo-connection');

// Importing middleware
const isloggedin = require('./middleware/isloggein');

// Importing models
const Usermongo = require('./models/User-mongo');
const Postmongo = require('./models/post-mongo');
const Gymmongo = require("./models/Gymmongo");

// Importing routes
const ChallengesRoute = require('./router/Challenges');
const CommunityRoute = require('./router/Community');
const ProfileRoute = require('./router/Profile');
const StoreRoute = require('./router/Store');
const HomeRoute = require('./router/Home');
const WorkoutRoute = require('./router/Workout');
const DietRoute = require('./router/Diet');
const BadgesRoute = require('./router/Badges');


// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:8081',
  credentials: true,
}));
app.use('/public', express.static('public'));

// Routes
app.use('/Challenges', ChallengesRoute);
app.use('/Community', CommunityRoute);
app.use('/Profile', ProfileRoute);
app.use('/Store', StoreRoute);
app.use('/Home', HomeRoute);
app.use('/Diet', DietRoute);
app.use('/Workout', WorkoutRoute);
app.use('/Badges', BadgesRoute);


app.get('/validate-token', isloggedin, (req, res) => {
    res.status(200).json({ valid: true });
});

function generateBuddyCode(username, gymName) {
  const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
  return `${username}-${random}-${gymName || 'NoGym'}`;
}

async function createUniqueBuddyCode(username, gymName) {
  let buddyCode;
  let exists = true;
  let attempts = 0;
  const maxAttempts = 10;

  while (exists && attempts < maxAttempts) {
    buddyCode = generateBuddyCode(username, gymName);
    const existingUser = await Usermongo.findOne({ BuddyCode: buddyCode });
    if (!existingUser) {
      exists = false;
    }
    attempts++;
  }

  if (exists) throw new Error("Could not generate unique BuddyCode");

  return buddyCode;
}

app.post('/register', async (req, res) => {
  const { username, email, password, Unicode } = req.body;

  let matchedGym = null;

  if (Unicode) {
    matchedGym = await Gymmongo.findOne({ UniCode: Unicode });
    if (!matchedGym) {
      return res.status(400).json({ message: 'Invalid Unicode' });
    }
  }

  try {
    const gymName = matchedGym ? matchedGym.Name : null; // or matchedGym.GymName depending on schema
    const buddyCode = await createUniqueBuddyCode(username, gymName);

    const user = new Usermongo({
      username,
      email,
      password,
      Unicode: Unicode || null,
      Gym: matchedGym,
      BuddyCode: buddyCode
    });

    if (matchedGym) {
      matchedGym.Members.push({
        UserId: user._id,
        JoinDate: new Date(),
        MembershipStatus: 'Active'
      });
      await matchedGym.save();
    }

    

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );


    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const data = { screen: 'Home' }
    sendNotification(
      user.NotificationToken,
      "Welcome To Legends Place",  // title/heading
      "Thanks for joining! Let's start your fitness journey.", // body
      data
    );

    await user.save();

    res.status(201).json({
      message: 'Registered successfully',
      token,
      buddyCode: user.BuddyCode
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Registration failed' });
  }
});


app.post('/refresh', (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token missing' });
  }

  jwt.verify(refreshToken, process.env.REF_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid refresh token' });

    const newAccessToken = jwt.sign(
      { id: decoded.id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({ token: newAccessToken });
  });
});


app.post('/Login', async (req, res) => {
    const { email, password } = req.body;
    const user = await Usermongo.findOne({ email });
    if (!user) {
        return res.status(401).json({ error: 'User not found' });
    }
    if (user.password !== password) {
        return res.status(401).json({ error: 'Invalid password' });
    }
    const token = jwt.sign({ email, id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const data = { screen: 'Diet' }
    sendNotification(
      user.NotificationToken,
      "Welcome To Legends Place",
      "Thanks for joining! Let's start your fitness journey.",
      data
    );
    
    res.status(200).json({ message: 'User logged in successfully', token });
});


app.listen(3000);