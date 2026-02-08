const mongoose = require('mongoose');


const dataRecordSchema = new mongoose.Schema({
    recordId: {
        type: String,
        required: [true, 'Record ID is required'],
        unique: true,
        index: true,
        trim: true
    },
    timestamp: {
        type: Date,
        required: [true, 'Timestamp is required'],
        index: true,
        default: Date.now
    },
    temperature: {
        type: Number,
        required: [true, 'Temperature is required'],
        min: [-50, 'Temperature cannot be below -50°C'],
        max: [150, 'Temperature cannot exceed 150°C']
    },
    humidity: {
        type: Number,
        required: [true, 'Humidity is required'],
        min: [0, 'Humidity cannot be below 0%'],
        max: [100, 'Humidity cannot exceed 100%']
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true,
        minlength: [1, 'Location cannot be empty']
    },
    status: {
        type: String,
        required: [true, 'Status is required'],
        enum: {
            values: ['active', 'inactive', 'error'],
            message: 'Status must be one of: active, inactive, error'
        },
        default: 'active'
    },
    metadata: {
        source: {
            type: String,
            default: 'api'
        },
        version: {
            type: String,
            default: '1.0'
        }
    }
}, {
    timestamps: true,
    collection: 'datarecords'
});

dataRecordSchema.index({ status: 1, timestamp: -1 });

dataRecordSchema.index({ timestamp: -1 });

dataRecordSchema.virtual('temperatureFahrenheit').get(function () {
    return (this.temperature * 9 / 5) + 32;
});

dataRecordSchema.methods.isNormalReading = function () {
    return this.temperature >= 18 && this.temperature <= 30 &&
        this.humidity >= 30 && this.humidity <= 70 &&
        this.status === 'active';
};

dataRecordSchema.statics.getRecentRecords = async function (limit = 100) {
    return this.find()
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean()
        .exec();
};

dataRecordSchema.statics.getByStatus = async function (status, limit = 100) {
    return this.find({ status })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean()
        .exec();
};

dataRecordSchema.pre('save', function (next) {
    console.log(`Saving record: ${this.recordId} at ${this.location}`);
    next();
});

const DataRecord = mongoose.model('DataRecord', dataRecordSchema);

module.exports = DataRecord;
