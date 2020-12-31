const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth.js');
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const config = require('config');
const bcrypt = require('bcryptjs');

const User = require('../../models/User.js')

// @route GET api/auth
// @desc Test route
// @access Private
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        return res.json(user);
    } catch (error) {
        return res.status(500).json({ msg: 'Server Error' });
    }
});

// @route POST api/auth
// @desc authenticate user and get user
// @access Public
router.post('/', [
    check('email', 'Please inculde an email').isEmail(),
    check('password', 'Please enter a password').exists()
],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { email, password } = req.body;

        try {
            // see if the user exists or send an error
            let user = await User.findOne({ email: email });
            if (!user) {
                return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
            }
            // check password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
            }
            // return jsonwebtoken
            const payload = {
                user: {
                    id: user.id
                }
            }
            jwt.sign(payload, config.get('jwtSecret'), { expiresIn: 360000 }, (err, token) => {
                if (err) throw err;
                res.json({ token });
            });

        } catch (error) {
            console.log(error);
            res.status(500).send("Server error");
        }
    }
);

module.exports = router;