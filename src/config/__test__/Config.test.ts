import fs from "node:fs";
import path from "node:path";

import Config from "../Config";

jest.mock("node:fs");
const randomString = (length: number) => Math.random().toString(36).substring(0, length);

describe("Default config", () => {
  const testedConfig = new Config();

  test("Default clientID and token are empty", () => {
    expect(testedConfig.clientId).toBe("");
    expect(testedConfig.token).toBe("");
  });

  test("Default language is English", () => {
    expect(testedConfig.language).toBe("en");
  });

  test("Default command prefix is !", () => {
    expect(testedConfig.prefix).toBe("!");
  });

  test("Default whitelisted extensions are mp3 and wav files", () => {
    expect(testedConfig.acceptedExtensions).toEqual([".mp3", ".wav"]);
  });

  test("Default maximum filesize is 1MB", () => {
    expect(testedConfig.maximumFileSize).toBe(1000000);
  });

  test("Default setting to delete messages is false", () => {
    expect(testedConfig.deleteMessages).toBe(false);
  });

  test("Default setting to stay in the channel is false", () => {
    expect(testedConfig.stayInChannel).toBe(false);
  });

  test("Default game is not set", () => {
    expect(testedConfig.game).toBe("SoundBoard");
  });
});

describe("Setting config from Environment Variables", () => {
  const OLD_ENVIRONMENT_VARIABLES = process.env;

  afterEach(() => {
    process.env = OLD_ENVIRONMENT_VARIABLES;
  });

  test("You can overwrite any string value from the environment", () => {
    process.env.CLIENT_ID = randomString(20);
    process.env.TOKEN = randomString(20);
    process.env.LANGUAGE = randomString(2);
    process.env.PREFIX = randomString(1);
    process.env.GAME = randomString(20);

    const testedConfig = new Config();

    expect(testedConfig.clientId).toEqual(process.env.CLIENT_ID);
    expect(testedConfig.token).toEqual(process.env.TOKEN);
    expect(testedConfig.language).toEqual(process.env.LANGUAGE);
    expect(testedConfig.prefix).toEqual(process.env.PREFIX);
    expect(testedConfig.game).toEqual(process.env.GAME);
  });

  test("You can set boolean config values to `true` from the environment", () => {
    process.env.DELETE_MESSAGES = "tRuE";
    process.env.STAY_IN_CHANNEL = "TruE";

    const testedConfig = new Config();

    expect(testedConfig.deleteMessages).toBe(true);
    expect(testedConfig.stayInChannel).toBe(true);
  });

  test("You can set boolean config values to `false` from the environment", () => {
    process.env.DELETE_MESSAGES = "false";
    process.env.STAY_IN_CHANNEL = "neen";

    const testedConfig = new Config();

    expect(testedConfig.deleteMessages).toBe(false);
    expect(testedConfig.stayInChannel).toBe(false);
  });

  test("You can set array config values by using comma seperation", () => {
    process.env.ACCEPTED_EXTENSIONS = ".mp3,.ogg,.wav,.mp4,.flac";
    process.env.ELEVATED_ROLES = "admin,test";

    const testedConfig = new Config();

    expect(testedConfig.acceptedExtensions).toEqual([".mp3", ".ogg", ".wav", ".mp4", ".flac"]);
    expect(testedConfig.elevatedRoles).toEqual(["admin", "test"]);
  });
});

describe("Persisting the config", () => {
  const CONFIG_ENV_KEYS = [
    "CLIENT_ID",
    "TOKEN",
    "LANGUAGE",
    "PREFIX",
    "ACCEPTED_EXTENSIONS",
    "MAXIMUM_FILE_SIZE",
    "DELETE_MESSAGES",
    "STAY_IN_CHANNEL",
    "TIMEOUT",
    "GAME",
    "ELEVATED_ROLES",
  ];

  // Earlier tests mutate process.env without restoring it, so make sure
  // no config environment variables leak into these tests
  beforeEach(() => {
    CONFIG_ENV_KEYS.forEach((key) => delete process.env[key]);
  });

  test("Constructing the config with multiple matching environment variables writes the file exactly once", () => {
    process.env.CLIENT_ID = randomString(20);
    process.env.TOKEN = randomString(20);
    process.env.GAME = randomString(20);

    new Config();

    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);

    const writeFileSync = fs.writeFileSync as unknown as jest.Mock;
    const [writtenPath, writtenContents] = writeFileSync.mock.calls[0];
    expect(writtenPath).toBe(path.join(process.cwd(), "config", "config.json"));
    expect(JSON.parse(writtenContents)).toEqual(
      expect.objectContaining({
        clientId: process.env.CLIENT_ID,
        token: process.env.TOKEN,
        game: process.env.GAME,
      })
    );
  });

  test("Constructing the config without matching environment variables does not write the file", () => {
    new Config();

    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  test("Changing a config option through set writes the file exactly once", () => {
    const testedConfig = new Config();

    expect(fs.writeFileSync).not.toHaveBeenCalled();

    testedConfig.set("game", ["My", "Sound", "Board"]);

    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    expect(testedConfig.game).toBe("My Sound Board");
  });
});
