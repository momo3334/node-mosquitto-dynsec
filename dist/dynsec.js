"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MosquittoDynsec = void 0;
const mqtt_1 = require("mqtt");
class MosquittoDynsec {
    constructor() {
        this.pendingCommands = {};
        this.apiVersion = "v1";
        this.timeoutSeconds = 2;
    }
    onCommandResponse(topic, payload) {
        if (!Array.isArray(payload.responses))
            throw new Error("Invalid ResponseTopicPayload");
        // resolve pending promises
        payload.responses.forEach((res) => {
            // console.log("Got command response: ", res)
            const pendingCommand = this.pendingCommands[res.command];
            if (!pendingCommand)
                return console.warn(`Received response for unsent command '${res.command}'`, res.data);
            delete this.pendingCommands[res.command];
            if (res.error) {
                // console.log("rejecting command", res.command, res.error)
                pendingCommand.reject(res.error);
            }
            else {
                // console.log("resolving command", res.command, res.data)
                pendingCommand.resolve(res.data);
            }
        });
    }
    setConnection(mqtt) {
        this.mqtt = mqtt;
    }
    connect(options = {}) {
        // set defaults
        const hostname = options.hostname || "localhost";
        const port = options.port || 1883;
        const protocol = options.protocol || "mqtt";
        const username = options.username || "admin-user";
        const password = options.password;
        const url = `${protocol}://${hostname}:${port}`;
        const mqtt = (0, mqtt_1.connect)(url, { username, password });
        const responseTopic = "$CONTROL/dynamic-security/" + this.apiVersion + "/response";
        mqtt.on("message", (topic, payload) => {
            this.onCommandResponse.call(this, topic, JSON.parse(String(payload)));
        });
        return new Promise((resolve, reject) => {
            mqtt.on("error", () => {
                reject();
            });
            mqtt.on("connect", () => {
                // console.log("on-connect")
                mqtt.subscribe(responseTopic);
                this.mqtt = mqtt;
                resolve();
            });
        });
    }
    disconnect() {
        return new Promise((resolve) => {
            if (!this.mqtt)
                return resolve();
            this.mqtt.end(true, {}, error => resolve());
        });
    }
    sendCommand(commandName, commandParams = {}) {
        if (!this.mqtt)
            throw new Error("Can't sendCommand: not connected yet.");
        // command pending
        if (this.pendingCommands[commandName])
            throw new Error(`Command ${commandName} already is pending.`);
        // create pending command
        const commandPromise = new Promise((resolve, reject) => {
            this.pendingCommands[commandName] = { resolve, reject };
        });
        // send command
        const command = Object.assign({}, commandParams, { command: commandName });
        const payload = JSON.stringify({ commands: [command] });
        this.mqtt.publish("$CONTROL/dynamic-security/v1", payload);
        const timeoutPromise = new Promise((resolve, reject) => {
            setTimeout(() => reject("COMMAND_TIMEOUT"), 1000 * this.timeoutSeconds);
        });
        return Promise.race([commandPromise, timeoutPromise]);
    }
    getDefaultACLAccess(acltype) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.sendCommand("getDefaultACLAccess", { acltype });
            return res.acls;
        });
    }
    setDefaultACLAccess(acls) {
        return this.sendCommand("setDefaultACLAccess", { acls });
    }
    listClients(params = {}) {
        return this.sendCommand("listClients", params);
    }
    createClient(params) {
        return this.sendCommand("createClient", params);
    }
    deleteClient(username) {
        return this.sendCommand("deleteClient", { username });
    }
    setClientId(username, clientid) {
        return this.sendCommand("setClientId", { username, clientid });
    }
    setClientPassword(username, password) {
        return this.sendCommand("setClientPassword", { username, password });
    }
    getClient(username) {
        return __awaiter(this, void 0, void 0, function* () {
            const promise = this.sendCommand("getClient", { username });
            const res = yield promise;
            return res.client;
        });
    }
    addClientRole(username, rolename, priority) {
        return this.sendCommand("addClientRole", { username, rolename, priority });
    }
    removeClientRole(username, rolename) {
        return this.sendCommand("removeClientRole", { username, rolename });
    }
    enableClient(username) {
        return this.sendCommand("enableClient", { username });
    }
    disableClient(username) {
        return this.sendCommand("disableClient", { username });
    }
    // role commands
    createRole(rolename) {
        return this.sendCommand("createRole", { rolename });
    }
    deleteRole(rolename) {
        return this.sendCommand("deleteRole", { rolename });
    }
    getRole(rolename) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.sendCommand("getRole", { rolename });
            return res.role;
        });
    }
    listRoles(params = {}) {
        return this.sendCommand("listRoles", params);
    }
    addRoleACL(params) {
        return this.sendCommand("addRoleACL", params);
    }
    removeRoleACL(params) {
        return this.sendCommand("removeRoleACL", params);
    }
    // group commands
    createGroup(groupname) {
        return this.sendCommand("createGroup", { groupname });
    }
    deleteGroup(groupname) {
        return this.sendCommand("deleteGroup", { groupname });
    }
    listGroups(params = {}) {
        return this.sendCommand("listGroups", params);
    }
    getGroup(groupname) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.sendCommand("getGroup", { groupname });
            return res.group;
        });
    }
    getAnonymousGroup() {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.sendCommand("getAnonymousGroup");
            return res.group;
        });
    }
    setAnonymousGroup(groupname) {
        return this.sendCommand("setAnonymousGroup", { groupname });
    }
    addGroupClient(groupname, username) {
        return this.sendCommand("addGroupClient", { groupname, username });
    }
    removeGroupClient(groupname, username) {
        return this.sendCommand("removeGroupClient", { groupname, username });
    }
    addGroupRole(groupname, rolename, priority) {
        return this.sendCommand("addGroupRole", { groupname, rolename, priority });
    }
    removeGroupRole(groupname, rolename) {
        return this.sendCommand("removeGroupRole", { groupname, rolename });
    }
}
exports.MosquittoDynsec = MosquittoDynsec;
