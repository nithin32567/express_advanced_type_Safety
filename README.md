# Authentication Express

A complete authentication backend built with Node.js, Express 5, TypeScript, MongoDB, Mongoose, bcrypt, JWT, dotenv, cors, and simple HTML pages.

The backend source is written in TypeScript and runs as native ECMAScript Modules. It supports signup, signin, JWT-protected user data, and browser logout through `localStorage`.

## Stack

- Node.js with native ESM
- Express 5
- TypeScript with `strict` and `module: "nodenext"`
- MongoDB and Mongoose
- bcrypt password hashing
- JSON Web Tokens
- dotenv and cors
- HTML, CSS, and browser JavaScript for the pages

## Project Structure

```text
.
├── .env
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
├── src/
│   ├── server.ts
│   ├── config/
│   │   ├── db.ts
│   │   └── env.ts
│   ├── controllers/
│   │   └── auth.controller.ts
│   ├── middleware/
│   │   └── auth.middleware.ts
│   ├── models/
│   │   └── user.model.ts
│   ├── routes/
│   │   └── auth.routes.ts
│   └── types/
│       ├── auth.types.ts
│       └── express.d.ts
└── views/
    ├── signup.html
    ├── signin.html
    └── protected.html
```

## Installation

```bash
npm install
```

## Environment

Copy `.env.example` to `.env` and set real values:

```env
PORT=5000
DB_URI=mongodb://127.0.0.1:27017/authentication-express
JWT_SECRET=replace_with_a_strong_secret
```

`DB_URI` and `JWT_SECRET` are required at startup. `PORT` defaults to `5000`.

## MongoDB

Run MongoDB locally, for example:

```bash
mongod
```

Then use a matching `DB_URI`, such as:

```env
DB_URI=mongodb://127.0.0.1:27017/authentication-express
```

## Commands

```bash
npm run dev        # run src/server.ts with tsx watch
npm run typecheck  # check TypeScript without output
npm run build      # compile to dist/
npm start          # run node dist/server.js
npm run clean      # remove dist/
```

## Pages

- `GET /` redirects to `/signup`
- `GET /signup`
- `GET /signin`
- `GET /protected-page`

## API Endpoints

### Signup

```http
POST /api/auth/signup
Content-Type: application/json
```

```json
{
  "name": "Nithin",
  "email": "nithin@example.com",
  "password": "Password123",
  "age": 25,
  "phoneNumber": "9876543210"
}
```

Response:

```json
{
  "success": true,
  "message": "Signup successful",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "Nithin",
    "email": "nithin@example.com",
    "age": 25,
    "phoneNumber": "9876543210"
  }
}
```

### Signin

```http
POST /api/auth/signin
Content-Type: application/json
```

```json
{
  "email": "nithin@example.com",
  "password": "Password123"
}
```

Invalid credentials always return a generic `Invalid email or password` message.

### Protected Route

```http
GET /api/auth/protected
Authorization: Bearer <token>
```

Response:

```json
{
  "success": true,
  "message": "You are authorized to access this protected route",
  "user": {
    "id": "user_id",
    "name": "Nithin",
    "email": "nithin@example.com",
    "age": 25,
    "phoneNumber": "9876543210"
  }
}
```

## Authentication Flow

Signup validates input, checks for duplicate email, creates a Mongoose user, hashes the password in a pre-save hook, signs a 7-day JWT, and returns only public user data.

Signin validates input, fetches the password hash with `.select("+password")`, compares with bcrypt, signs a JWT, and returns public user data.

The protected endpoint requires `Authorization: Bearer <token>`. The middleware verifies the token, validates the payload, loads the user without the password, attaches `req.user`, and passes control to the controller.

The protected HTML page stores the token under `authToken`, fetches `/api/auth/protected`, and removes the token on logout or authorization failure.

## TypeScript Architecture

TypeScript is used to make request bodies, JWT payloads, environment configuration, Mongoose documents, API responses, and `req.user` explicit. Runtime validation is still required because external JSON request data is unknown at runtime and TypeScript types are erased after compilation.

`module: "nodenext"` and `moduleResolution: "nodenext"` are used so TypeScript follows Node.js ESM rules. `"type": "module"` tells Node.js that compiled `.js` files in `dist/` are ECMAScript Modules.

## Security Notes

- Passwords are hashed with bcrypt and never returned by API responses.
- JWTs expire after 7 days.
- `JWT_SECRET` is required and must not be hard-coded.
- Signin errors do not reveal whether an email exists.
- `.env` is ignored by git.
- Unknown errors are narrowed safely and internal details are hidden in production responses.
