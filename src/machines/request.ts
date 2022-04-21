import {sendParent, ServiceConfig, StateMachine} from "xstate";
import {assign, send, actions, createMachine} from "xstate";
  


export type RequestMachineEvents<TRequest extends AnyRequestObject = AnyRequestObject,
  TResult extends AnyResultObject = AnyResultObject> =
  | { type: "SEND"; request: TRequest }
  | { type: "FETCH"; request: TRequest }
  | SuccessEvent
  |  RejectEvent
  | RequestMachineFinalEvents<TRequest, TResult>;

export interface RequestMachineContext<TRequest extends AnyRequestObject = AnyRequestObject,
  TResult extends AnyResultObject = AnyResultObject> {
  request?: TRequest;
  result?: TResult;
  error?: any; 
  [key: string]: any;

}

export interface AnyRequestObject {
  [key: string]: any;
}

export type AnyResultObject =
  | boolean
  | {
  [key: string]: any;
};

export interface AnyMachine extends StateMachine<any, any, any, any> {
}

export declare type RequestMachine<TRequest extends AnyRequestObject = AnyRequestObject,
  TResult extends AnyResultObject = AnyResultObject> =
  StateMachine<RequestMachineContext<TRequest, TResult>, any, RequestMachineEvents<TRequest, TResult>, any>;

export type RequestEvent<TRequest extends AnyRequestObject = AnyRequestObject> = { type: "SEND"; request: TRequest };
export type SuccessEvent<TResult extends AnyResultObject = AnyResultObject> = { type: "RESOLVE"; result: TResult };
export type RejectEvent  = { type: "REJECT"; error: any };

export type RequestMachineFinalEvents<TRequest, TResult> =
  | RequestEvent
  | ({ type: "REQUEST-SUCCESSFUL" } & RequestMachineContext<TRequest, TResult>)
  | { type: "REQUEST-FAILED" & RequestMachineContext<TRequest, TResult> };

declare type EventsType = {
  send: "SEND";
  success: "REQUEST-SUCCESSFUL";
  failed: "REQUEST-FAILED";
};

export const RequestMachineEventTypes: EventsType = {
  send: "SEND",
  success: "REQUEST-SUCCESSFUL",
  failed: "REQUEST-FAILED",
};

export declare type MachineService<TRequest extends AnyRequestObject = AnyRequestObject,
  TResult extends AnyResultObject = AnyResultObject> = ServiceConfig<RequestMachineContext<TRequest, TResult>, RequestMachineEvents<TRequest, TResult>>;

export declare type LoaderPromise<TRequest, TResult> = (
  request: TRequest
) => PromiseLike<TResult>;
// TContext extends  RequestMachineContext<TRequest, TResult>= RequestMachineContext<TRequest, TResult>,
// TEvent  extends  RequestMachineEvents<TRequest, TResult>= RequestMachineEvents<TRequest, TResult>,
// TRequestMachine  extends  StateMachine<TContext,any, TEvent, any>= RequestMachine<TRequest, TResult>,
// TService extends MachineService<TContext, TEvent > = MachineService<TContext, TEvent >

 

// declare interface MachineModel<TRequest extends AnyRequestObject = AnyRequestObject,
//   TResult extends AnyResultObject = AnyResultObject> extends Model<>{
//
// }
const {log} = actions;

export function requestMachine<TRequest extends AnyRequestObject = AnyRequestObject,
  TResult extends AnyResultObject = AnyResultObject>(machineId: string = 'loader'): RequestMachine<TRequest, TResult> {

  return createMachine<RequestMachineContext<TRequest, TResult>, RequestMachineEvents<TRequest, TResult>, any>(
    {
      id: `request.${machineId}`,
      initial:   "idle",
      context: {
       },
      states: {
        idle: {
          entry: [log("idle - entry"), "assignLoadService"],
          on: {
            
            FETCH: {
              target: "loading",
              actions: ["setRequest"],
            },
          },
        },
        loading: {
          entry: [log("loading - entry"), "onLoading"], 
          invoke: {
            src: 'execute',
            id: `loading`,
            onDone: {
            
              actions: send((_, event, _m) => {
                return {
                  type: "RESOLVE",
                  result: event.data,
                  time: Date.now()
                }
              }),
            },
            onError: {
              actions: [
                send((_, event, _m) => {
                  return {
                    type: "REJECT",
                    error: event.data,
                    time: Date.now()
                  }
                }),
              ],
            },
          },
          on: {
            RESOLVE: {target: "successful", internal: false},
            REJECT: {target: "failed", internal: false},
          },
        },
        failed: {
          entry: [log("failed - entry"), "onFailed", "setError"],
          on: {
            '': [
              {target: 'failure', cond: 'shouldNotRetry'},
            ]
          }
        },
        successful: {
          entry: [log("successful - entry"),"setResult", "onSuccess"],
          on: {
            '': [
              {target: 'done', cond: 'isDone'},
            ]
          }
        },
        done: {
          type: 'final',
          data: {
            request: (context:RequestMachineContext, _: RequestMachineEvents) => context.request,
            result: (context:RequestMachineContext, _: RequestMachineEvents) => context.result,
            error: (context:RequestMachineContext, _: RequestMachineEvents) => context.error,
            event: (context:RequestMachineContext, _: RequestMachineEvents) => event
          }
        },
        failure: {
          type: 'final',
          data: {
            request: (context:RequestMachineContext, _: RequestMachineEvents) => context.request,
            result: (context:RequestMachineContext, _: RequestMachineEvents) => context.result,
            error: (context:RequestMachineContext, _: RequestMachineEvents) => context.error,
            event: (context:RequestMachineContext, _: RequestMachineEvents) => event
          }
        }

      },
    },
    {
      actions: {
        // assignLoadService: assign((_) => ({
        //   loginService:  new Subject<SuccessEvent | RejectEvent>(),
        // })),
        setRequest: assign((context, event: any) => ({
          request: event.request || context.request,
        })),
        setResult: assign((_, event: any) => ({
          result: event.result,
        })),
        setError: assign((_, event: any) => ({
          error: event.error,
        })),

        sendFailedToParent: sendParent((context, _) => ({
          ...context,
          type: RequestMachineEventTypes.failed,
        })),
        sendSuccessToParent: sendParent((context, _) => ({
          ...context,
          type: RequestMachineEventTypes.failed,
        })),

        onLoading: log('on load'),
        onFailed: log('on failed'),
        onSuccess: log('on success'),


      },
      services: {},
      guards: {
        isDone: (context) =>
          context.result !== null ,

        shouldNotRetry: (_) =>
          true
      },
      
    }
  );
 

}



