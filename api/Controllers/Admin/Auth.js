const Admin = require('../../../models/Admin')
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const checkId = require('../../Middleware/mongooseId')


const Index = async (req, res, next) => {
    try {
        const admins = await Admin.find({}, { password: 0, access_token: 0 }).sort({ _id: -1 })
        if (!admins) {
            return res.status(204).json({ message: 'Admin not found' })
        }
        res.status(200).json({ admins })
    } catch (error) {
        next(error)
    }
}

const register = async (req, res, next) => {
    let { name, email, phoneNumber, password, role } = req.body
    try {
        let existAdmin = await Admin.findOne({ $or: [{ email: email }, { phoneNumber: phoneNumber }] })

        if (existAdmin) {
            return res.status(409).json({
                message: "Admin already created"
            })
        }

        let hashPassword = await bcrypt.hash(password, 10)
        let newAdmin = new Admin({
            name: name,
            email: email,
            phoneNumber: phoneNumber,
            password: hashPassword,
            role: role
        })

        const admin = await newAdmin.save()
        if (admin) {
            return res.status(201).json({
                message: true
            })
        }

    } catch (error) {
        if (error.name == 'ValidationError') {
            let message = []
            for (field in error.errors) {
                message.push(error.errors[field].message)
            }

            return res.status(500).json({
                success: false,
                message
            })
        }

        next(error)
    }
}


// Login
const login = async (req, res, next) => {
    let { email, password } = req.body
    try {
        let admin = await Admin.findOne({$and: [{ email: email }, { status: {$ne: 'blocked'} }]}).exec()
        if (admin) {
            const result = await bcrypt.compare(password, admin.password)
            if (result) {
                const token = await jwt.sign({ id: admin._id, name: admin.name, email: admin.email, role: admin.role }, 'SECRET', { expiresIn: '1d' })
                const updateToken = await Admin.findOneAndUpdate({ _id: admin._id }, { $set: { 'access_token': token, 'status': 'online' } }, { new: true }).exec()
                if (updateToken) {
                    return res.status(200).json({
                        message: true,
                        token
                    })
                }
                return res.status(204).json({ message: false })

            }
            return res.status(204).json({ message: false })

        }
        res.status(204).json({ message: false })

    } catch (error) {
        next(error)
    }
}


// Password Reset
const passwordReset = async (req, res, next) => {
    res.send("Password Reset Controller")
}


// Show
const Show = async (req, res, next) => {
    let { id } = req.params
    try {
        await checkId(id)
        let admin = await Admin.findOne({ _id: id }).exec()
        if (!admin) {
            return res.status(204).json({ message: false })
        }

        res.status(200).json({
            message: true,
            admin
        })

    } catch (error) {
        next(error)
    }
}


// Logout
const logout = async (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1]
        const decode = jwt.verify(token, 'SECRET')

        let admin = await Admin.findOne({ $and: [{ _id: decode.id }, { email: decode.email }, { role: decode.role }] })
        if (!admin) {
            return res.status(204).json({ message: false })
        }

        const updateToken = await Admin.findByIdAndUpdate({ _id: decode.id }, { $set: { 'access_token': null } })
        if (!updateToken) {
            return res.status(401).json({ message: false })
        }
        res.status(200).json({ message: true })

    } catch (error) {
        next(error)
    }
}


// Block Account
const blockAccount = async (req, res, next) => {
    const { id } = req.params
    const { status } = req.query
    try {
        await checkId(id)
        const admin = await Admin.findByIdAndUpdate({ _id: id },
            { $set: { status } },
            { new: true }
        ).exec()

        if (!admin) {
            return res.status(204).json({ message: false })
        }
        res.status(200).json({ message: true })

    } catch (error) {
        next(error)
    }
}


// Update Account
const updateAccount = async (req, res, next) => {
    let { id } = req.params
    let { name, email, phoneNumber, role } = req.body
    try {
        await checkId(id)
        const admin = await Admin.findOneAndUpdate({ _id: id },
            { $set: { name, email, phoneNumber, role } },
            { new: true }
        ).exec()

        if (!admin) {
            return res.status(204).json({ message: false })
        }
        res.status(200).json({ message: true })

    } catch (error) {
        next(error)
    }
}

module.exports = {
    Index,
    register,
    login,
    Show,
    passwordReset,
    logout,
    blockAccount,
    updateAccount
}