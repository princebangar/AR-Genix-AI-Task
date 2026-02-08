
const locations = ['New York', 'London', 'Tokyo', 'Mumbai', 'Sydney', 'Berlin', 'Paris', 'Toronto'];
const statuses = ['active', 'inactive', 'error'];

function generateRecord(index) {
    const now = new Date();
    const randomOffset = Math.floor(Math.random() * 86400000); // Random time in last 24 hours

    return {
        recordId: `REC-${String(index).padStart(6, '0')}`,
        timestamp: new Date(now.getTime() - randomOffset),
        temperature: Math.round((Math.random() * 60 - 10) * 100) / 100, // -10 to 50°C
        humidity: Math.round(Math.random() * 100 * 100) / 100, // 0 to 100%
        location: locations[Math.floor(Math.random() * locations.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)], // Random status
        metadata: {
            source: 'generator',
            version: '1.0'
        }
    };
}


function generateRecords(count = 5000) {
    const records = [];

    console.log(`Generating ${count} records...`);

    for (let i = 1; i <= count; i++) {
        records.push(generateRecord(i));

        if (i % 1000 === 0) {
            console.log(`Generated ${i}/${count} records`);
        }
    }

    console.log(`✅ Generated ${count} records successfully`);
    return records;
}


function* generateRecordsBatched(totalCount = 5000, batchSize = 1000) {
    let generated = 0;

    while (generated < totalCount) {
        const currentBatchSize = Math.min(batchSize, totalCount - generated);
        const batch = [];

        for (let i = 0; i < currentBatchSize; i++) {
            batch.push(generateRecord(generated + i + 1));
        }

        generated += currentBatchSize;
        yield batch;
    }
}

module.exports = {
    generateRecord,
    generateRecords,
    generateRecordsBatched
};
