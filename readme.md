# Project Structure

This project uses a **modular architecture**.
Each feature of the system is placed inside its own **module** so the code is easier to manage and understand.

Example:

```
modules/
 ├─ user/
 ├─ order/
 └─ product/
```

Each module contains everything related to that feature.

---

# Module Structure

Each module has two main folders:

```
module-name/
 ├─ core/
 └─ framework/
```

* **core** → contains the business logic
* **framework** → contains technical implementations such as controllers and database access

---

# Core Folder

The **core** folder contains the main logic of the module.

```
core/
 ├─ app/
 ├─ model/
 └─ interfaces/
```

### app

Contains the **business logic or use cases** of the module.

Example:

```
core/app/
 ├─ createUser.ts
 ├─ updateUser.ts
```

These files describe what the system does for a specific action.

---

### model

Contains the **data structure and domain models** used in the module.

Example:

```
core/model/
 └─ User.ts
```

Models represent the main objects used in the system.

---

### interfaces

Contains **contracts (interfaces)** used by the core layer.

Example:

```
core/interfaces/
 └─ UserRepository.ts
```

These interfaces describe what functions are required (for example saving or retrieving data), but they do not contain the actual implementation.

---

# Framework Folder

The **framework** folder contains code related to external systems such as HTTP requests or databases.

```
framework/
 ├─ controller/
 └─ infrastructure/
```

---

### controller

Controllers act as **API endpoints**.

They receive requests from the client and call the appropriate logic in the `core/app` folder.

Example:

```
framework/controller/
 └─ UserController.ts
```

---

### infrastructure

The **infrastructure** folder contains database and external service implementations.

Example:

```
framework/infrastructure/
 ├─ database/
 │  └─ UserRepositoryImpl.ts
```

This is where database connections and repository implementations are placed.

---

# Request Flow Example

A typical request follows this flow:

```
Request
  → Controller
  → App (business logic)
  → Model / Interfaces
  → Infrastructure (database)
  → Response
```

---

# Summary

* Each feature is placed inside a **module**
* **core** contains business logic
* **framework** contains controllers and database implementations
* Controllers call the logic in `core/app`
* Database access is handled inside `framework/infrastructure`
