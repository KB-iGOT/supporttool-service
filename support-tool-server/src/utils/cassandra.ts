import { Client } from 'cassandra-driver';
import dotenv from 'dotenv';

dotenv.config();

const cassandraClient = new Client({
    contactPoints: [process.env.CASSANDRA_HOST!],
    localDataCenter: process.env.CASSANDRA_DATACENTER!,
    keyspace: process.env.CASSANDRA_KEYSPACE!,
    socketOptions: {
        connectTimeout: 15000, // 15 seconds
        readTimeout: 12000 // 12 seconds
    },
});

export async function connectCassandra() {
    try {
        await cassandraClient.connect();
        console.log('Successfully connected to Cassandra');
    } catch (error) {
        console.error('Cassandra connection error:', error);
        throw error;
    }
}

export { cassandraClient };