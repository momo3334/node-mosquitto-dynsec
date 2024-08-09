import { MqttClient } from "mqtt";
import { AddRoleACLRequest, CreateClientRequest, GetClientResponse, ListClientsResponse, ListGroupsResponse, ListRequest, ListRolesResponse, RemoveRoleACLRequest } from "./command_types";
export interface ConnectOptions {
    hostname?: string;
    port?: number;
    protocol?: string;
    username?: string;
    password?: string;
}
export interface CommandPayload {
    command: string;
    [opt: string]: string;
}
export interface CommandResponse {
    command: string;
    data?: object;
    error?: string;
}
export interface ResponseTopicPayload {
    responses?: CommandResponse[];
}
type DefaultAclType = "publishClientSend" | "publishClientReceive" | "subscribe" | "unsubscribe";
interface DefaultACLEntry {
    acltype: DefaultAclType;
    allow: boolean;
}
export declare class MosquittoDynsec {
    private mqtt?;
    private pendingCommands;
    private apiVersion;
    timeoutSeconds: number;
    private onCommandResponse;
    setConnection(mqtt: MqttClient): void;
    connect(options?: ConnectOptions): Promise<void>;
    disconnect(): Promise<void>;
    sendCommand(commandName: string, commandParams?: object): Promise<object | void>;
    getDefaultACLAccess(acltype: DefaultAclType): Promise<any>;
    setDefaultACLAccess(acls: DefaultACLEntry[]): Promise<void>;
    listClients(params?: ListRequest): Promise<ListClientsResponse>;
    createClient(params: CreateClientRequest): Promise<void>;
    deleteClient(username: string): Promise<void | object>;
    setClientId(username: string, clientid: string): Promise<void | object>;
    setClientPassword(username: string, password: string): Promise<void>;
    getClient(username: string): Promise<GetClientResponse>;
    addClientRole(username: string, rolename: string, priority?: number): Promise<void>;
    removeClientRole(username: string, rolename: string): Promise<void>;
    enableClient(username: string): Promise<void>;
    disableClient(username: string): Promise<void>;
    createRole(rolename: string): Promise<void>;
    deleteRole(rolename: string): Promise<void>;
    getRole(rolename: string): Promise<{
        rolename: string;
        acls: string[];
    }>;
    listRoles(params?: ListRequest): Promise<ListRolesResponse>;
    addRoleACL(params: AddRoleACLRequest): Promise<void>;
    removeRoleACL(params: RemoveRoleACLRequest): Promise<void>;
    createGroup(groupname: string): Promise<void>;
    deleteGroup(groupname: string): Promise<void>;
    listGroups(params?: ListRequest): Promise<ListGroupsResponse>;
    getGroup(groupname: string): Promise<any>;
    getAnonymousGroup(): Promise<any>;
    setAnonymousGroup(groupname: string): Promise<void>;
    addGroupClient(groupname: string, username: string): Promise<void>;
    removeGroupClient(groupname: string, username: string): Promise<void>;
    addGroupRole(groupname: string, rolename: string, priority?: number): Promise<void>;
    removeGroupRole(groupname: string, rolename: string): Promise<void>;
}
export {};
