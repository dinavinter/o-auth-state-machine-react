import {AnyEventObject, actions, Machine, ActorRef, MachineConfig, createMachine, StateMachine, spawn} from 'xstate'
import {apiMachine} from "./dispatcherMachine";
import {Interpreter} from "xstate/lib/interpreter";
import {AnyMachine, AnyRequestObject} from "./request";
import {ActorRefFrom} from "xstate/lib/types";

const {send, assign, log} = actions;
export type AnyService=Interpreter<any, any>;
declare type DynamicContextMachine =  {machine?: AnyMachine, loader: <TContext>(context:TContext) => Promise<AnyMachine>};
declare type ContextMachine<TContext = any >= TContext & DynamicContextMachine
// type ToDynamicMachineContext<T> = T extends AnyRequestObject infer R ? R : any;
const machineConfiguration:MachineConfig<any, any, any>={
    initial: 'loading',
    states: {
        loading: {
            // entry: send({type: 'FETCH'}, {to: 'load'}), 
            invoke: {
                src: 'load',
                // data: (context) => {
                //     return {
                //         request:
                //             {
                //                 href: context.machineUrl
                //             }
                //     }
                // },
                onDone: {target: 'loaded', actions: 'setMachine'},
                onError: 'error',
            },

        },
        loaded: {
            invoke: {
                src: 'machine',
                onDone: 'done',
                onError: 'error'
            }
        },
        done: {

            type: 'final'
        },
        error: {
            entry:log((x,event)=>'error ' +event.data),
            type: 'final'
        }
    }
}

export type DynamicMachine<TContext = any> =StateMachine< ContextMachine<TContext>,any, any> 
export function dynamic<TContext = any> ():DynamicMachine<TContext> {
    return createMachine<ContextMachine<TContext>, any, any>(machineConfiguration).withConfig(
        {
            services: {
                // load:   (context) => context.loader && await context.loader(context),
                machine: context => context.machine!
            },
            actions: {
                setMachine: assign({
                    machine: (context, event: AnyEventObject, meta) => event.data
                })
            }
        }
    );
}
export const dynamicMachine=Machine<{
    loader:any
    machine?: any
}, any, any>(
    {
       
        initial: 'loading',
        states: {
            loading: {
                // entry: send({type: 'FETCH'}, {to: 'load'}), 
                invoke: {
                    src: 'load',
                    // data: (context) => {
                    //     return {
                    //         request:
                    //             {
                    //                 href: context.machineUrl
                    //             }
                    //     }
                    // },
                    onDone: {target: 'loaded', actions: 'setMachine'},
                    onError: 'error',
                },

            },
            loaded: {
                invoke: {
                    src: 'machine',
                    onDone: 'done',
                    onError: 'error'
                }
            },
            done: {

                type: 'final'
            },
            error: {
                entry:log((x,event)=>'error ' +event.data),
                type: 'final'
            }
        }
    }).withConfig(
    {
        services: {
            // load:   (context) => context.loader && await context.loader(context),
            machine: context => context.machine!
        },
        actions: {
            setMachine: assign({
                machine: (context, event: AnyEventObject, meta) => spawn( event.data)
            })
        }
    }
);
export const machineLoader =
    Machine<{
        machineUrl?: string
        machine?: any
    }, any, any>(
        {
            initial: 'loading',
            states: {
                loading: {
                    // entry: send({type: 'FETCH'}, {to: 'load'}), 
                    invoke: {
                        src: 'load',
                        // data: (context) => {
                        //     return {
                        //         request:
                        //             {
                        //                 href: context.machineUrl
                        //             }
                        //     }
                        // },
                        onDone: {target: 'loaded', actions: 'setMachine'},
                        onError: 'error',
                    },

                },
                loaded: {
                    invoke: {
                        src: 'machine',
                        onDone: 'done',
                        onError: 'error'
                    }
                },
                done: {
                   
                    type: 'final'
                },
                error: {
                    entry:log((x,event)=>'error ' +event.data),
                    type: 'final'
                }
            }
        }).withConfig(
        {
            services: {
                load: async context => context.machineUrl && await import(context.machineUrl).then(e=>e.default),
                machine: context => context.machine!
            },
            actions: {
                setMachine: assign({
                    machine: (context, event: AnyEventObject) => event.data?.result
                })
            }
        }
    );

 

// const assignMachine: Action<any,  DoneInvokeEvent<{result:any}>> =  assign({
//     machine: (_, event)=>event.data.result
// });
