# Badminton Court Reservation System

## How to jump start the project

1. Clone this repository
    ```bash
    $ git clone https://github.com/seanmamasde/badminton_court_reserver.git; cd badminton_court_reserver
    ```
2. Install the required packages
    ```bash
    $ npm install
    ```
3. Create a `.env` file at the same level as the `src` folder
   ```bash
   $ echo "MONGODB_URI=mongodb://localhost:27017/badminton-db" > .env
   ```
4. Run the project
    ```bash
    # Run the mongodb in docker
    $ docker run --name mongodb -d -p 27017:27017 mongo

    # Register a test user
    $ node ./src/scripts/createTestUser.mjs

    # Run the project
    $ npm run dev
    ```
    And you should be able to login at `http://localhost:3000/login`
