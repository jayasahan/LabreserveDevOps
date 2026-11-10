# LabReserve — Agent Instructions

## 1. Project Purpose

LabReserve is a second-year undergraduate Web Application Development project.

It is a laboratory equipment request and management web application.

The primary academic goal is NOT maximum feature count.

The primary goals are:

* demonstrate full-stack web development fundamentals
* keep the architecture simple and explainable
* ensure the student can understand and explain every major part of the code
* implement the approved Figma design faithfully
* demonstrate a meaningful business rule: first-come-first-served equipment requesting

Do not overengineer this project.

If there are multiple technically valid solutions, prefer the simplest solution that is clear, maintainable, and appropriate for an undergraduate MERN project.

---

# 2. Frozen Architecture

The architecture is decided and MUST NOT be changed unless explicitly requested by the user.

## Repository

This is ONE Git repository.

```text
LabReserve/
├── client/
├── server/
├── Dockerfile
├── AGENTS.md
└── README.md
```

## Frontend

Use:

* React
* Vite
* JavaScript
* React Router
* standard CSS
* browser Fetch API where practical

Do NOT introduce:

* TypeScript
* Next.js
* Redux
* Zustand
* Tailwind CSS
* Material UI
* Bootstrap
* shadcn
* another frontend framework
* unnecessary state-management libraries

React state, props, Context where genuinely necessary, and normal component composition are sufficient.

## Backend

Use:

* Node.js
* Express.js
* JavaScript
* MongoDB
* Mongoose

Keep the backend structured using:

```text
server/
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
└── server.js
```

Do NOT introduce:

* NestJS
* GraphQL
* Prisma
* SQL databases
* microservices
* Redis
* WebSockets
* message queues
* serverless architecture
* unnecessary design patterns

## Database

Production/development database:

MongoDB Atlas

ODM:

Mongoose

## Production Deployment

The completed application will be packaged as ONE Docker container.

The intended production architecture is:

```text
Browser
   |
   v
Express application
   |
   +-- serves compiled React application
   |
   +-- handles /api/* REST endpoints
   |
   v
MongoDB Atlas
```

The intended cloud deployment target is Railway.

Dockerization and cloud deployment are LAST-STAGE tasks.

Do not introduce Docker while the application is still being built unless explicitly requested.

---

# 3. Figma Is the UI Source of Truth

LabReserve Figma design:

https://www.figma.com/design/KwR1wQX77NLYd4BqoYEsHF

Use the configured Figma MCP server when available.

When implementing UI:

1. inspect the relevant Figma frame
2. understand its hierarchy and layout
3. identify reusable UI components
4. implement it in React and CSS
5. keep the implementation straightforward

Do not blindly convert Figma output into large generated components.

Do not add features merely because they would make the product appear more advanced.

Do not redesign screens without explicit instruction.

Small responsive improvements are allowed where required for normal web behaviour.

---

# 4. Application Roles

There are only TWO roles:

```text
STUDENT
ADMIN
```

Do not introduce additional roles.

There is only one conceptual administrator for this university project.

Students must NOT be able to choose the ADMIN role during registration.

The admin account should be created separately, such as through a controlled seed/setup process.

---

# 5. Core Domain Models

Keep the database deliberately small.

There are THREE primary models.

## User

Conceptually:

```text
User
- name
- email
- password
- role
- createdAt
```

Roles:

```text
STUDENT
ADMIN
```

Passwords must never be stored in plain text.

Use password hashing.

---

## Equipment

Conceptually:

```text
Equipment
- name
- category
- assetCode
- description
- status
- createdAt
- updatedAt
```

Equipment status:

```text
AVAILABLE
REQUESTED
BORROWED
```

`assetCode` should uniquely identify equipment.

Categories remain simple strings.

Examples:

```text
Electronics
Networking
Embedded Systems
Tools
```

Do NOT create a Category model unless explicitly requested.

---

## Request

Conceptually:

```text
Request
- student
- equipment
- status
- createdAt
- updatedAt
```

Request status:

```text
PENDING
APPROVED
REJECTED
RETURNED
CANCELLED
```

Use Mongoose references for the associated User and Equipment.

Do not add unnecessary fields.

---

# 6. Core Business Rule

The most important application rule is:

> One equipment item can have only one active request at a time.

The application follows first-come-first-served behaviour.

When equipment has status:

```text
AVAILABLE
```

a student may request it.

When the first valid request succeeds:

```text
Equipment:
AVAILABLE -> REQUESTED

Request:
PENDING
```

Other students must no longer be able to request the same equipment.

The backend MUST enforce this.

Do not rely only on disabling a frontend button.

Where practical, use an atomic MongoDB/Mongoose operation such as conditionally updating equipment only when:

```text
status === AVAILABLE
```

This prevents two simultaneous requests from both successfully claiming the same equipment.

Keep this implementation understandable and document the reasoning with concise comments where useful.

---

# 7. Request State Transitions

Valid normal flows:

```text
AVAILABLE
   |
Student requests
   v
REQUESTED
   |
Admin approves
   v
BORROWED
   |
Admin marks returned
   v
AVAILABLE
```

Approval affects request status:

```text
PENDING -> APPROVED -> RETURNED
```

Rejection:

```text
PENDING -> REJECTED
Equipment -> AVAILABLE
```

Student cancellation while pending:

```text
PENDING -> CANCELLED
Equipment -> AVAILABLE
```

Do not invent additional workflow states.

---

# 8. Student Features

Student functionality is limited to:

* register
* login
* logout
* browse equipment
* search equipment
* filter by category
* view equipment details
* see equipment availability
* request available equipment
* view their own requests
* cancel their own PENDING request

Students must NOT:

* create equipment
* modify equipment
* delete equipment
* approve requests
* reject requests
* access other students' private request history
* access admin endpoints

---

# 9. Admin Features

Admin functionality is limited to:

* login
* view dashboard summary
* view equipment
* add equipment
* edit equipment
* delete equipment where safe
* view all requests
* approve pending requests
* reject pending requests
* mark borrowed equipment as returned

Do not add:

* complex analytics
* audit systems
* admin hierarchy
* staff management
* email systems
* notifications
* reports unless explicitly requested

---

# 10. Authentication and Authorization

Use a simple authentication implementation appropriate for the course.

JWT-based authentication is acceptable.

Passwords must be hashed before storage.

Protected backend routes must verify authentication.

Admin routes must verify the authenticated user's ADMIN role.

Never trust role information sent from the frontend.

Frontend route protection is for user experience.

Backend authorization is the actual security boundary.

Keep authentication understandable.

Do not introduce OAuth, Auth0, Firebase Authentication, Clerk, Passport, or other authentication platforms unless explicitly requested.

---

# 11. API Style

Use a REST API under:

```text
/api
```

Keep routes predictable.

Expected conceptual route groups:

```text
/api/auth
/api/equipment
/api/requests
```

Use appropriate HTTP methods:

```text
GET     read
POST    create
PUT     update a resource
PATCH   perform a specific state update
DELETE  delete where appropriate
```

Use normal HTTP status codes and JSON responses.

Examples:

```text
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
500 Internal Server Error
```

Do not expose internal stack traces to clients.

---

# 12. Frontend Structure

Prefer a small structure such as:

```text
client/src/
├── components/
├── pages/
├── services/
├── context/
├── App.jsx
├── main.jsx
└── styles/
```

Possible reusable components include:

```text
Navbar
EquipmentCard
StatusBadge
ProtectedRoute
AdminRoute
```

Do not split trivial UI into dozens of tiny components.

A component should exist because it is reused or because it represents a meaningful UI responsibility.

---

# 13. Frontend Pages

The Figma currently defines the main UI direction for:

```text
Login
Student Equipment Dashboard
Equipment Details
My Requests
Admin Dashboard
Admin Equipment Management
Admin Request Management
Add Equipment
Responsive student view
Responsive admin request view
```

A Register page may be created using the same visual design language as Login.

Do not create unrelated pages.

---

# 14. Styling

Use a light UI consistent with the approved Figma design.

Prefer:

* white/light neutral backgrounds
* blue primary action colour
* clear status colours
* readable typography
* simple cards
* clear spacing
* responsive layouts

Use normal CSS.

Avoid excessive:

* animations
* gradients
* glassmorphism
* 3D effects
* decorative UI
* complex CSS architecture

The design should look polished but realistic for a second-year undergraduate application.

---

# 15. Responsive Design

This is a WEB APPLICATION.

It is NOT primarily a native mobile application.

The application must work on:

* desktop
* tablet
* mobile browser

Use responsive CSS.

Do not introduce React Native.

---

# 16. Error Handling

Handle expected errors clearly.

Examples:

* invalid login
* duplicate email
* duplicate asset code
* equipment not found
* request not found
* equipment already requested
* unauthorized access
* forbidden admin action
* invalid request state transition

Frontend messages should be understandable to ordinary users.

Backend errors should provide useful but safe JSON responses.

---

# 17. Validation

Validate important data on BOTH frontend and backend where appropriate.

Backend validation is authoritative.

Do not trust:

* client role
* client-provided status
* equipment availability displayed by the UI
* resource ownership claimed by the frontend

---

# 18. Coding Style

Prioritize readability over cleverness.

Use:

* descriptive variable names
* small understandable functions
* async/await
* straightforward control flow
* concise comments for non-obvious business rules

Avoid:

* unnecessary abstractions
* deeply nested functions
* clever one-liners
* premature optimization
* generated-looking boilerplate
* massive files when natural separation is obvious

Do not add comments that merely repeat the code.

Comments should explain WHY when the reason is not obvious.

---

# 19. Dependencies

Before installing a dependency, ask:

> Can this be done clearly using the existing stack or standard platform APIs?

Do not add a package simply to save a few lines of code.

Preferred minimal dependency philosophy.

Likely justified dependencies include:

Frontend:

```text
react
react-dom
react-router-dom
```

Backend:

```text
express
mongoose
bcryptjs
jsonwebtoken
cors
dotenv
```

Development packages may be added only where they provide clear value.

Do not install large dependency sets without explanation.

---

# 20. Development Behaviour for AI Agents

Do NOT attempt to build the entire application in one task unless explicitly requested.

For each implementation task:

1. read this AGENTS.md
2. inspect existing project files
3. inspect the relevant Figma frame when UI work is involved
4. explain briefly what will change
5. modify only the files required for the current task
6. run relevant checks
7. report exactly what was changed
8. report any errors or unresolved decisions

Never silently change the architecture.

Never add features outside the current task.

Never replace working code with a completely different architecture merely because another solution is more fashionable.

---

# 21. Academic Explainability Rule

This rule has highest priority.

The student will be asked to explain the implementation.

Therefore:

> Every important part of the code should be explainable by a second-year Computer Engineering undergraduate who has studied the project.

When generating code, prefer educational clarity.

If a solution requires advanced framework magic to understand, choose a simpler implementation.

When asked to explain generated code, explain:

* what it does
* why it exists
* how data flows through it
* what would happen if it were removed
* important security or validation behaviour

Do not hide complexity behind unexplained abstractions.

---

# 22. Things Explicitly Out of Scope

Do NOT add these unless the user explicitly changes the scope:

```text
payments
chat
email notifications
push notifications
QR codes
time-slot reservation system
calendar booking
multiple active reservations
multiple admin levels
worker management
AI features
recommendation algorithms
real-time sockets
WebSockets
Redux
TypeScript
Next.js
NestJS
GraphQL
Prisma
SQL
Redis
microservices
Kubernetes
CI/CD pipelines
cloud architecture beyond the final simple deployment
```

---

# 23. Docker Rule

Docker will be introduced only after the full application works locally.

Final target:

```text
React production build
        +
Node/Express API
        =
ONE Docker image
        ↓
ONE deployed application
```

Do not create separate frontend/backend production containers.

Do not introduce Docker Compose unless a genuine requirement appears.

MongoDB remains external through MongoDB Atlas.

---

# 24. Git Rule

Keep commits understandable and scoped.

Prefer commits such as:

```text
Initialize React and Express project
Implement equipment model and routes
Implement student equipment dashboard
Add equipment request workflow
Add admin request actions
Connect frontend authentication
Add Docker production build
```

Do not commit:

```text
.env
node_modules/
secrets
database credentials
```

Provide an `.env.example` containing variable names but no secrets.

---

# 25. Final Principle

When unsure, choose:

```text
simple > clever
explicit > magical
understandable > impressive
working > feature-rich
course fundamentals > production-scale architecture
```

LabReserve is intentionally a small, polished, explainable MERN application.
