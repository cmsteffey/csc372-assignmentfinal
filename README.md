## EzAccounting
### Setup Instructions
To set up EZAccounting, all you need to have installed is node.js, version 24 or later.

First, clone the repository to your local computer or server with `git clone https://github.com/cmsteffey/csc372-assignmentfinal`.

After cloning the repository, configuration is required. Creation of a shell script is recommended. To run the application, the DATABASE_URL environment variable needs to be set to a valid URL for a local or remote PostgreSQL installation, and the MASSIVE_KEY environment variable needs to be set to a valid key to the [Massive](https://massive.com) api. Shell scripts should follow the form of: 

```shell
npm install
DATABASE_URL="postgres://..." \
MASSIVE_KEY="AbCdE123..." \
node server.js
```

This will start the server locally on port 5656, connected to the database backend of your choosing.
You can use any reverse proxy such as nginx to expose the server to the public Internet, or use a common hosting service that will expose your port and host this code for you.
### Demo and Publicly Hosted Instance

[Video Demo Link](https://uncg-my.sharepoint.com/:v:/g/personal/cmsteffey_uncg_edu/IQAo8tkLM8lTTZyORDoWa_aSAVN6lTe32fyWszQSDCawh1o?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJPbmVEcml2ZUZvckJ1c2luZXNzIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXciLCJyZWZlcnJhbFZpZXciOiJNeUZpbGVzTGlua0NvcHkifX0&e=B7avf1)\
[Public EZAccounting Instance (https://ezaccounting.cmsteffey.tech)](https://ezaccounting.cmsteffey.tech)
### Reflection

##### Design Choices:
- Frontend framework \
I chose to use EJS because I knew this application wouldn't need anything to be live updated. All changes are user-controlled, so there's no need for a more complicated frontend system such as React. EJS also makes rendering tables extremely easy, and a lot of this application uses tables.
- Backend structure \
I used a pretty standard MVC configuration with models, controllers, and routers. This created easy to pinpoint errors, a clear separation of responsibilities, and an easily-modifiable codebase. Whenever I wanted to add more functionality, I was able to just add a view, controller method, and router endpoint registration.
- Database Schema \
My database schema keeps user accounts and financial accounts separated. The schema also properly parents every child entity with foreign keys, and includes deletion triggers to cascade administrative operations. Every text field is stored using varchar fields to optimize database calls and reduce pointer lookups, and every entity has a primary key to allow indexing for the most common retrieval operations

##### Challenges

- Mobile Formatting \
When I was creating the frontend UI, I was designing and testing primarily on a desktop computer. When I went to open the application on my phone, none of the tables fit on the screen. I ended up changing many styles and creating media queries to help the mobile view be just as functional as the PC view.
- Date Handling \
When I was creating the journal entry system and started using it for my personal accounting, I realized that I needed two dates on each entry: The time the journal entry was created in the EZAccounting system, and additionally the time that the actual transaction happened. I was originally just recording the time that the entry was created in the system, resulting in mis-sorted entries in the journal entries table that made no chronological sense. After adding the for_date field, I now sort by the time that the account balances changed rather than the time the entry was put into the system.

##### Learning Outcomes

Through the development of this project, I mainly learned about how to structure a project to be easily extendable, focusing on project format with every new thing I added. Previous projects I have made are less structured, meaning that I have a harder time getting back into development after a long time away. This project feels very extendable, and I am planning on iterating further upon it. I also learned how to set up non-executable processes for hosting on my server, because node applications can't be compiled into a single file. I had to modify my service manager to handle a process that wasn't a direct executable and was a runtime with command-line arguments.

##### Future Work

- Passkeys \
I would like to add passkey support to this project, but it seems that adding passkey authentication is a much bigger item than I would have originally thought. I also want to keep this application free of Javascript on the client-side, but passkeys would require that I didn't. 
- Auxiliary Files \
I would like to add the ability to upload auxiliary files such as receipt images or invoices to relevant journal entries. This would not be complicated, but would require that I store data outside Postgres if I want to be efficient and not just use blob references or Base64 encoded files inside columns.
