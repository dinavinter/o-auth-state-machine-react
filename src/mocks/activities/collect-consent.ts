import {AnyMachine} from "../../machines/request";
import {flowMachine} from "../../machines/flowMachine";
import {createMachine, MachineConfig} from "xstate";
import {ScreenEvents, ScreenSetContext} from "../../machines/screenSetMachine";
import {FormStates} from "../../machines/formMachine";

const activity = (): MachineConfig<ScreenSetContext, any, ScreenEvents> => {

    return {

        initial: FormStates.loading,
        states: {
            loading: {
                invoke: {
                    src: {
                        type: 'screen-set',
                        input: {
                            screen_set: 'Default-ProfileUpdate',
                            start_screen: 'gigya-privacy-screen',
                        }
                    }

                },
                on: {
                    After_Submit: "after_submit",


                },
            },
            after_submit: {
                invoke: [{
                    src: {
                        id: `signals/after_submit`,
                        type: 'signal-api',
                        input: {
                            signal: 'after-submit',
                        }

                    },
                    onError: FormStates.error,
                    onDone: FormStates.final
                },
                ],

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

        },


    }
}

export const collector = activity();
export default collector;

 