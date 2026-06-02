# "The Rack" - Server Asset Tracker

## 1. Project Context
In my day-to-day work managing server infrastructure and lab environments, keeping track of physical hardware is a constant challenge. For my final project, I built "The Rack"—a tool to manage this automatically. To make it a real-world tool I can actually use at work, I used an open-source Red Hat Cockpit starter project as my base shell. However, **the plugin's frontend user interface and the entire Node.js backend are completely my own custom code.** ## 2. The Problem
Currently, whenever we rack a new server, deploy a new OS, or assign a new static IP address, or add new application packages we track it using manual spreadsheets. This method is prone to human error and gets outdated very quickly. "The Rack" solves this by providing a simple, web-based dashboard to view and manage server information. Even better, it replaces manual typing with automation, pulling live hardware data directly from the servers themselves.

## 3. Technical Components
The heavy lifting of this project is handled by a custom backend API and an automation engine. The components include:

* **The Frontend:** A custom Cockpit plugin built with HTML, JavaScript, and CSS (styled to match Red Hat's native look).
* **The Backend:** A REST API server built using Node.js and the Express framework.
* **The Database:** A MongoDB database used to store hardware records (hostnames, IP addresses, OS versions, App versions, etc.).
* **The Automation Engine:** An Ansible integration that acts as an invisible worker. When I click "Sync", Ansible logs into remote servers, gathers live system facts (CPU cores, RAM, and specific software package versions), and injects that real-time data straight into my database.

## 4. Project Requirements
This project is my demonstration of the core concepts we have covered in this course. Here is exactly how I met the final grading requirements, along with where to find the code for each:

* **Express API with Authentication:** I built a custom Node.js/Express backend protected by `bcryptjs` password hashing and JWT (JSON Web Tokens). Only authorized admins can modify the database.
  * *(File Reference: `governor-backend/server.js`)*
* **2 Sets of CRUD Routes:** I created full Create, Read, Update, and Delete routes for two different data models: `Assets` (the servers) and `Datacenters` (the physical locations).
  * *(File Reference: `governor-backend/server.js`)*
* **Indexes for Performance & Uniqueness:** I configured my Mongoose schemas to require unique IP addresses and Datacenter names. I also built a Text Index on the `hostname` and `osVersion` fields.
  * *(File Reference: `governor-backend/server.js`)*
* **Text Search:** I implemented a custom API route (`/api/v1/assets/search`) that utilizes MongoDB's `$text` operator to search the database.
  * *(File Reference: `governor-backend/server.js`)*
* **External Data Providers:** I utilized Ansible's `setup` and `shell` modules to dynamically fetch live hardware telemetry and package data from external virtual machines, essentially using my own infrastructure as a live data provider.
  * *(File Reference: `update_governor.yml` and `governor-backend/server.js`)*
* **Thorough Unit Testing (>80%):** I wrote automated tests using Jest and Supertest to verify my API's happy paths, error handling, and security. (and with the help of some auto-test sites) My final project test coverage is passing at **87.25%**.
  * *(File Reference: `governor-backend/server.test.js`)*
* **Front-End Project:** I connected my database and backend API to a highly functional, custom-built UI that runs natively inside Red Hat Cockpit.
  * *(File Reference: `the-rack-plugin/index.html` and `the-rack-plugin/app.js`)*