import { Client } from 'cassandra-driver';
import dotenv from 'dotenv';

dotenv.config();

const cassandraClient = new Client({
    contactPoints: [process.env.CASSANDRA_HOST!],
    localDataCenter: process.env.CASSANDRA_DATACENTER!,
    keyspace: process.env.CASSANDRA_KEYSPACE!
});

export async function connectCassandra() {
    try {
        await cassandraClient.connect();
        console.log('Successfully connected to Cassandra');
        return cassandraClient;
    } catch (error) {
        console.error('Cassandra connection error:', error);
        throw error;
    }
}

export { cassandraClient };