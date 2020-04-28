const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');

const Post = require('../models/post');
const User = require('../models/user');

const clearImage = (filePath) => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, (err) => {
        console.log(err);
    });
};

exports.getPost = async (req, res, next) => {
    const postId = req.params.postId;
    try {
        const post = await Post.findById(postId);
        if (!post) {
            const error = new Error('Could not find post');
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({
            message: 'Post fetched.',
            post: post,
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }

    // Post.findById(postId)
    //     .then((post) => {
    //         if (!post) {
    //             const error = new Error('Could not find post');
    //             error.statusCode = 404;
    //             throw error;
    //         }

    //         res.status(200).json({
    //             message: 'Post fetched.',
    //             post: post,
    //         });
    //     })
    //     .catch((err) => {
    //         if (!err.statusCode) {
    //             err.statusCode = 500;
    //         }
    //         next(err);
    //     });
};

exports.getPosts = async (req, res, next) => {
    const currentPage = req.query.page || 1;
    const itemsPerPage = 2;

    try {
        const totalItems = await Post.find().countDocuments();
        const posts = await Post.find()
            .populate('creator')
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * itemsPerPage)
            .limit(itemsPerPage);
        res.status(200).json({
            message: 'Fetched posts successfully.',
            posts: posts,
            totalItems: totalItems,
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }

    // Post.find()
    //     .countDocuments()
    //     .then((count) => {
    //         totalItems = count;
    //         return Post.find()
    //             .skip((currentPage - 1) * itemsPerPage)
    //             .limit(itemsPerPage);
    //     })
    //     .then((posts) => {
    //         res.status(200).json({
    //             message: 'Fetched posts successfully.',
    //             posts: posts,
    //             totalItems: totalItems,
    //         });
    //     })
    //     .catch((err) => {
    //         if (!err.statusCode) {
    //             err.statusCode = 500;
    //         }
    //         next(err);
    //     });
};

exports.createPost = async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const error = new Error(
            'Validation failed, entered data is incorrect!'
        );
        error.statusCode = 422;
        throw error;
    }

    if (!req.file) {
        const error = new Error('No image provided');
        error.statusCode = 422;
        throw error;
    }

    const title = req.body.title;
    const content = req.body.content;
    const imageUrl = req.file.path;
    let creator;

    const post = new Post({
        title: title,
        content: content,
        imageUrl: imageUrl,
        creator: req.userId,
    });

    try {
        await post.save();
        const user = await User.findById(req.userId);
        creator = user;
        user.posts.push(post);
        await user.save();
        res.status(201).json({
            message: 'Post created successfullt!',
            post: post,
            creator: {
                _id: creator._id,
                name: creator.name,
            },
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }

    // post.save()
    //     .then((result) => {
    //         return User.findById(req.userId);
    //     })
    //     .then((user) => {
    //         creator = user;
    //         user.posts.push(post);
    //         return user.save();
    //     })
    //     .then((result) => {
    //         res.status(201).json({
    //             message: 'Post created successfullt!',
    //             post: post,
    //             creator: {
    //                 _id: creator._id,
    //                 name: creator.name,
    //             },
    //         });
    //     })
    //     .catch((err) => {
    //         if (!err.statusCode) {
    //             err.statusCode = 500;
    //         }
    //         next(err);
    //     });
};

exports.updatePost = async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const error = new Error(
            'Validation failed, entered data is incorrect!'
        );
        error.statusCode = 422;
        throw error;
    }

    const postId = req.params.postId;
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image;

    if (req.file) {
        imageUrl = req.file.path;
    }

    if (!imageUrl) {
        const error = new Error('No image file pciked.');
        error.statusCode = 404;
        throw error;
    }

    try {
        const post = await Post.findById(postId).populate('creator');
        if (!post) {
            const error = new Error('No post found.');
            error.statusCode = 404;
            throw error;
        }

        if (post.creator._id.toString() !== req.userId) {
            const error = new Error('Not authorized.');
            error.statusCode = 403;
            throw error;
        }

        if (imageUrl !== post.imageUrl) {
            clearImage(post.imageUrl);
        }

        post.title = title;
        post.imageUrl = imageUrl;
        post.content = content;

        const savePost = await post.save();
        res.status(200).json({
            message: 'Post updated.',
            post: savePost,
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }

    // Post.findById(postId)
    //     .then((post) => {
    //         if (!post) {
    //             const error = new Error('No post found.');
    //             error.statusCode = 404;
    //             throw error;
    //         }

    //         if (post.creator.toString() !== req.userId) {
    //             const error = new Error('Not authorized.');
    //             error.statusCode = 403;
    //             throw error;
    //         }

    //         if (imageUrl !== post.imageUrl) {
    //             clearImage(post.imageUrl);
    //         }

    //         post.title = title;
    //         post.imageUrl = imageUrl;
    //         post.content = content;
    //         return post.save();
    //     })
    //     .then((result) => {
    //         res.status(200).json({
    //             message: 'Post updated.',
    //             post: result,
    //         });
    //     })
    //     .catch((err) => {
    //         if (!err.statusCode) {
    //             err.statusCode = 500;
    //         }
    //         next(err);
    //     });
};

exports.deletePost = async (req, res, next) => {
    const postId = req.params.postId;

    try {
        const post = await Post.findById(postId);
        if (post.creator.toString() !== req.userId) {
            const error = new Error('Not authorized.');
            error.statusCode = 403;
            throw error;
        }

        if (!post) {
            const error = new Error('No post found.');
            error.statusCode = 404;
            throw error;
        }

        await Post.deleteOne(postId);
        clearImage(post.imageUrl);
        const user = await User.findById(req.userId);
        user.posts.pull(postId);
        await user.save();
        res.status(200).json({
            message: 'Post deleted successfully.',
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }

    // Post.findById(postId)
    //     .then((post) => {
    //         if (post.creator.toString() !== req.userId) {
    //             const error = new Error('Not authorized.');
    //             error.statusCode = 403;
    //             throw error;
    //         }

    //         if (!post) {
    //             const error = new Error('No post found.');
    //             error.statusCode = 404;
    //             throw error;
    //         }

    //         clearImage(post.imageUrl);
    //         return Post.findById(postId).remove();
    //     })
    //     .then(() => {
    //         return User.findById(req.userId);
    //     })
    //     .then((user) => {
    //         user.posts.pull(postId);
    //         return user.save();
    //     })
    //     .then(() => {
    //         res.status(200).json({
    //             message: 'Post deleted successfully.',
    //         });
    //     })
    //     .catch((err) => {
    //         if (!err.statusCode) {
    //             err.statusCode = 500;
    //         }
    //         next(err);
    //     });
};
