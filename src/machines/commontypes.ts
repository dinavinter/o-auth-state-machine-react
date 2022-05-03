import {Values} from "xstate/lib/types";
import {AnyEventObject, Prop} from "xstate";
import {IndexByType} from "xstate/es/types";
import {ScreenEvents} from "./screenSetMachine";

export declare type Props<T, Key extends keyof T = keyof T> = {
    [K in Key]: K
}
export declare type EventTypes<TEvents extends {type:string}> =Props<IndexByType<TEvents>>

type Record<K extends keyof any, T> = {
    [P in K]: T;
};

export declare type LowerValues<T extends Record<any, any>, Key extends keyof T = keyof T, Value = Lowercase<Prop< T, Key>> >= {
    [K in Key]: Value
}
export declare type LowerKeys<T extends Record<any, any>, Key extends keyof T & string= keyof T & string, Value = Prop< T, Key> >= {
    [K in Key as Lowercase<K >]: Value
}

export declare type EmptyValue<T extends Record<any, any>, Key extends keyof T = keyof T, Value = {} >= {
    [K in Key]: { }
}

// type TMapper<TArg, T = (args: TArg) => any> = T extends  (...args: any) => infer R ? R : any;
// type TMapper=<T extends (...args: any) => any> =  (...args: any):any;
type MapHandler<TSource, TResult> = (args: TSource) => TResult


export declare type PropsWith<T, TMapper extends MapHandler<keyof T, any>> =
    TMapper extends MapHandler<keyof T, infer R> ?
        {
            [K in keyof T]: R
        } : never;

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

declare type InferStates<TEvents extends AnyEventObject > = LowerValues<EventTypes<TEvents> >;

declare type InferAutoTransitions<TEvents extends AnyEventObject, TStates= InferStates<TEvents>, TEvent = keyof TStates>= {
    [K in keyof TStates] :TStates[K]
}
// declare function autoTransitions<TEvents extends AnyEventObject>(): InferAutoTransitions<TEvents>;

declare type AutoTransitions<TEvents extends AnyEventObject> = ()=> InferAutoTransitions<TEvents>

interface Transitions {
    <TEvents extends AnyEventObject>():InferAutoTransitions<TEvents>
}

// function autoStates<T extends EventTypes<any>>(events: T):{ [p: InferStates<T>]: {} }{
//     return Object.keys(events).reduce((acc, event) => { 
//         return {...acc, [event.toLowerCase()]:{}};
//     }, {});
//
// }