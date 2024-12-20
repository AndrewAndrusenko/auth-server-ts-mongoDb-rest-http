Authentication Server TS HTTP mongodb
- Created new authentication server using typescript
- Server based on express.js/node.js
- Implemented MongoDB as a database
- Passwords stored as hashed using bcrypt library
- Created service to send a user emails with links to confirm provided email address. Nodemailer is being used as a library
- Current features:
  1. Sign up new user. A user has to provide unique login, password and email
  2. Password hashed and user profile saved with unique token
  3. A mail is sent with link to confirm provided email address. Link is consits of user id and token
  4. User are unable to login without confirming email