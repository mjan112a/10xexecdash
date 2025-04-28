// MongoDB Playground
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.

// The current database to use.
use("10x");

// Find a document in a collection.
db.getCollection("Prompt").find({
  "isLatest": true
}); 