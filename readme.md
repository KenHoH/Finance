# Project Structure

This project uses a **modular structure**.
Each feature is placed inside its own **module** so the code is easier to organize and maintain.

External services such as **database connections or third-party integrations** are placed in a separate **infrastructure** folder.

---

# Root Folder Structure

```text
src/
├─ modules/
│  ├─ user/
│  │  ├─ core/
│  │  └─ framework/
│  │
│  ├─ order/
│  │  ├─ core/
│  │  └─ framework/
│
└─ infrastructure/
```

* **modules** contains all application features
* **infrastructure** contains implementations for external systems (database, external services, etc.)

---

# Modules

Each module represents a **single feature** of the system.

Example modules:

```text
modules/
├─ user/
├─ order/
└─ product/
```

Each module contains the business logic and the HTTP entry points related to that feature.

---

# Module Structure

Every module has two main folders:

```text
module-name/
├─ core/
└─ framework/
```

* **core** contains the business logic and domain models
* **framework** contains the HTTP controller that exposes the module as an API endpoint

---

# Core Folder

The **core** folder contains the main logic of the module and is independent from frameworks.

```text
core/
├─ app/
├─ model/
└─ interfaces/
```

### app

Contains the **use cases or business logic** of the module.

Example:

```text
core/app/
├─ createUser.ts
├─ updateUser.ts
```

---

### model

Contains the **domain models** used in the module.

Example:

```text
core/model/
└─ User.ts
```

Models define the structure of the data used in the business logic.

---

### interfaces

Contains **interfaces (contracts)** required by the core layer.

Example:

```text
core/interfaces/
└─ UserRepository.ts
```

These interfaces define what functions are needed, but the actual implementation is provided elsewhere.

---

# Framework Folder

The **framework** folder contains the **HTTP controller** for the module.

```text
framework/
└─ controller/
```

Example:

```text
framework/controller/
└─ UserController.ts
```

Responsibilities of the controller:

* Receive HTTP requests
* Validate input
* Call the appropriate logic in `core/app`
* Return the response

Controllers should only handle request and response logic.

---

# Infrastructure Folder

The **infrastructure** folder contains implementations that interact with **external systems**.

Example structure:

```text
infrastructure/
├─ database/
│  ├─ connection.ts
│  └─ repositories/
│     └─ UserRepositoryImpl.ts
│
└─ external-services/
```

Responsibilities:

* Database connection
* Repository implementations
* Third-party service integrations

These implementations fulfill the interfaces defined inside the module `core/interfaces`.

---

# Request Flow Example

A typical request follows this flow:

```text
HTTP Request
   → Module Controller (framework)
   → Application Logic (core/app)
   → Domain Model (core/model)
   → Interface (core/interfaces)
   → Infrastructure Implementation
   → Database / External Service
   → Response
```

---

# Summary

* Each feature is placed in a **module**
* **core** contains business logic and models
* **framework** contains HTTP controllers
* **infrastructure** handles database and external services
* Controllers call the business logic in `core/app`
