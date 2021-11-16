import fs from "fs";
import merge from "lodash.merge";

export class ConfigLoader {
  path: string;
  config: any;

  constructor(network: string) {
    if (network === "hardhat" || network === "localhost") {
      this.path = `${__dirname}/../config/local.json`; 
    } else {
      this.path = `${__dirname}/../config/${network}.json`;
    }
  }

  load() {
    const json = fs.readFileSync(this.path, "utf8");
    this.config = JSON.parse(json);
    return this.config;
  }

  save(obj: any) {
    const json = JSON.stringify(obj, null, 2);
    fs.writeFileSync(this.path, json);
  }

  update(obj: any) {
    merge(this.config, obj);
    const json = JSON.stringify(this.config, null, 2);
    fs.writeFileSync(this.path, json);
  }
}
