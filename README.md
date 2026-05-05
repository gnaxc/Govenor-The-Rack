# "The Rack" - Server Asset Tracker

## 1. Project Context & Subject Matter
In my day-to-day work managing server infrastructure and lab environments, keeping track of physical hardware is a constant challenge. For my final project, I am building a tool to manage this. I decided to start by forking an existing Red Hat Cockpit starter project (https://github.com/cockpit-project/starter-kit) to serve as my user interface shell. This gives me a practical frontend that I can actually use at work, while allowing me to focus my development time entirely on building a custom Node.js backend to power it (or basically a backend plugin).

## 2. The Problem
Currently, whenever we rack a new server, deploy a new OS like AlmaLinux or RHEL, or assign a new static IP address, we track it using manual spreadsheets. This method is prone to human error and the sheets get outdated very quickly. "The Rack" solves this problem by providing a simple, web-based database to add, view, update, and delete server information in real-time, directly from a centralized dashboard.

## 3. Technical Components
While the frontend is a Cockpit plugin, the heavy lifting of this project is handled by the custom backend application I am building. The technical components include:

* **The Server:** A backend server built using Node.js and the Express framework.
* **The Database:** I am using a MongoDB database to store the hardware records (specifically tracking hostname, IP address, OS version, and rack position).
* **The REST API:** The frontend UI and the database communicate through custom routes I am creating:
    * `GET` - View a list of all current servers in the rack.
    * `POST` - Add a newly installed server to the database.
    * `PUT` - Update an existing server's information (like if an IP changes).
    * `DELETE` - Remove a server record when the hardware is retired.

## 4. Meeting Project Requirements
This project is my self-directed demonstration of the core concepts we have covered in this course. Here is how I am meeting the specific grading requirements:

* **Create an application server using NodeJS and Express:** I am building a standalone Node.js backend to handle all the data logic, separate from the frontend UI.
* **Identify and create RESTful APIs:** The Cockpit plugin will communicate with my backend exclusively through the custom REST API routes listed above.
* **Structure a document database:** I am utilizing MongoDB to store the server data, replacing the need for local flat files or spreadsheets.
* **Implement a basic authentication setup:** I am adding an authentication layer to the backend so that only authorized administrators can add or delete server records.
* **Write thorough, quality unit tests:** I am using Jest to write tests that verify my API routes save, retrieve, and handle data correctly.