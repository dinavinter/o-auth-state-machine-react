import {createMachine, Typestate, actions} from "xstate";

const {send} = actions;

const FlowStates = {
    suspended: 'suspended',
    idle: 'idle',
    dispatching: 'dispatching',
    evaluating: 'evaluating',
    completed: 'completed',
    error: 'completed',
    canceled: 'canceled'
}

export const FlowEvents = {
    DISPATCH: 'DISPATCH',
    INTERRUPT: 'INTERRUPT',
    NEXT: 'NEXT',
    SUCCESS: 'SUCCESS',
    FAILURE: 'FAILURE',
    CANCEL: 'CANCEL'


}
export type ActionClass = string | string[];
export type Action = {
    class?: ActionClass,
    name: string
}

declare type FlowContext = {
    next?: Action
    // currentMachine: any
}


export interface FlowStateSchema<TContext = any> extends Typestate<TContext> {

    states: {
        idle: {};
        dispatching: {};
        completed: {};
        canceled: {};
        evaluating: {};
    };
}

function orEmpty(obj: any) {
    return obj || {}
}

export const flowMachine = <TContext = FlowContext>(id: string = "flow") => createMachine<TContext & FlowContext, any, FlowStateSchema<TContext>>({

    id: id,
    initial: FlowStates.idle,
    // on: {
    //     [FlowEvents.NEXT]: [{actions: "assignNextAction"}]
    // },
    states: {
        [FlowStates.idle]: {

            on: {
                [FlowEvents.DISPATCH]: [{target: FlowStates.dispatching,actions: "assignDispatchAction"}],
                // '': [
                //     {target: FlowStates.completed, cond:  (c)=>!c.next},
                //     {target: FlowStates.dispatching, cond: (c)=>!!c.next},
                // ], 
            },
            entry: "enterIdle",
            exit: "exitIdle"
        },
        [FlowStates.dispatching]: {


            invoke: {
                src: "dispatcher",
                id: "dispatcher-service",
                autoForward: true,
                data: (context: any, event: any) => {
                    const input = {...orEmpty(context.next?.input), ...orEmpty(event.input)};
                    return {
                        input:context,
                        action: context.next,
                        context: context.data,
                        ...input
                    }
                },
                onDone:FlowStates.completed

            },


            on: {
                [FlowEvents.NEXT]: {target: FlowStates.dispatching, actions: "assignNextAction"},
                [FlowEvents.FAILURE]: FlowStates.error,
                [FlowEvents.SUCCESS]: FlowStates.idle,
            },
            entry: "enterDispatching",
            exit: [ "exitDispatching"],
        },
        [FlowStates.evaluating]: {
            on: {
                '': [
                    {target: FlowStates.completed, cond: 'isCompleted'},
                    {target: FlowStates.dispatching, cond: 'hasNext'},
                ],
            },
        },

        [FlowStates.completed]: {
            type: 'final',
            data: {
                outcome: (context: any, event: any) => event.outcome,
                output: (context: any, event: any) => event.data
            },
            entry: "enterCompleted",
            exit: "exitCompleted",


        },
    },
    [FlowStates.canceled]: {
        type: 'final',
        entry: "enterCanceled",
        exit: "exitCanceled",
    },
    [FlowStates.error]: {
        on: {
            [FlowEvents.DISPATCH]: FlowStates.dispatching,
        },
        entry: "enterError",
        exit: "exitError",

    },
});


// function interrupt(context: ScreenSetContext, callback: (event: AnyEventObject) => void) {
//
//
// }
//
//
// const map = (response) => {
//     response
//         .actions
//         .where(a => a.class.contains('after-login'))
//         .map(onLogin += followLink(a))
//
//     response
//         .actions
//         .where(a => a.class.contains('after-submit'))
//         .map(onAfterSubmit += followLink(a))
//
//     response
//         .actions
//         .where(a => a.class.contains('screen-set'))
//         .map(showScreenSet(a.name));
// }
//
// interrupter: (context, event) =>
//     (callback, onReceive) => {
//         interrupt(context, callback)
//     }
