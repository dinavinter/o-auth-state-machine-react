import {  FormStates} from "./formMachine";
 
import {
    actions,
    createMachine,
    MachineConfig
} from "xstate";

import {flowMachine} from "./flowMachine";
import {
    IAfterScreenLoadEvent,
    IAfterSubmitEvent, IAfterValidationEvent, IBeforeScreenLoadEvent, IBeforeValidationEvent,
    IErrorEvent,
    IHideEvent, IOnFieldChangedEvent, ISubmitEvent
} from "../gigya/gigya-interface";
import {IndexByType} from "xstate/es/types";
import {AnyMachine} from "./request";
import {activityMachine} from "./activityMachine";
import {EventWithPayload, Props} from "./commontypes";


const {assign} = actions;

export declare type ScreenSetContext = {
    screen_set: string; start_screen: string; container_id?: string;
}

 

export declare type ScreenEvents =
    | EventWithPayload<"Before_Screen_Load", IBeforeScreenLoadEvent>
    | EventWithPayload<"After_Screen_Load", IAfterScreenLoadEvent>
    | EventWithPayload<"Field_Changed", IOnFieldChangedEvent>
    | EventWithPayload<"Before_Validation", IBeforeValidationEvent  >
    | EventWithPayload<"After_Validation", IAfterValidationEvent>
    | EventWithPayload<"Before_Submit", ISubmitEvent>
    | EventWithPayload<"After_Submit", IAfterSubmitEvent>
    | EventWithPayload<"Error", IErrorEvent>
    | EventWithPayload<"Hide", IHideEvent>
// | ScreenEvent<"Callback", IHideEvent>


 

 
 
export let ScreenEvents: Props<IndexByType<ScreenEvents>> = {
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

const screenMachineConfig = (input: { screen_set: string, start_screen: string, container_id?: string }): MachineConfig<ScreenSetContext, any, ScreenEvents> => {
    return {

        id: `activities/${input.screen_set}/${input.start_screen}`,
        on: {
            ["*"]: {actions: ['logEventData']},
            // [Events.Before_Screen_Load]: FormStates.loading,
            // [Events.After_Screen_Load]: FormStates.loaded,
            // [Events.After_Validation]: FormStates.submitting,
            // [Events.Before_Submit]: FormStates.submitting,
            [ScreenEvents.After_Submit]: FormStates.success,
            [ScreenEvents.Hide]: FormStates.success,
            [ScreenEvents.Error]: FormStates.error,

        },

        initial: FormStates.load,
        states: {
            [FormStates.load]: {
                invoke: {
                    src: {
                        id: `activities/${input.screen_set}/${input.start_screen}/load`,
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


export const screenMachineMachine = (input: ScreenSetContext): AnyMachine => activityMachine(screenMachineConfig(input));


export const screenActivity = (input: ScreenSetContext): AnyMachine => flowMachine<{ dispatcher: any }>().withContext({
    dispatcher: createMachine({id: 'empty'})
})
    .withConfig(
        {
            services: {
                dispatcher: context => context.dispatcher

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


export default profileScreen;