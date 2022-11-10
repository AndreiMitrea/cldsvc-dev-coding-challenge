import connect, {sql} from '@databases/sqlite';

const db = connect();

try {
    db.query(sql`
        CREATE TABLE order_book(
            id VARCHAR NOT NULL PRIMARY KEY,
            amount INTEGER NOT NULL,
            price INTEGER NOT NULL
        )
    `);
} catch (ex) {

}

export default db;

