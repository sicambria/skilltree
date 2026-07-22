const FeedPost = require('../models/feedpostmodel');
const User = require('../models/usermodel');

exports.getFeed = async (req, res) => {
    try {
        const posts = await FeedPost.find({}).sort({ createdAt: -1 }).limit(50);
        res.json(posts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.createPost = async (req, res) => {
    try {
        const { type, body, skillName, skillLevel } = req.body;
        const user = await User.findOne({ username: req.decoded.username });
        if (!user) return res.json({ success: false, message: 'User not found.' });

        const post = new FeedPost({
            username: req.decoded.username,
            type,
            body,
            skillName,
            skillLevel
        });
        await post.save();
        res.json({ success: true, post });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.createComment = async (req, res) => {
    try {
        const { postId, body } = req.body;
        const user = await User.findOne({ username: req.decoded.username });
        if (!user) return res.json({ success: false, message: 'User not found.' });

        const post = await FeedPost.findById(postId);
        if (!post) return res.json({ success: false, message: 'Post not found.' });

        post.comments.push({ username: req.decoded.username, body });
        await post.save();
        res.json({ success: true, post });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deletePost = async (req, res) => {
    try {
        const { postId } = req.body;
        const user = await User.findOne({ username: req.decoded.username });
        if (!user) return res.json({ success: false, message: 'User not found.' });

        const post = await FeedPost.findById(postId);
        if (!post) return res.json({ success: false, message: 'Post not found.' });

        if (post.username !== req.decoded.username && !user.admin) {
            return res.json({ success: false, message: 'Not authorized.' });
        }

        await FeedPost.findByIdAndDelete(postId);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
