const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

exports.signup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errors = new Error('Validation failed');
        errors.statusCode = 422;
        errors.data = errors.array();
        throw errors;
    }

    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;

    try {
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({
            email: email,
            name: name,
            password: hashedPassword,
        });
        const saveUser = await user.save();
        res.status(201).json({
            message: 'User created',
            userId: saveUser._id,
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }

    // bcrypt
    //     .hash(password, 12)
    //     .then((hashedPassword) => {
    //         const user = new User({
    //             email: email,
    //             name: name,
    //             password: hashedPassword,
    //         });
    //         return user.save();
    //     })
    //     .then((result) => {
    //         res.status(201).json({
    //             message: 'User created',
    //             userId: result._id,
    //         });
    //     })
    //     .catch((err) => {
    //         if (!err.statusCode) {
    //             err.statusCode = 500;
    //         }
    //         next(err);
    //     });
};

exports.login = async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    try {
        const user = await User.findOne({ email: email });
        if (!user) {
            const error = new Error('User could not be found.');
            error.statusCode = 401;
            throw error;
        }
        const isEqual = await bcrypt.compare(password, user.password);
        if (!isEqual) {
            const error = new Error('Wrong password.');
            error.statusCode = 401;
            throw error;
        }
        const token = jwt.sign(
            {
                email: user.email,
                userId: user._id,
            },
            'somesupuersupersecretsecretkeylol',
            { expiresIn: '1h' }
        );
        res.status(200).json({
            token: token,
            userId: user._id,
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }

    // User.findOne({ email: email })
    //     .then((user) => {
    //         if (!user) {
    //             const error = new Error('User could not be found.');
    //             error.statusCode = 401;
    //             throw error;
    //         }
    //         loadedUser = user;
    //         return bcrypt.compare(password, user.password);
    //     })
    //     .then((isEqual) => {
    //         if (!isEqual) {
    //             const error = new Error('Wrong password.');
    //             error.statusCode = 401;
    //             throw error;
    //         }
    //         const token = jwt.sign(
    //             {
    //                 email: loadedUser.email,
    //                 userId: loadedUser._id,
    //             },
    //             'somesupuersupersecretsecretkeylol',
    //             { expiresIn: '1h' }
    //         );
    //         res.status(200).json({
    //             token: token,
    //             userId: loadedUser._id,
    //         });
    //     })
    //     .catch((err) => {
    //         if (!err.statusCode) {
    //             err.statusCode = 500;
    //         }
    //         next(err);
    //     });
};

exports.getStatus = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            const error = new Error('No user found.');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({
            status: user.status,
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }

    // User.findById(req.userId)
    //     .then((user) => {
    //         if (!user) {
    //             const error = new Error('No user found.');
    //             error.statusCode = 404;
    //             throw error;
    //         }
    //         res.status(200).json({
    //             status: user.status,
    //         });
    //     })
    //     .catch((err) => {
    //         if (!err.statusCode) {
    //             err.statusCode = 500;
    //         }
    //         next(err);
    //     });
};

exports.updateStatus = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            const error = new Error('No user found.');
            error.statusCode = 404;
            throw error;
        }
        user.status = req.body.status;
        await user.save();
        res.status(200).json({
            message: 'Status updated.',
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }

    // User.findById(req.userId)
    //     .then((user) => {
    //         if (!user) {
    //             const error = new Error('No user found.');
    //             error.statusCode = 404;
    //             throw error;
    //         }
    //         user.status = req.body.status;
    //         return user.save();
    //     })
    //     .then((user) => {
    //         res.status(200).json({
    //             message: 'Status updated.',
    //         });
    //     })
    //     .catch((err) => {
    //         if (!err.statusCode) {
    //             err.statusCode = 500;
    //         }
    //         next(err);
    //     });
};
