# Student Management REST API

Lab Assignment 2 – Web Dev III (Node.js & Express Backend), Unit 2.

A simple REST API built with Express.js to perform CRUD operations on student records.
The data is stored in a normal JavaScript array in memory — no database is used.

## Technology Used

- Node.js
- Express.js
- Postman (for testing)

## Folder Structure

```
student-management-api/
├── app.js                     # main server file
├── routes/
│   └── studentRoutes.js       # all student routes (Express Router)
├── middleware/
│   └── logger.js              # custom logger middleware
├── data/
│   └── students.js            # student data stored in an array
├── package.json
└── README.md
```

## How to Run

1. Install the packages:

```bash
npm install
```

2. Start the server:

```bash
npm start
```

3. The server will start on:

```
http://localhost:3000
```

## API Endpoints

| Method | Endpoint        | Description            |
| ------ | --------------- | ---------------------- |
| GET    | /students       | Get all students       |
| GET    | /students/:id   | Get a single student   |
| POST   | /students       | Add a new student      |
| PUT    | /students/:id   | Update a student       |
| DELETE | /students/:id   | Delete a student       |

### Sample body for POST /students

```json
{
  "name": "Sneha",
  "course": "MCA",
  "age": 22
}
```

### Sample body for PUT /students/1

```json
{
  "course": "BTech"
}
```

## Status Codes Used

| Code | Meaning                                       |
| ---- | --------------------------------------------- |
| 200  | Success (GET, PUT, DELETE)                    |
| 201  | Created (POST)                                |
| 400  | Bad Request (missing fields / invalid id)     |
| 404  | Not Found (student id or route does not exist)|
| 500  | Internal Server Error                         |

## Testing in Postman

1. Open Postman.
2. Import `postman_collection.json` from this project (File → Import).
3. Make sure the server is running, then send each request one by one.

For POST and PUT requests, select **Body → raw → JSON** before sending.
