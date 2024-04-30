const AWS = require('aws-sdk');

const docClient = new AWS.DynamoDB.DocumentClient({ region: 'us-west-2' }); // Replace with your region

// TODO modify to be able to accept an array of duplet 
const sourceTableName = 'source-table-name'; // Replace with your source table name
const destinationTableName = 'destination-table-name'; // Replace with your destination table name

// Batch size for writing to DynamoDB
const BATCH_WRITE_SIZE = 25; // You can adjust this based on your needs

async function migrateData() {
  let lastEvaluatedKey;

  do {
    const params = {
      TableName: sourceTableName,
      Limit: BATCH_WRITE_SIZE,
      ExclusiveStartKey: lastEvaluatedKey,
    };

    const scanResult = await docClient.scan(params).promise();

    if (!scanResult.Items.length) {
      console.log('No more items to migrate.');
      break;
    }

    const writeRequests = scanResult.Items.map(item => ({
      PutRequest: {
        Item: item,
      },
    }));

    await docClient.batchWrite({ RequestItems: { [destinationTableName]: writeRequests } }).promise();

    lastEvaluatedKey = scanResult.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  console.log('Data migration completed successfully!');
}

migrateData()
  .then(() => console.log('Migration completed.'))
  .catch(error => console.error('Error migrating data:', error));
