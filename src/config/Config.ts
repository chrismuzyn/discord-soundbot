import fs from "node:fs";
import path from "node:path";
import camelCase from "lodash/camelCase";

import type ConfigInterface from "./ConfigInterface";
import type { ConfigValue } from "./ConfigInterface";
import DEFAULT_CONFIG from "./DefaultConfig";

export default class Config implements ConfigInterface {
  public clientId!: string;
  public token!: string;
  public language!: string;
  public prefix!: string;
  public acceptedExtensions!: string[];
  public maximumFileSize!: number;
  public deleteMessages!: boolean;
  public stayInChannel!: boolean;
  public timeout!: number;
  public game!: string;
  public elevatedRoles!: string[];

  private readonly CONFIG_PATH = path.join(process.cwd(), "config", "config.json");
  private readonly MODIFIABLE_FIELDS = [
    "language",
    "prefix",
    "acceptedExtensions",
    "maximumFileSize",
    "deleteMessages",
    "stayInChannel",
    "timeout",
    "game",
    "elevatedRoles",
  ];

  private readonly JSON_KEYS = ["clientId", "token", ...this.MODIFIABLE_FIELDS];
  private readonly ARRAY_VALUES = ["acceptedExtensions", "elevatedRoles"];

  // biome-ignore lint/suspicious/noExplicitAny: we make sure that the type is correct all around this class
  [index: string]: any;

  constructor() {
    this.initialize();
  }

  public has(field: string) {
    return this.MODIFIABLE_FIELDS.includes(field);
  }

  public set(field: string, value: string[]): ConfigValue {
    if (!this.JSON_KEYS.includes(field)) throw Error(`Unknown config option: ${field}`);

    const newValue = this.coerceValue(field, value);

    this[field] = newValue;
    this.writeToConfig();

    return newValue;
  }

  public setFrom(data: ConfigInterface) {
    Object.keys(data).forEach((field) => {
      this[field] = data[field];
    });
  }

  private initialize() {
    this.initializeDefaultConfig();
    if (fs.existsSync(this.CONFIG_PATH)) {
      this.initializeWithSavedConfig();
    }

    this.initializeFromEnvironmentVariables();
  }

  private initializeDefaultConfig() {
    this.setFrom(DEFAULT_CONFIG);
  }

  private initializeWithSavedConfig() {
    // eslint-disable-next-line
    const savedConfig = require(this.CONFIG_PATH);
    this.setFrom(savedConfig);
  }

  private coerceValue(field: string, value: string[]): ConfigValue {
    switch (typeof this[field]) {
      case "string":
        return field === "game" ? value.join(" ") : value[0];
      case "number":
        return Number.parseFloat(value[0]);
      case "boolean":
        return value[0].toLowerCase() === "true";
      // case "object":
      default:
        return value;
    }
  }

  private initializeFromEnvironmentVariables() {
    const matchingEnvKeys = Object.keys(process.env).filter((envKey) =>
      this.JSON_KEYS.includes(camelCase(envKey))
    );

    // Apply all values in memory first, then persist once.
    // Writing once per value caused concurrent fs.writeFile calls that
    // interleaved and corrupted config.json.
    matchingEnvKeys.forEach((envKey) => {
      // biome-ignore lint/style/noNonNullAssertion: already filtered above
      let envValue = [process.env[envKey]!];
      const configKey = camelCase(envKey);

      if (this.ARRAY_VALUES.includes(configKey)) {
        envValue = envValue[0].split(",");
      }

      this[configKey] = this.coerceValue(configKey, envValue);
    });

    if (matchingEnvKeys.length > 0) {
      this.writeToConfig();
    }
  }

  private writeToConfig() {
    try {
      // Synchronous on purpose: an async write interleaving with another
      // write to the same file leaves trailing bytes and corrupts the JSON.
      fs.writeFileSync(this.CONFIG_PATH, JSON.stringify(this, this.JSON_KEYS, 2));
    } catch (error) {
      console.error(error);
    }
  }
}
