const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

//functions
const Progress_func = require('./functions/Progress');

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
app.use('/Badges', BadgesRoute);


app.get('/validate-token', isloggedin, (req, res) => {
    res.status(200).json({ valid: true });
});

app.post('/Register', async (req, res) => {
    const { username, email, password, Unicode } = req.body;

    let matchedGyms;

    if (Unicode) {
    matchedGyms = await Gymmongo.findOne({ UniCode: Unicode });

        // If Unicode is provided but invalid
        if (!matchedGyms) {
            return res.status(400).json({
                Invalid: 'Invalid Unicode',
                message: 'Please enter a correct Unicode',
            });
        }
    }

    try {


    const user = new Usermongo({ 
        username, 
        email, 
        password,
        Unicode: Unicode || null,
        Gym: matchedGyms,
    });


    if (matchedGyms) {
        matchedGyms.Members.push({
            UserId: user.id,
            JoinDate: new Date(),
            MembershipStatus: 'Active'
        });
        await matchedGyms.save();
    }
    
    await user.save();

    const token = jwt.sign({ email, id: user._id }, 'ewyfif8787347ry378', {
        expiresIn: '7d',
    });

    res.cookie('username', token, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: false,
    });

    res.status(201).json({ message: 'User registered successfully', token });
    } catch (error) {
        console.log(error);
        res.status(400).json({ error: 'Error registering user' });
    }
});

app.post('/Login', async (req, res) => {
    const { email, password } = req.body;
    console.log('Login attempt with email:', email);
    const user = await Usermongo.findOne({ email });
    if (!user) {
        return res.status(401).json({ error: 'User not found' });
    }
    if (user.password !== password) {
        return res.status(401).json({ error: 'Invalid password' });
    }
    const token = jwt.sign({ email, id: user._id }, 'ewyfif8787347ry378', {
        expiresIn: '7d',
    });
    res.cookie('username', token, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: false,
    });
    res.status(200).json({ message: 'User logged in successfully', token });
});

// Server start
app.listen(3000);