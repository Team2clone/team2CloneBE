# ChapGPT

This is the backend repository for the ChatGPT clone project named ChapGPT(짭GPT).

## Table of Contents

- [Introduction](#introduction)
- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)

## Introduction

This repository contains the backend code for the ChatGPT clone project for practice. It provides the server-side functionality and APIs required for the project. The project aims to create a platform for users to interact and exchange messages, similar to the ChatGPT service, using only the gpt-3.5-turbo model of the OpenAI API.

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/team2CloneBE.git
   ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Set up environment variables:

    - Create a .env file in the root directory.
    - Define the following environment variables in the .env file:

    ```
    DB_HOST=<your_database_host>
    DB_USERNAME=<your_database_username>
    DB_PASSWORD=<your_database_password>
    DB_DATABASE=<your_database_name>
    OPENAI_API_KEY=<your_openai_API_key>
    ```

4. Run the application:
    ```bash
    npm start
    ```

The application will start running on http://localhost:3001.

## Usage

Once the application is running, you can use API testing tools like Postman to interact with the available endpoints. Refer to the API Endpoints section for more information on the available routes and request/response formats.

## API Endpoints

The following are the available API endpoints provided by this backend:

### USER
- <code>POST</code> /api/signup: User registration.
- <code>POST</code> /api/login: User login.
- <code>POST</code> /api/logout: User logout.
- <code>GET</code> /api/credit: Check user's credit.

### Chat
- <code>POST</code> /api/chat: Create a new chat.
- <code>GET</code> /api/chat: Get all chats.
- <code>GET</code> /api/chat/:chatId: Get chat details.
- <code>POST</code> /api/chat/:chatId: Send a message in a chat.
- <code>PUT</code> /api/chat/:chatId: Update chat title.
- <code>DELETE</code> /api/chat/:chatId: Delete a chat.
