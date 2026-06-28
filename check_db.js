const Database = require('better-sqlite3');
const db = new Database('gb64.sqlite');

try {
    const ratingsOfClassics = db.prepare("SELECT Rating, COUNT(*) as count FROM Games WHERE Classic = 'True' GROUP BY Rating").all();
    console.log('--- Ratings of Classics ---');
    console.log(JSON.stringify(ratingsOfClassics, null, 2));

    const highRatings = db.prepare("SELECT Rating, COUNT(*) as count FROM Games WHERE Rating >= 5 GROUP BY Rating").all();
    console.log('--- High Ratings stats ---');
    console.log(JSON.stringify(highRatings, null, 2));

} catch (err) {
    console.error(err);
} finally {
    db.close();
}
