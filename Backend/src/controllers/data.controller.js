const DataRecord = require('../models/DataRecord');
const { generateRecords, generateRecordsBatched } = require('../utils/dataGenerator');

exports.ingestData = async (req, res) => {
    try {
        const data = req.body;

        const isArray = Array.isArray(data);
        const records = isArray ? data : [data];

        const savedRecords = [];
        const errors = [];

        for (let i = 0; i < records.length; i++) {
            try {
                const record = new DataRecord(records[i]);
                const saved = await record.save();
                savedRecords.push(saved);
            } catch (error) {
                errors.push({
                    index: i,
                    record: records[i],
                    error: error.message
                });
            }
        }

        res.status(201).json({
            success: true,
            message: `Ingested ${savedRecords.length} record(s)`,
            data: {
                saved: savedRecords.length,
                failed: errors.length,
                errors: errors.length > 0 ? errors : undefined
            }
        });

    } catch (error) {
        console.error('Error ingesting data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to ingest data',
            message: error.message
        });
    }
};

exports.getRecords = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 100,
            status,
            sortBy = 'timestamp',
            order = 'desc'
        } = req.query;

        const query = {};
        if (status) {
            query.status = status;
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const sort = {};
        sort[sortBy] = order === 'asc' ? 1 : -1;

        const [records, total] = await Promise.all([
            DataRecord.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limitNum)
                .lean()
                .exec(),
            DataRecord.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            data: records,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum)
            }
        });

    } catch (error) {
        console.error('Error fetching records:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch records',
            message: error.message
        });
    }
};

exports.generateTestData = async (req, res) => {
    try {
        const { count = 5000, batchSize = 1000 } = req.body;

        const startTime = Date.now();
        let totalInserted = 0;

        const generator = generateRecordsBatched(count, batchSize);

        for (const batch of generator) {
            try {
                await DataRecord.insertMany(batch, { ordered: false });
                totalInserted += batch.length;
                console.log(`Inserted ${totalInserted}/${count} records`);
            } catch (error) {
                if (error.code === 11000) {
                    console.warn('Some records already exist, skipping duplicates');
                } else {
                    throw error;
                }
            }
        }

        const duration = Date.now() - startTime;

        res.status(201).json({
            success: true,
            message: 'Test data generated successfully',
            data: {
                inserted: totalInserted,
                duration: `${duration}ms`,
                ratePerSecond: Math.round(totalInserted / (duration / 1000))
            }
        });

    } catch (error) {
        console.error('Error generating test data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate test data',
            message: error.message
        });
    }
};

exports.getStats = async (req, res) => {
    try {
        const [total, statusCounts, avgTemp, avgHumidity] = await Promise.all([
            DataRecord.countDocuments(),
            DataRecord.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            DataRecord.aggregate([
                { $group: { _id: null, avg: { $avg: '$temperature' } } }
            ]),
            DataRecord.aggregate([
                { $group: { _id: null, avg: { $avg: '$humidity' } } }
            ])
        ]);

        res.status(200).json({
            success: true,
            data: {
                total,
                byStatus: statusCounts.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                averageTemperature: avgTemp[0]?.avg || 0,
                averageHumidity: avgHumidity[0]?.avg || 0
            }
        });

    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch statistics',
            message: error.message
        });
    }
};

exports.deleteAllRecords = async (req, res) => {
    try {
        const result = await DataRecord.deleteMany({});

        res.status(200).json({
            success: true,
            message: `Deleted ${result.deletedCount} records`
        });

    } catch (error) {
        console.error('Error deleting records:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete records',
            message: error.message
        });
    }
};
