# "The Rack" - Simple Server Asset Tracker

## 1. Project Context & Subject Matter
The context of this project is IT infrastructure management. I will be building a tool to track physical servers and their network information. To do this, I am starting by forking an existing Red Hat Cockpit starter project (https://github.com/cockpit-project/starter-kit) because it provides a user interface shell that perfectly meets my needs at work. From that starting point, I will build out a custom back-end application to power a new plugin that meets all the requirements of the course syllabus.

## 2. The Problem
Currently, keeping track of new servers, their IP addresses, and their physical location in a server rack is often done using manual spreadsheets. These get outdated quickly and are prone to human error. "The Rack" solves this by creating a simple, web-based database to add, view, update, and delete server information in real-time.

## 3. Technical Components
While the front-end will be a Cockpit plugin, the heavy lifting will be done by a custom back-end application. The technical pieces include:
* **The Server:** A backend built with Node.js and the Express framework.
* **The Database:** A MongoDB database to save the hardware information (like server name, IP address, and rack location).
* **The Routes:** REST APIs that handle the data:
    * `GET` - View a list of all servers.
    * `POST` - Add a newly installed server.
    * `PUT` - Update an existing server's information.
    * `DELETE` - Remove a server that has been retired.

## 4. Meeting Project Requirements
[cite_start]This project is a self-directed demonstration of proficiency in the course material[cite: 13]. It will meet the required learning objectives in the following ways:
* [cite_start]**Create an application server using NodeJS and Express[cite: 8]:** I will build a standalone backend server to handle all the logic.
* [cite_start]**Identify and create RESTful APIs[cite: 8]:** The frontend plugin will communicate with the backend exclusively through custom REST API routes.
* [cite_start]**Structure a document database[cite: 8]:** MongoDB will be used to store the server data, replacing the need for local flat files or spreadsheets.
* [cite_start]**Implement a basic authentication setup[cite: 8]:** I will add an authentication layer so only authorized users can add or delete server records from the database.
* [cite_start]**Write thorough, quality unit tests[cite: 8]:** I will use Jest to write tests that ensure the API routes save and retrieve data correctly.