const express = require('express');
const router = express.Router();
const { check, validationRedult, validationResult } = require('express-validator');
const auth = require('../../middleware/auth.js');
const Post = require('../../models/Post.js');
const Profile = require('../../models/Profile.js');
const User = require('../../models/User.js');

// @route   POST api/posts
// @desc    create a post
// @access  Private
router.post('/', [auth, [
    check('text', 'Text is required').not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const user = await User.findById(req.user.id).select('-password');
        const newPost = new Post({
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        });
        const post = await newPost.save();
        return res.json(post);

    } catch (error) {
        console.log(error.message);
        return res.status(500).send('Serer Error');
    }

});

// @route   GET api/posts
// @desc    Get all posts
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 });
        return res.json(posts);
    } catch (error) {
        console.log(error.message);
        return res.status(500).send('Serer Error');
    }
});

// @route   GET api/posts/:post_id
// @desc    Get post by id
// @access  Private
router.get('/:post_id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.post_id);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }
        return res.json(post);
    } catch (error) {
        console.log(error.message);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found' });
        }
        return res.status(500).send('Serer Error');
    }
});

// @route   DELETE api/posts/:post_id
// @desc    delete a post
// @access  Private
router.delete('/:post_id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.post_id);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }
        // check user
        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }
        await post.remove();
        return res.json({ msg: 'Post Deleted' });
    } catch (error) {
        console.log(error.message);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found' });
        }
        return res.status(500).send('Serer Error');
    }
});

// @route   PUT api/posts/like/id
// @desc    Like a post
// @access  Private
router.put('/like/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        // check if the post has already been liked by user
        if (post.like.filter(like => like.user.toString() === req.user.id).length > 0) {
            return res.status(400).json({ msg: "Post already liked" });
        }
        post.like.unshift({ user: req.user.id });
        await post.save();
        return res.json(post.like);

    } catch (error) {
        console.log(error.message);
        return res.status(500).send('Server Error');
    }
})

// @route   PUT api/posts/unlike/id
// @desc    Like a post
// @access  Private
router.put('/unlike/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        // check if the post has already been liked by user
        if (post.like.filter(like => like.user.toString() === req.user.id).length === 0) {
            return res.status(400).json({ msg: "Post has not yet been liked" });
        }

        const removeIndex = post.like.map(like => like.user.toString()).indexOf(req.user.id);
        post.like.splice(removeIndex, 1);
        await post.save();
        return res.json(post.like);

    } catch (error) {
        console.log(error.message);
        return res.status(500).send('Server Error');
    }
})

// @route   POST api/posts/comment/:post_id
// @desc    comment on a post
// @access  Private
router.post('/comment/:post_id', [auth, [
    check('text', 'Text is required').not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const user = await User.findById(req.user.id).select('-password');
        const post = await Post.findById(req.params.post_id);

        const newComment = {
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        };
        post.comments.unshift(newComment);
        await post.save();
        return res.json(post.comments);

    } catch (error) {
        console.log(error.message);
        return res.status(500).send('Serer Error');
    }

});

// @route   DELETE api/posts/comment/:post_id/:comment_id
// @desc    delete a comment on a post
// @access  Private
router.delete('/comment/:post_id/:comment_id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.post_id);
        // pull out comment
        const comment = post.comments.find(comment => comment.id === req.params.comment_id);

        // make sure comment exists
        if (!comment) {
            return res.status(404).json({ msg: 'Comment does not exist' });
        }

        // check user
        if (comment.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: "User is not authorized" });
        }
        const removeIndex = post.comments.map(comment => comment.user.toString()).indexOf(req.user.id);
        post.comments.splice(removeIndex, 1);
        await post.save();
        return res.json(post.comments);

    } catch (error) {
        console.log(error.message);
        return res.status(500).send('Serer Error');
    }
});


module.exports = router;