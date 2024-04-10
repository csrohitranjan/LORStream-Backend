import mongoose from "mongoose";
const { Schema } = mongoose;



const lorSchema = new mongoose.Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    referenceNumber: {
        type: String,
        unique: true,
        sparse: true
    },
    recipient: {
        type: String
    },
    recipientDepartment: {
        type: String
    },
    companyName: {
        type: String,
        required: true
    },
    companyAddress: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    lorPdfLink: {
        type: String
    },
    approvedBy: {
        type: String
    },
    reasonOfRejection: {
        type: String
    }
}, { timestamps: true });




export const Lor = mongoose.model("Lor", lorSchema)