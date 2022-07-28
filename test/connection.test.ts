import RouterosClient from "../src/Routeros";
import Routeros from "../src/Routeros";
import RouterosException from "../src/RouterosException";
import config from "../src/config";

describe("Connection", () => {
  it("when correct credential should return instance", async () => {
    const routeros = new Routeros({
      host: config.routeros.host,
      port: config.routeros.port,
      user: config.routeros.user,
      password: config.routeros.password,
    });

    return routeros
      .connect()
      .then((client) => {
        expect(client).toBeInstanceOf(RouterosClient);
      })
      .finally(() => {
        routeros.destroy();
      });
  });

  describe("Wrong port", () => {
    it("port incorrect should thrown RouterosException with message", async () => {
      const routeros = new Routeros({
        host: config.routeros.host,
        port: 8748,
        user: config.routeros.user,
        password: config.routeros.password,
      });

      return routeros
        .connect()
        .catch((error) => {
          expect(error).toBeInstanceOf(RouterosException);
        })
        .finally(() => {
          routeros.destroy();
        });
    });

    it("port out of range should return out of range message", async () => {
      const routeros = new Routeros({
        host: config.routeros.host,
        port: 87288,
        user: config.routeros.user,
        password: config.routeros.password,
      });

      return routeros
        .connect()
        .catch((error) => {
          expect(error).toBeInstanceOf(RouterosException);
        })
        .finally(() => {
          routeros.destroy();
        });
    });
  });

  describe("Wrong host", () => {
    it("Wrong host with timeout should return RouterosException and timeout message", async () => {
      const routeros = new Routeros({
        host: "192.168.200.1",
        port: config.routeros.port,
        user: config.routeros.user,
        password: config.routeros.password,
        timeout: 5,
      });

      return routeros
        .connect()
        .catch((error) => {
          expect(error).toBeInstanceOf(RouterosException);
          expect(error.message).toBe("Socket timeout");
        })
        .finally(() => {
          routeros.destroy();
        });
    }, 6000);
  });

  it("wrong user show throw RouterosException", async () => {
    const routeros = new Routeros({
      host: config.routeros.host,
      port: config.routeros.port,
      user: "wrong",
      password: config.routeros.password,
    });

    return routeros
      .connect()
      .catch((error) => {
        expect(error).toBeInstanceOf(RouterosException);
      })
      .finally(() => {
        routeros.destroy();
      });
  });
});
