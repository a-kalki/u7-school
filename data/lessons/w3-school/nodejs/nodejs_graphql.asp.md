# Node.js GraphQL

* * *

## What is GraphQL?

GraphQL is a query language for APIs and a runtime for executing those queries against your data. It was developed by Facebook in 2012 and publicly released in 2015.

### Key Features

*   **Client-specified queries**: Request exactly what you need, nothing more
*   **Single endpoint**: Access all resources through one endpoint
*   **Strongly typed**: Clear schema defines available data and operations
*   **Hierarchical**: Queries match the shape of your data
*   **Self-documenting**: Schema serves as documentation

**Note:** Unlike REST, GraphQL lets clients specify exactly what data they need, reducing over-fetching and under-fetching of data.

* * *

## Getting Started with GraphQL in Node.js

### Prerequisites

*   Node.js installed (v14 or later recommended)
*   Basic knowledge of JavaScript and Node.js
*   npm or yarn package manager

* * *

### Step 1: Set Up a New Project

```javascript
mkdir graphql-servercd graphql-servernpm init -y
```

### Step 2: Install Required Packages

```javascript
npm install express express-graphql graphql
```

* * *

* * *

### Step 3: Create a Basic GraphQL Server

#### 3.1 Define Your Data Model

```javascript
const express = require('express');const { graphqlHTTP } = require('express-graphql');const { buildSchema } = require('graphql');// Sample dataconst books = [  {    id: '1',    title: 'The Great Gatsby',    author: 'F. Scott Fitzgerald',    year: 1925,    genre: 'Novel'  },  {    id: '2',    title: 'To Kill a Mockingbird',    author: 'Harper Lee',    year: 1960,    genre: 'Southern Gothic'  }];
```

#### 3.2 Define the GraphQL Schema

```javascript
// Define the schema using GraphQL schema languageconst schema = buildSchema(`  # A book has a title, author, and publication year  type Book {    id: ID!    title: String!    author: String!    year: Int    genre: String  }  # The "Query" type is the root of all GraphQL queries  type Query {    # Get all books    books: [Book!]!    # Get a specific book by ID    book(id: ID!): Book    # Search books by title or author    searchBooks(query: String!): [Book!]!  }`);
```

#### 3.3 Implement Resolvers

```javascript
// Define resolvers for the schema fieldsconst root = {  // Resolver for fetching all books  books: () => books,    // Resolver for fetching a single book by ID  book: ({ id }) => books.find(book => book.id === id),    // Resolver for searching books  searchBooks: ({ query }) => {    const searchTerm = query.toLowerCase();    return books.filter(      book =>        book.title.toLowerCase().includes(searchTerm) ||        book.author.toLowerCase().includes(searchTerm)    );  }};
```

#### 3.4 Set Up the Express Server

```javascript
// Create an Express appconst app = express();// Set up the GraphQL endpointapp.use('/graphql', graphqlHTTP({  schema: schema,  rootValue: root,  // Enable the GraphiQL interface for testing  graphiql: true,}));// Start the serverconst PORT = 4000;app.listen(PORT, () => {  console.log(`Server running at http://localhost:${PORT}/graphql`);});
```

### Step 4: Run and Test Your GraphQL Server

#### 4.1 Start the Server

```javascript
node server.js
```

#### 4.2 Test with GraphiQL

Open your browser and navigate to `http://localhost:4000/graphql` to access the GraphiQL interface.

##### Example Query: Get All Books

```javascript
{  books {    id    title    author    year  }}
```

##### Example Query: Get a Single Book

```javascript
{  book(id: "1") {    title    author    genre  }}
```

##### Example Query: Search Books

```javascript
{  searchBooks(query: "Gatsby") {    title    author    year  }}
```

* * *

## Handling Mutations

Mutations are used to modify data on the server. Let's add the ability to add, update, and delete books.

### 1\. Update the Schema

```javascript
const schema = buildSchema(`  # ... (previous types remain the same) ...  # Input type for adding/updating books  input BookInput {    title: String    author: String    year: Int    genre: String  }  type Mutation {    # Add a new book    addBook(input: BookInput!): Book!    # Update an existing book    updateBook(id: ID!, input: BookInput!): Book    # Delete a book    deleteBook(id: ID!): Boolean  }`);
```

### 2\. Implement Mutation Resolvers

```javascript
const root = {  // ... (previous query resolvers remain the same) ...  // Mutation resolvers  addBook: ({ input }) => {    const newBook = {      id: String(books.length + 1),      ...input    }    books.push(newBook);    return newBook;  },  updateBook: ({ id, input }) => {    const bookIndex = books.findIndex(book => book.id === id);    if (bookIndex === -1) return null;    const updatedBook = {      ...books[bookIndex],      ...input    }    books[bookIndex] = updatedBook;    return updatedBook;  },  deleteBook: ({ id }) => {    const bookIndex = books.findIndex(book => book.id === id);    if (bookIndex === -1) return false;    books.splice(bookIndex, 1);    return true;  }};
```

### 3\. Testing Mutations

#### Add a New Book

```javascript
mutation {  addBook(input: {    title: "1984"    author: "George Orwell"    year: 1949    genre: "Dystopian"  }) {    id    title    author  }}
```

#### Update a Book

```javascript
mutation {  updateBook(    id: "1"    input: { year: 1926 }  ) {    title    year  }}
```

#### Delete a Book

```javascript
mutation {  deleteBook(id: "2")}
```

* * *

## Best Practices

### 1\. Error Handling

```javascript
const root = {  book: ({ id }) => {    const book = books.find(book => book.id === id);    if (!book) {      throw new Error('Book not found');    }    return book;  },  // ... other resolvers}
```

### 2\. Data Validation

Validate input data before processing:

```javascript
const { GraphQLError } = require('graphql');const root = {  addBook: ({ input }) => {    if (input.year && (input.year < 0 || input.year > new Date().getFullYear() + 1)) {      throw new GraphQLError('Invalid publication year', {        extensions: { code: 'BAD_USER_INPUT' }      }    }    // ... rest of the resolver  }};
```

### 3\. N+1 Problem

Use DataLoader to batch and cache database queries:

```javascript
npm install dataloader
```
```javascript
const DataLoader = require('dataloader');// Create a loader for booksconst bookLoader = new DataLoader(async (ids) => {  // This would be a database query in a real app  return ids.map(id => books.find(book => book.id === id));});const root = {  book: ({ id }) => bookLoader.load(id),  // ... other resolvers};
```

* * *

## Next Steps

*   Connect to a real database (MongoDB, PostgreSQL, etc.)
*   Implement authentication and authorization
*   Add subscriptions for real-time updates
*   Explore Apollo Server for more advanced features
*   Learn about schema stitching and federation for microservices

**Tip:** Always use variables in your GraphQL operations for better reusability and security.

* * *

## GraphQL Schemas and Types

GraphQL schemas define the structure of your API and the types of data that can be requested.

### Type System

GraphQL uses a type system to define the shape of your data. Here are the basic scalar types:

Type

Description

Example

Int

Signed 32-bit integer

`42`

Float

Signed double-precision floating-point value

`3.14`

String

UTF-8 character sequence

`"Hello, GraphQL!"`

Boolean

true or false

`true`, `false`

ID

Unique identifier, serialized as a String

`"5f8a8d8e8f8c8d8b8a8e8f8c"`

* * *

* * *