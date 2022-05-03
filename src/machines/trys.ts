import {EventObject, IndexByType, InvokeMeta, Receiver, Sender} from "xstate/lib/types";
import {AnyEventObject, MachineConfig, spawn} from "xstate";
import {dynamicMachine} from "./dynamicMachine";
import fp, {omit, pick, keysIn} from "lodash/fp";

import {ScreenEvents, screenSetMachine} from "./screenSetMachine";
import {formMachine, FormStates} from "./formMachine";
import {EventHandler, ExtractPayloadByType, screenSet} from "./services/screen-service";
import {ExtractEvent} from "xstate/es";
declare type ScreenSetContext = {
    screen_set: string; start_screen: string; container_id?: string;
}


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


    })
function forwardEvent(sender: Sender<any>):
    <Type extends keyof IndexByType<ScreenEvents>, TPayload = ExtractEvent<ScreenEvents, Type>>(type: Type) => EventHandler<TPayload> {
    return (type) => (event) => {
        sender({type: type, payload: event });
        return true;
    }
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
    return dynamicMachine.withContext({loader: spawn(() => Promise.resolve(screenSetMachine(input)))});
}


// declare function transition<Type extends keyof EventConfig<ScreenEvents>>(type: Type, transition:TransitionConfig<ScreenSetContext, ScreenEvents>): {
//     [Type]: TransitionConfig<ScreenSetContext, ScreenEvents>
// }
// function transition<Type extends keyof EventConfig<ScreenEvents>>(type: Type, transition: TransitionConfigOrTarget<ScreenSetContext, ScreenEvents) {
//     return {[type]: transition}
// }

///types
export declare type InvokeCallback<TEvent extends EventObject = AnyEventObject, TSentEvent extends EventObject = AnyEventObject> = (callback: Sender<TSentEvent>, onReceive: Receiver<TEvent>) => (() => void) | Promise<any> | void;

declare type SrcWithInput<TInput = any> = { input: TInput }
declare type ScreenInput = { screen_set: string, start_screen: string } & { [key: string]: any }

declare type InvokeCallbackCreator<TContext = any, TSourceEvent extends EventObject = AnyEventObject> = (context: TContext, event: TSourceEvent, meta: InvokeMeta) => InvokeCallback<ScreenEvents>;


//machines
const machineConfiguration: MachineConfig<ScreenSetContext, any, ScreenEvents> = {

    context: {
        screen_set: 'Default-ProfileUpdate',
        start_screen: 'gigya-update-profile-screen',

    },

    on: {
        ["*"]: {actions: ['logEventData']},
        [ScreenEvents.Before_Screen_Load]: FormStates.loading,
        [ScreenEvents.After_Screen_Load]: FormStates.loaded,
        // [Events.After_Validation]: FormStates.submitting,
        [ScreenEvents.Before_Submit]: FormStates.submitting,
        [ScreenEvents.After_Submit]: FormStates.success,
        [ScreenEvents.Error]: FormStates.error,

    },
    invoke: {
        // autoForward: true,

        data: (ctx )=> {
            return {
                screen_set: ctx.screen_set,
                start_screen: ctx.start_screen,

            }
        },
        src: {

            id: 'current',
            type: 'screen-set',
            input: {
                screen_set: 'Default-ProfileUpdate',
                start_screen: 'gigya-update-profile-screen',

            }

        },

    },
    initial: FormStates.idle,
    states: {
        [FormStates.idle]: {

            on: {},
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

            invoke: {
                src: {
                    type: 'machine-service',
                    machine: 'screen-set',
                    input: {
                        screenSet: 'Default-ProfileUpdate',
                        startScreen: 'gigya-update-profile-screen',

                    }
                }
                ,


            },
            onEntry: "enterSuccess",
            onExit: "exitSuccess",

        },
        [FormStates.error]: {
            onEntry: ["enterError", "logEventData"],
            onExit: "exitError",

        }

    }

}