# Routeros Node

Routeros Node allows users to create custom software solutions to communicate with RouterOS to gather information, adjust configuration and manage router. API closely follows syntax from command line interface (CLI). It can be used to create translated or custom configuration tools to aid ease of use running and managing routers with RouterOS.

To use API RouterOS version 3.x or newer is required. By default API uses port 8728 and service is enabled.

**This library requires Routeros version v6.43 and above.**

## Installation

```bash
npm install routeros-node
```

## Making Connection

```javascript
const { Routeros } = require("routeros-node");

async function run() {
  const routeros = new Routeros({
    host: "127.0.0.1",
    port: 8728,
    user: "admin",
    password: "",
  });

  try {
    // connect to RouterOS
    const conn = await routeros.connect();

    // if connected successfully will return the connected instance/socket,
    console.log("conn===>", conn);

    // after that we can write the query
    const usersHotspot = conn.write(["/ip/hotspot/user/print"]);
    console.log(usersHotspot);
  } catch (error) {
    // if it fails will return an error here
    console.log("error===>", error);
  } finally {
    // dont forget to close connection
    routeros.destroy();
  }
}

run();
```

We can also use promises:

```javascript
const { Routeros } = require("routeros-node");

const routeros = new Routeros({
  host: "127.0.0.1",
  port: 8728,
  user: "admin",
  password: "",
});

routeros
  .connect()
  .then((conn) => conn.write(["/ip/hotspot/user/print"]))
  .then((usersHotspot) => {
    console.log(usersHotspot);
  })
  .catch((error) => {
    console.log("error===>", error);
  })
  .finnaly(() => {
    routeros.destroy();
  });
```

## Performing a query

Method `write()` receives an array, we can put all RouterOS query words into that array. See: https://wiki.mikrotik.com/wiki/Manual:API#Query_word

For example, create a new hotspot user with the name test: `write(['/ip/hotspot/user/add', '=name=test'])`.
