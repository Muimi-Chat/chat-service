# Chat Service

=======
This repository contains backend services and APIs for chat-related functionalities in Muimi-Chat.

Services provided:
- Chat with GPT (OpenAI)
- Chat Tokens 
- Keep Track of Chat Conversations, History



## Running the Application with Docker

To run the application using Docker, follow these steps:

1. Ensure Docker is installed on your system. If not, download and install Docker from [here](https://www.docker.com/get-started).

2. Navigate to the directory containing the `docker-compose.yml` file.

3. Build and run the Docker containers:

    ```bash
    docker-compose up --build
    ```

   To stop the containers, run:

    ```bash
    docker-compose down
    ```

## Directory Structure

<details>
<summary><strong>.github/workflows</strong> - Click to expand/collapse</summary>

- `deploy-vm.yml`: GitHub Actions workflow for deploying to VM.
</details>

<details>
<summary><strong>src</strong> - Click to expand/collapse</summary>

  <details>
  <summary><strong>api</strong> - Click to expand/collapse</summary>

  - `consumers`: Modules for consuming external services.
  - `controllers`: Logic for handling API requests.
  - `helpers`: Helper functions and utilities.
  - `interfaces`: TypeScript interfaces.
  - `repositories`: Repository layer for interacting with databases or external services.
  - `routes`: Routing configuration for API endpoints.
  - `services`: Business logic services.
  - `validations`: Input validation logic.
  - `configs`: Configuration files.
  </details>
    
  <details>
  <summary><strong>configs</strong> - Click to expand/collapse</summary>

  - `chatInputLimitation.ts`: Configuration for chat input limitations.
  - `cryptorConfig.ts`: Configuration for cryptographic operations.
  - `redisConnectionString.ts`: Configuration for Redis connection string.
  - `titleCreatorBotModel.ts`: Model for title creator bot.
  - `usableBotModels.ts`: Configuration for usable bot models.
  - `userServiceApiConfig.ts`: Configuration for user service API.
  </details>
  
  </details>

- `db.ts`: Database configuration script.
- `index.ts`: Entry point of the application.
- `schema.ts`: Database schema definition.
</details>

<details>
  <summary><strong>Root files and Configuration</strong> - Click to expand/collapse</summary>

- `.env.example`: Example environment variable configuration file.
- `.gitattributes`: Git attributes file.
- `.gitignore`: Git ignore file.
- `Dockerfile`: Dockerfile for containerization.
- `README.md`: This file, providing an overview of the repository structure and contents.
- `docker-compose-prod.yml`: Docker Compose file for production environment.
- `docker-compose.yml`: Docker Compose file for development environment.
- `drizzle.config.ts`: Drizzle configuration.
- `migrate.ts`: Migration script.
- `migration-helper.sh`: Script to assist with migrations.
- `nodemon.json`: Nodemon configuration.
- `package-lock.json`: npm package lock file.
- `package.json`: npm package configuration.
- `tsconfig.json`: TypeScript configuration.

 </details>
>>>>>>> ded14bf72deebe09692f62f0a9a2626d4d0540b2
