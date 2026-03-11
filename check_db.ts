import mariadb from 'mariadb';

async function main() {
    const pool = mariadb.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'agriskills',
        port: 3306,
    });

    try {
        const conn = await pool.getConnection();
        console.log("Got connection, trying to DROP DATABASE agriskills...");
        await conn.query('DROP DATABASE IF EXISTS agriskills;');
        console.log("DROPPED DATABASE!");

        console.log("Recreating...");
        await conn.query('CREATE DATABASE agriskills;');
        console.log("CREATED DATABASE!");

        conn.release();
    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
}

main();
