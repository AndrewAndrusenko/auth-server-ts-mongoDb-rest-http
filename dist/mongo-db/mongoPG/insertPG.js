// MongoDB Playground
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.

// The current database to use.
use('local');

// Create a new document in the collection.
db.getCollection('auth-users-data').insertOne({
    userId: "test1",
    password: "test1"
});
