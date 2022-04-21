import {FormEvents, formMachine, FormStates} from "./formMachine";
import {showScreenSet} from "../gigya/gigyaAuthMachine";
import fp,{omit,pick , keysIn} from "lodash/fp";

import {
    AnyEventObject,
    spawn,
    actions,
    createMachine,
    TransitionConfig,
    MachineConfig,
    InvokeCreator,
    ActorRef, Actor, BaseActorRef, LowInfer, sendParent
} from "xstate";
import {FlowEvents, flowMachine} from "./flowMachine";
import {AnyStateMachine, EventObject, InvokeMeta, Receiver, Sender, TransitionConfigOrTarget} from "xstate/lib/types";
import {
    IAfterScreenLoadEvent,
    IAfterSubmitEvent, IAfterValidationEvent, IBeforeScreenLoadEvent, IBeforeSubmitEvent,
    IBeforeValidationEvent,
    IErrorEvent,
    IHideEvent, IOnFieldChangedEvent, ISubmitEvent, ScreenSetParams
} from "../gigya/gigya-interface";
import {getEventType, normalizeTarget} from "xstate/es/utils";
import {dynamic, DynamicMachine, dynamicMachine, machineLoader} from "./dynamicMachine";
import {IndexByType} from "xstate/es/types";
import {respond} from "xstate/es/actions";
import {AnyMachine} from "./request";
import {getKeyEventProps} from "@testing-library/user-event/dist/keyboard/getEventProps";


const {assign, send} = actions;
declare type ScreenSetContext = {
    screen_set: string; start_screen: string; container_id?: string;
}

declare type ScreenEvent<Type extends string, Payload = any> = {
    type: Type,
    payload: Payload
}
export type BeforeValidationEventHandler = (e: IBeforeValidationEvent) => object | Promise<Object>;
export type BeforeSubmitEventHandler = (e: IBeforeSubmitEvent) => void | boolean; // Return Value: The event handler function may return "false" to cancel the submission.
export type BeforeScreenLoadEventHandler = (e: IBeforeScreenLoadEvent) => void;
export type AfterScreenLoadEventHandler = (e: IAfterScreenLoadEvent) => void;
export type FieldChangedEventHandler = (e: IOnFieldChangedEvent) => void;
export type AfterValidationEventHandler = (e: IAfterValidationEvent) => void;
export type AfterSubmitEventHandler = (e: IAfterSubmitEvent) => void;
export type SubmitEventHandler = (e: ISubmitEvent) => void;
export type ErrorEventHandler = (e: IErrorEvent) => void;
export type HideEventHandler = (e: IHideEvent) => void;
declare type PromiseResolve<T = any> = (value: T | PromiseLike<T>) => void;
declare type PromiseReject = (reason?: any) => void;
declare type PromiseExecute<T = any> =
    {
        resolver: PromiseResolve<T>
        reject: PromiseReject
    }

declare type ScreenEvents =
    | ScreenEvent<"Before_Screen_Load", IBeforeScreenLoadEvent>
    | ScreenEvent<"After_Screen_Load", IAfterScreenLoadEvent>
    | ScreenEvent<"Field_Changed", IOnFieldChangedEvent>
    | ScreenEvent<"Before_Validation", IBeforeValidationEvent & PromiseExecute>
    | ScreenEvent<"After_Validation", IAfterValidationEvent>
    | ScreenEvent<"Before_Submit", ISubmitEvent>
    | ScreenEvent<"After_Submit", IAfterSubmitEvent>
    | ScreenEvent<"Error", IErrorEvent>
    | ScreenEvent<"Hide", IHideEvent>
    // | ScreenEvent<"Callback", IHideEvent>

type EventConfig<Events extends { type: string, payload: any }> = {
    [E in Events as E["type"]]: { type: E["type"], payload: E["payload"] }
}


export type EventHandler = (e: any) => void | boolean;
export type OmitRequest<T> =  Omit<T, "requestParams">

declare function Callback<Event = AnyEventObject>(event: AnyEventObject): void

export declare type Prop<T, K> = K extends keyof T ? T[K] : never;
export declare type Values<T> = T[keyof T];


type EventPayload<Events extends { type: string, payload: any }> = {
    [E in Events as E["type"]]: E["payload"]
}



function forwardEvent(sender: Sender<any>):
    <Type extends keyof IndexByType<ScreenEvents>, TPayload extends EventPayload<ScreenEvents>>(type: Type) => EventHandler {
    return (type) => (event) => { 
        sender({type: type, payload: payloadClean(event)});
        return true;
    }
}


declare type EventSender = <Type extends keyof EventConfig<ScreenEvents>>(type: Type) => EventHandler

declare function event<Type extends keyof IndexByType<ScreenEvents>>(type: Type): Type;

// declare function transition<Type extends keyof EventConfig<ScreenEvents>>(type: Type, transition:TransitionConfig<ScreenSetContext, ScreenEvents>): {
//     [Type]: TransitionConfig<ScreenSetContext, ScreenEvents>
// }
// function transition<Type extends keyof EventConfig<ScreenEvents>>(type: Type, transition: TransitionConfigOrTarget<ScreenSetContext, ScreenEvents) {
//     return {[type]: transition}
// }

export const createScreenSetMachine = (screenSet: string, startScreen: string, containerId?: string) => formMachine<ScreenSetContext>(`${screenSet}/${startScreen}`)
    .withContext({
        screen_set: screenSet,
        start_screen: startScreen,
        container_id: containerId
    })
    .withConfig({
        services: {
            loader: (context, event) =>
                (callback, onReceive) => {
                    load(context, callback)
                }
        },


    });

type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any;

type PayloadType<TEvents extends { type: string, payload:  any }> = TEvents extends { type: string, payload:  infer TPayload }? TPayload: never;
declare const _payloadClean: <TPayload extends PayloadType<ScreenEvents>, PayloadProps extends keyof TPayload= keyof TPayload> (event:TPayload) => 
    Partial<Pick<TPayload, PayloadProps >>;


const  payloadClean    = (payload:any)=> payload as ReturnType<typeof _payloadClean>  ;
function logHandler  <Type extends keyof IndexByType<ScreenEvents>>(type: Type) : EventHandler
{
    
    return < TPayload  extends PayloadType<ScreenEvents>>(event:TPayload) => {
        
        log(JSON.stringify(_payloadClean(event)), type, 'Handler')
        return true;
    }
}
export function log(text: string, operation: string , title ='Log') {
    
        var backgroundColor = !operation ? "#00800033" : "#ff000033";
        console.info(
            `%c ${title} %c--> ` + text + "%c%s",
            `font-weight: bold; color: #333;background-color:${backgroundColor};`,
            "font-weight: normal;color:#aaa",
            "font-weight: bold;color:#f14668",
            operation ? " --> " + operation : ""
        );
    
}
function screenSet(input: { start_screen: string, screen_set: string, container_id?: string }, forwarder: EventSender) {
    const {start_screen, screen_set, container_id} = input;
    showScreenSet({
        containerID: container_id,
        screenSet: screen_set,
        startScreen: start_screen,
        // onBeforeScreenLoad: forwarder(Events.Before_Screen_Load),
        // onAfterScreenLoad: forwarder(Events.After_Screen_Load),
        // onBeforeValidation: forwarder(Events.Before-Validation),
        onAfterValidation: forwarder(Events.After_Validation),
        onFieldChanged: forwarder(Events.Field_Changed),
        // onSubmit: forwarder(Events.Before_Submit),
        onAfterSubmit: forwarder(Events.After_Submit),
        onError: forwarder(Events.Error),
        onHide: forwarder(Events.Hide)
    })
}

function load(context: ScreenSetContext, callback: Sender<ScreenEvents>) {
    // const args:ScreenSetParams ={
    //     containerID: context.containerId,
    //     screenSet: context.screenSet,
    //     startScreen: context.startScreen,
    //
    // };
    const forwarder = forwardEvent(callback);
    screenSet({
        screen_set: context.screen_set,
        start_screen: context.start_screen,
        container_id: context.container_id
    }, forwarder);

}

 
// export declare type Props<T> = {
//     [K in keyof T]: K
// };

export declare type Props<T, Key extends keyof T = keyof T> = {
    [K in Key]: K
};
export declare type ByType<T extends {
    type: string;
}> = {
    [K in T['type']]: K
};

declare function events<T extends object>(): Props<IndexByType<ScreenEvents>>;


let Events: Props<IndexByType<ScreenEvents>> = {
    After_Screen_Load: "After_Screen_Load",
    After_Submit: "After_Submit",
    After_Validation: "After_Validation",
    Before_Screen_Load: "Before_Screen_Load",
    Before_Submit: "Before_Submit",
    Before_Validation: "Before_Validation",
    Error: "Error",
    Field_Changed: "Field_Changed",
    Hide: "Hide"
};
// const machineConfiguration: MachineConfig<ScreenSetContext, any, ScreenEvents> = {
//
//     context: {
//         screen_set: 'Default-ProfileUpdate',
//         start_screen: 'gigya-update-profile-screen',
//
//     },
//
//     on: {
//         ["*"]: {actions: ['logEventData']},
//         [Events.Before_Screen_Load]: FormStates.loading,
//         [Events.After_Screen_Load]: FormStates.loaded,
//         // [Events.After_Validation]: FormStates.submitting,
//         [Events.Before_Submit]: FormStates.submitting,
//         [Events.After_Submit]: FormStates.success,
//         [Events.Error]: FormStates.error,
//
//     },
//     invoke: {
//         // autoForward: true,
//
//         data: ctx => {
//             return {
//                 screen_set: ctx.screen_set,
//                 start_screen: ctx.start_screen,
//
//             }
//         },
//         src: {
//
//             id: 'current',
//             type: 'screen-set',
//             input: {
//                 screen_set: 'Default-ProfileUpdate',
//                 start_screen: 'gigya-update-profile-screen',
//
//             }
//
//         },
//
//     },
//     initial: FormStates.idle,
//     states: {
//         [FormStates.idle]: {
//
//             on: {},
//             onEntry: ["enterIdle", "logEventData"],
//             onExit: "exitIdle",
//         },
//         [FormStates.loading]: {
//
//             on: {
//                 // [Events.After_Screen_Load]: FormStates.loaded,
//
//             },
//             onEntry: ["enterLoading", "logEventData"],
//             onExit: "exitLoading",
//         },
//         [FormStates.loaded]: {
//
//             onEntry: ["enterLoaded", "logEventData"],
//             onExit: "exitLoaded",
//
//         },
//
//
//         [FormStates.submitting]: {
//
//
//             onEntry: ["enterSubmitting", "logEventData"],
//             onExit: "exitSubmitting",
//
//         },
//         [FormStates.validation]: {
//
//             onEntry: ["enterValidation", "logEventData"],
//             onExit: "exitValidation",
//
//         },
//         [FormStates.success]: {
//
//             invoke: {
//                 src: {
//                     type: 'machine-service',
//                     machine: 'screen-set',
//                     input: {
//                         screenSet: 'Default-ProfileUpdate',
//                         startScreen: 'gigya-update-profile-screen',
//
//                     }
//                 }
//                 ,
//
//
//             },
//             onEntry: "enterSuccess",
//             onExit: "exitSuccess",
//
//         },
//         [FormStates.error]: {
//             onEntry: ["enterError", "logEventData"],
//             onExit: "exitError",
//
//         }
//
//     }
//
// }
const screenMachineConfig = (input: { screen_set: string, start_screen: string, container_id?: string }): MachineConfig<ScreenSetContext, any, ScreenEvents> => {
    return {

        id:  `activities/${input.screen_set}/${input.start_screen}`,
        on: {
            ["*"]: {actions: ['logEventData']},
            // [Events.Before_Screen_Load]: FormStates.loading,
            // [Events.After_Screen_Load]: FormStates.loaded,
            // [Events.After_Validation]: FormStates.submitting,
            // [Events.Before_Submit]: FormStates.submitting,
            [Events.After_Submit]: FormStates.success,
            [Events.Hide]: FormStates.success,
            [Events.Error]: FormStates.error,

        },
       
        initial: FormStates.load,
        states: {
            [FormStates.load]: {
                invoke: { 
                    src: {
                        id:  `activities/${input.screen_set}/${input.start_screen}/load`,
                        type: 'screen-set',
                        input: input

                    },

                }, 

                 onEntry: ["enterIdle", "logEventData"],
                onExit: "exitIdle",
            },
            [FormStates.loading]: {

                on: {
                    // [Events.After_Screen_Load]: FormStates.loaded,

                },
                onEntry: ["enterLoading", "logEventData"],
                onExit: "exitLoading",
            },
            [FormStates.loaded]: {

                onEntry: ["enterLoaded", "logEventData"],
                onExit: "exitLoaded",

            },


            [FormStates.submitting]: {


                onEntry: ["enterSubmitting", "logEventData"],
                onExit: "exitSubmitting",

            },


            [FormStates.validation]: {

                onEntry: ["enterValidation", "logEventData"],
                onExit: "exitValidation",

            },
            [FormStates.success]: {
                // type: "final",
                // data: {
                //
                //     type: "NEXT",
                //     machine: () => screenMachineConfig,
                //     input: {
                //         screen_set: 'Default-ProfileUpdate',
                //         start_screen: 'gigya-privacy-screen',
                //     }
                // },
                // invoke:{
                //  
                // } ,
             
                invoke: {
                    data: {
                        loader: (context: any) => Promise.resolve(screenMachineMachine(context.input)),

                         screen_set: 'Default-ProfileUpdate',
                        start_screen: 'gigya-privacy-screen',
                    },
                    // src: {
                    //     type: 'machine-service',
                    //     machine: 'screen-set',
                    //     input: {
                    //         screen_set: 'Default-ProfileUpdate',
                    //         start_screen: 'gigya-privacy-screen',
                    //
                    //     }
                    // }
                    src: 'machine-service',
                    onDone: FormStates.final
                },
                onEntry: "enterSuccess",
                onExit: "exitSuccess",


            },

            [FormStates.error]: {
                type: "final",

                onEntry: ["enterError", "logEventData"],
                onExit: "exitError",

            },
            [FormStates.canceled]: {
                type: "final",

                onEntry: ["enterError", "logEventData"],
                onExit: "exitError",

            },

            [FormStates.final]: {
                type: "final",
                onEntry: ["enterFinal", "logEventData"],
                onExit: "exitFinal",

            },
        }

    }
}


const screenMachine = createMachine(screenMachineConfig({
    screen_set: 'Default-ProfileUpdate',
    start_screen: 'gigya-update-profile-screen',
}));
const screenMachine2 = createMachine(screenMachineConfig({
    screen_set: 'Default-ProfileUpdate',
    start_screen: 'gigya-update-profile-screen',
}));
export declare type InvokeCallback<TEvent extends EventObject = AnyEventObject, TSentEvent extends EventObject = AnyEventObject> = (callback: Sender<TSentEvent>, onReceive: Receiver<TEvent>) => (() => void) | Promise<any> | void;
// function screenSetService(_c: any, _e: any, src:{input: {screen_set:string, start_screen:string} }) {
//     const {input} = src;
//     return (callback: (event: AnyEventObject) => void, onReceive: (listener: (event: AnyEventObject)=> void)):void => {
//         const forwarder = forwardEvent(callback);
//         screenSet(input, forwarder)
//     }


// }

declare type SrcWithInput<TInput = any> = { input: TInput }
declare type ScreenInput = { screen_set: string, start_screen: string } & { [key: string]: any }

declare type InvokeCallbackCreator<TContext = any, TSourceEvent extends EventObject = AnyEventObject> = (context: TContext, event: TSourceEvent, meta: InvokeMeta) => InvokeCallback<ScreenEvents>;

function screenSetService<TContext extends ScreenSetContext = ScreenSetContext, TSourceEvent extends EventObject = AnyEventObject>(context: TContext, event: TSourceEvent, meta: InvokeMeta) {
    return (callback: Sender<ScreenEvents>, onReceive: Receiver<TSourceEvent>) => {
        const {input, data} = meta.src;
        const forwarder = forwardEvent(callback);
        console.log(meta);
        console.log(context);
        screenSet(input, forwarder)
    }
}

export const activityMachine = (config: MachineConfig<any, any, any>): AnyMachine => createMachine(config).withConfig({
    services: common_services,
    actions: common_actions
});
export const screenMachineMachine = (input: ScreenSetContext): AnyMachine => activityMachine(screenMachineConfig(input)).withConfig({
    services: common_services,
    actions: common_actions
});

function machineService<TContext extends ScreenSetContext = ScreenSetContext, TSourceEvent extends EventObject = AnyEventObject>(context: TContext, event: TSourceEvent, meta: InvokeMeta) {
    const {machine, input} = meta.src;
    // respond({
    //     type: FlowEvents.NEXT,
    //     input: input,
    //     machine:()=>screenMachineMachine(input)
    // })
    // return screenActivity(input).withConfig({
    //     actions: {
    //         enterIdle: send(FlowEvents.DISPATCH)
    //     }
    // });
    // return Promise.resolve({
    //     type: FlowEvents.NEXT,
    //     input: input,
    //     machine: () => screenMachineMachine(input)
    // });
    console.log(context);
    console.log(input);
    console.log(meta);
    return dynamicMachine.withContext({loader: spawn(() => Promise.resolve(screenMachineMachine(input)))});
}


// const service: InvokeCallbackCreator = screenSetService;
const dMachine: DynamicMachine<ScreenSetContext> = dynamic<ScreenSetContext>().withConfig({
    services: {
        load: (context, event) => {
            console.log(context);
            // console.log(src);
            return Promise.resolve(screenMachineMachine(context))
        }
    }
})
const common_services = {
    ['screen-set']: screenSetService,
    ['machine-service']: dMachine,
    // ['machine-service']: dynamic<{machineRequest: AnyMachine}>().withConfig({
    //     services:{
    //         load:   (context,event, {src}) =>  {
    //             console.log(context);
    //             console.log(src);
    //             return spawn(Promise.resolve(screenMachineMachine(src.input)))}
    //     }
    // })
};

const common_actions = {
    logEventData: {
        type: 'xstate.log',
        label: 'events',
        expr: (context: any, event: any) => event
    }
};
export const activity = screenMachine.withConfig({
    services: common_services,
    actions: common_actions
});


export const screenActivity = (input: ScreenSetContext): AnyMachine => flowMachine<{ dispatcher: any }>().withContext({
    dispatcher: createMachine({id: 'empty'})
})
    .withConfig(
        {
            services: {
                dispatcher: context => context.dispatcher
                // dispatcher: formMachine().withConfig({
                //     services: {
                //         loader: activity
                //     }
                // })
            },
            actions: {
                assignDispatchAction: assign({
                    dispatcher: context => screenMachineMachine(input)
                })
            }
        });

export const profileScreen = screenActivity({
    screen_set: 'Default-ProfileUpdate',
    start_screen: 'gigya-update-profile-screen',
});
export const profileScreen1 = flowMachine<{ dispatcher: any }>()

    .withContext({
        dispatcher: createMachine({id: 'empty'})
    })
    .withConfig(
        {
            services: {
                dispatcher: context => context.dispatcher
                // dispatcher: formMachine().withConfig({
                //     services: {
                //         loader: activity
                //     }
                // })
            },
            actions: {
                // exitDispatching: (context , event) =>send({type:event.data.type, machine:ev}),
                assignDispatchAction: assign({
                    dispatcher: (context: { dispatcher: any }, event: AnyEventObject & { input: ScreenSetContext }) => spawn(screenMachineMachine({
                        screen_set: 'Default-ProfileUpdate',
                        start_screen: 'gigya-update-profile-screen',
                    }))//context => spawn(activity, activity.id)
                }),
                // assignNextAction: assign({
                //     dispatcher: (context: { dispatcher: any }, event: AnyEventObject & { machine: () => AnyMachine }) =>
                //         spawn(event.machine())//context => spawn(activity, activity.id)
                // })
            }
        }
    )

export const screenSetMachine = flowMachine<{ dispatcher: any }>('screen_set').withConfig({
    services: {
        dispatcher: context => context.dispatcher
    },
    actions: {
        enterDispatching: assign({
            dispatcher: spawn(profileScreen, profileScreen.id)
        })
    }
})

export default profileScreen;