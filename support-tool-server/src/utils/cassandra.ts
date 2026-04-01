import { Client } from 'cassandra-driver';
import dotenv from 'dotenv';

dotenv.config();

const cassandraClient = new Client({
    contactPoints: [process.env.CASSANDRA_HOST!],
    localDataCenter: process.env.CASSANDRA_DATACENTER!,
    keyspace: process.env.CASSANDRA_KEYSPACE!
});

// Separate Cassandra client for qmzbm_form_service keyspace (forms module)
const cassandraFormClient = new Client({
    contactPoints: [process.env.CASSANDRA_FORM_HOST || process.env.CASSANDRA_HOST!],
    localDataCenter: process.env.CASSANDRA_FORM_DATACENTER || process.env.CASSANDRA_DATACENTER!,
    keyspace: 'qmzbm_form_service'
});

export async function connectCassandra() {
    try {
        await cassandraClient.connect();
        console.log('Successfully connected to Cassandra (sunbird)');
    } catch (error) {
        console.error('Cassandra (sunbird) connection error:', error);
    }

    try {
        await cassandraFormClient.connect();
        console.log('Successfully connected to Cassandra (qmzbm_form_service)');
    } catch (error) {
        console.error('Cassandra (qmzbm_form_service) connection error:', error);
    }

    return cassandraClient;
}

export { cassandraClient, cassandraFormClient };