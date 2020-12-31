const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth.js');
const Profile = require('../../models/Profile.js');
const User = require('../../models/User.js');
const { check, validationResult } = require('express-validator');
const { route } = require('./users.js');
const request = require('request');
const config = require('config');

// @route   GET api/profile/me
// @desc    get current user's profile
// @access  Private
router.get('/me', auth, async (req, res) => {

    try {
        // get current user based on token's payload id
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']);

        if (!profile) {
            return res.status(400).json({ msg: 'There is no profile for this user' });
        }
        return res.json(profile)

    } catch (error) {
        console.log(error.message);
        return res.status(500).send('Server error');
    }
});

// @route   POST api/profile
// @desc    create or update user profile
// @access  Private
router.post('/', [auth, [
    check('status', 'Status is required').not().isEmpty(),
    check('skills', 'Skills is required').not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Destructure the req object into variables
    const { company, website, location, bio, status, githubusername, skills, youtube, facebook, twitter, instagram, linkedin } = req.body;
    // Build empty Profile Object
    const profileFields = {};
    profileFields.user = req.user.id;

    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
        profileFields.skills = skills.split(',').map(skill => skill.trim());
    }
    // Build social object in the profileFields object
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;
    //

    try {
        let profile = await Profile.findOne({ user: req.user.id });
        if (profile) {
            // Update
            profile = await Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true });
            return res.json(profile);
        }

        // create 
        profile = new Profile(profileFields);
        await profile.save();
        return res.json(profile);

    } catch (error) {
        console.log(error.message);
        return res.status(500).send('Server Error');
    }
});

// @route   GET api/profile
// @desc    Get all profiles
// @access  Public
router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        return res.json(profiles);
    } catch (error) {
        console.log(error.message);
        return res.status(500).send('Server Error');
    }
});

// @route   GET api/profile/user/:user_id
// @desc    Get profile by user ID
// @access  Public
router.get('/user/:user_id', async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']);
        if (!profile) return res.status(400).json({ msg: "Profile not found" });

        return res.json(profile);
    } catch (error) {
        console.log(error.message);

        if (error.kind == 'ObjectId') {
            return res.status(500).send('Profile not found');
        }

        return res.status(500).send('Server Error');
    }
});

// @route   DELETE api/profile/
// @desc    Delete profile, user and posts
// @access  Private
router.delete('/', auth, async (req, res) => {
    try {
        // remove user's posts

        // remove profile
        await Profile.findOneAndRemove({ user: req.user.id });
        // remove user
        await User.findOneAndRemove({ _id: req.user.id });

        return res.json({ msg: "User deleted" });

    } catch (error) {
        console.log(error.message);
        return res.status(500).send('Server Error');
    }
});

// @route   PUT api/profile/experience
// @desc    Add profile's experience
// @access  Private
router.put('/experience', [auth, [
    check('title', 'Title is required').not().isEmpty(),
    check('company', 'Company is required').not().isEmpty(),
    check('from', 'From date is required').not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { title, company, location, from, to, current, description } = req.body;
    // making an object and putting data from destructured req.body into it
    const newExp = {
        title: title,
        company: company,
        location: location,
        from: from,
        to: to,
        current: current,
        description: description
    }
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        profile.experience.unshift(newExp);
        await profile.save();
        return res.json(profile);
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server Error");
    }
});

// @route   DELETE api/profile/experience/:exp_id
// @desc    Delete experince from profile
// @access  Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        // Get the remove index
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);
        // remove and save the rest of profile
        profile.experience.splice(removeIndex, 1);
        await profile.save();

        return res.json(profile);
    } catch (error) {
        return res.status(500).send("Server Error");
    }
});


// @route   PUT api/profile/education
// @desc    Add profile's education
// @access  Private
router.put('/education', [auth, [
    check('school', 'School is required').not().isEmpty(),
    check('degree', 'Degree is required').not().isEmpty(),
    check('from', 'From date is required').not().isEmpty(),
    check('fieldofstudy', 'Field of study  is required').not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { school, degree, fieldofstudy, from, to, current, description } = req.body;
    // making an object and putting data from destructured req.body into it
    const newEdu = {
        school: school,
        degree: degree,
        fieldofstudy: fieldofstudy,
        from: from,
        to: to,
        current: current,
        description: description
    }
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        profile.education.unshift(newEdu);
        await profile.save();
        return res.json(profile);
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server Error");
    }
});

// @route   DELETE api/profile/education/:exp_id
// @desc    Delete education from profile
// @access  Private
router.delete('/education/:edu_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        // Get the remove index
        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);
        // remove and save the rest of profile
        profile.education.splice(removeIndex, 1);
        await profile.save();

        return res.json(profile);
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server Error");
    }
});

// @route   GET api/profile/github/:username
// @desc    Get user repos from Github
// @access  Public
router.get('/github/:username', (req, res) => {
    try {
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')} & client_secret=${config.get('githubSecret')}`,
            method: 'Get',
            headers: { 'user-agent': 'node.js' }
        };
        request(options, (error, response, body) => {
            if (error) console.error(error);

            if (response.statusCode !== 200) {
                return res.status(404).json({ msg: 'No Github profile was found' });
            }
            return res.json(JSON.parse(body));
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server Error");
    }
})

module.exports = router;