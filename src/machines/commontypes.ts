export declare type Props<T, Key extends keyof T = keyof T> = {
    [K in Key]: K
}

export declare type PromiseResolve<T = any> = (value: T | PromiseLike<T>) => void;
export declare type PromiseReject = (reason?: any) => void;
export declare type PromiseExecute<T = any> =
    {
        resolver: PromiseResolve<T>
        reject: PromiseReject
    }
export declare type EventWithPayload<Type extends string, Payload = any> = {
    type: Type,
    payload: Payload
}