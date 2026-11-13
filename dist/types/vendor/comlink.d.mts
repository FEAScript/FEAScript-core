export const createEndpoint: unique symbol;
export function expose(obj: any, ep?: typeof globalThis, allowedOrigins?: string[]): void;
export const finalizer: unique symbol;
export function proxy(obj: any): any;
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export const proxyMarker: unique symbol;
export const releaseProxy: unique symbol;
export function transfer(obj: any, transfers: any): any;
/**
 * Allows customizing the serialization of certain values.
 */
export const transferHandlers: Map<string, {
    canHandle: (val: any) => any;
    serialize(obj: any): (MessagePort | MessagePort[])[];
    deserialize(port: any): any;
}>;
export function windowEndpoint(w: any, context?: typeof globalThis, targetOrigin?: string): {
    postMessage: (msg: any, transferables: any) => any;
    addEventListener: typeof addEventListener;
    removeEventListener: typeof removeEventListener;
};
export function wrap(ep: any, target: any): any;
