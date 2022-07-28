import { Socket } from "node:net";
import RouterosException from "./RouterosException";
import { encodeString, useSentenceParser } from "./helpers";
import tls, { TLSSocket, ConnectionOptions } from "node:tls";

class Routeros {
  protected host: string;
  protected port: number;
  protected user: string;
  protected password: string;
  protected tlsOptions?: ConnectionOptions;
  protected timeout: number;

  protected socket: Socket | TLSSocket;

  constructor({
    host,
    port,
    user,
    password,
    timeout = 0,
    tlsOptions,
  }: {
    host: string;
    port: number;
    user: string;
    password: string;
    timeout?: number;
    tlsOptions?: ConnectionOptions;
  }) {
    this.socket = new Socket();
    this.host = host;
    this.port = port;
    this.user = user;
    this.password = password;
    this.timeout = timeout * 1000;
    this.tlsOptions = tlsOptions;
  }

  private writeWords(words: string[]) {
    for (const word of words) {
      this.socket.write(encodeString(word));
    }

    this.socket.write(encodeString(null));
  }

  private login() {
    this.writeWords([
      "/login",
      `=name=${this.user}`,
      `=password=${this.password}`,
    ]);
  }

  public connect(): Promise<Omit<Routeros, "connect">> {
    return new Promise((resolve, reject) => {
      try {
        if (this.tlsOptions) {
          this.socket = tls.connect({
            host: this.host,
            port: this.port,
            ...this.tlsOptions,
          });
        } else {
          this.socket = this.socket.connect({
            host: this.host,
            port: this.port,
          });
        }
        this.socket.setTimeout(this.timeout);
      } catch (error: any) {
        return reject(new RouterosException(error.message));
      }

      const result: {
        type: string;
        message: string;
      } = {
        type: "",
        message: "",
      };

      this.socket
        .on("data", (bufferData) => {
          useSentenceParser(bufferData, (line) => {
            if (line === "!trap") {
              result.type = "error";
            } else if (line.startsWith("=")) {
              const [, key, value] = line.split("=");
              result.message = value;
            } else if (line === "!done") {
              if (result.type === "error") {
                reject(new RouterosException(result.message));
              } else {
                resolve(this);
              }
            }
          });
        })
        .on("error", (err) => {
          reject(new RouterosException(err.message));
        })
        .on("timeout", () => {
          this.socket.destroy(new Error("Socket timeout"));
        })
        .on("connect", () => {
          this.login();
        });
    });
  }

  public write(queries: string[]): Promise<{ [prop: string]: string }[] | []> {
    return new Promise((resolve, reject) => {
      this.writeWords(queries);

      const result: {
        type: string;
        messages: string[];
        data: any[];
      } = {
        type: "",
        messages: [],
        data: [],
      };

      let isDone = false;

      this.socket.on("data", (bufferData) => {
        useSentenceParser(bufferData, (line) => {
          if (line === "!re") {
            result.data.push({});
            result.type = "success";
          } else if (line === "!trap") {
            result.type = "error";
          } else if (isDone && line.startsWith("=ret=")) {
            const [, key, value] = line.split("=");
            resolve([{ [key]: value }]);
          } else if (line.startsWith("=") && result.type !== "error") {
            const [, key, value] = line.split("=");
            result.data[result.data.length - 1][key] = value;
          } else if (line.startsWith("=") && result.type === "error") {
            const [, key, value] = line.split("=");
            result.messages.push(value);
          } else if (line === "!done") {
            isDone = true;
          } else if (line === "" && isDone) {
            if (result.type === "success") {
              resolve(result.data);
            } else if (result.type === "") {
              resolve(result.data);
            } else {
              reject(new RouterosException(result.messages.join(". ")));
            }
          }
        });
      });
    });
  }

  destroy() {
    this.socket.destroy();
  }
}

export default Routeros;
