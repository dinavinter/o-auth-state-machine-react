import {createMachine, Typestate} from "xstate";
import {
    AfterScreenLoadEventHandler,
    AfterSubmitEventHandler,
    AfterValidationEventHandler, BeforeScreenLoadEventHandler, BeforeSubmitEventHandler,
    BeforeValidationEventHandler,
    ErrorEventHandler, FieldChangedEventHandler,
    HideEventHandler, SubmitEventHandler
} from "../gigya/events.interface";
  
export const FormStates = {
    idle: 'idle',
    load: 'load',
    loading: 'loading',
    loaded: 'loaded',
    submitting: 'submitting',
    interruption: 'interruption',
    success: 'success',
    error: 'error',
    canceled: 'canceled',
    validation: 'validation',
    final: 'final'

}
export const FormEvents = {
    LOAD: 'LOAD',
    LOAD_SUCCESS: 'LOAD_SUCCESS',
    CANCEL: 'CANCEL',
    SUCCESS: 'SUCCESS',
    SUBMIT: 'SUBMIT',
    FAILURE: 'FAILURE',
    INTERRUPT: 'INTERRUPT',


}



export interface FormSchema<TContext = any> extends  Typestate<TContext>{
     
    states: {
        idle: {};
        loading: {};
        loaded: {};
        submitting: {};
        interruption: {};
        success: {};
        error: {};
    };
}

export const formMachine = <TContext = any>(id: string = "form") => createMachine<TContext, any, FormSchema<TContext>>({

    id: id,
    initial: FormStates.idle,
    states: {
        [FormStates.idle]: {
            on: {
                [FormEvents.LOAD]: FormStates.loading,
            },
        },
        [FormStates.loading]: {
            invoke: {
                src: "loader"
            },
            on: {
                [FormEvents.LOAD_SUCCESS]: FormStates.loaded,
            },
            onEntry: "enterLoading",
            onExit: "exitLoading",
        },
        [FormStates.loaded]: {
            on: {
                [FormEvents.SUBMIT]: FormStates.submitting,
            },
            onEntry: "enterLoaded",
            onExit: "exitLoaded",

        },
        [FormStates.submitting]: {
            on: {
                [FormEvents.SUCCESS]: FormStates.success,
                [FormEvents.FAILURE]: FormStates.error,
                [FormEvents.INTERRUPT]: FormStates.interruption,
            },
            onEntry: "enterSubmitting",
            onExit: "exitSubmitting",
        },
        [FormStates.interruption]: {
            invoke: {
                src: "interrupter"
            },
            on: {
                [FormEvents.SUCCESS]: FormStates.success,
                [FormEvents.FAILURE]: FormStates.error,
                [FormEvents.INTERRUPT]: FormStates.interruption,
            },
            onEntry: "enterInterruption",
            onExit: "exitInterruption",
        },
        [FormStates.success]: {
            type: 'final',
            data: {
                outcome: (context: any, event: any) => event.outcome,
                output: (context: any, event: any) => event.data
            },
            onEntry: "enterSuccess",
            onExit: "exitSuccess",


        },
        [FormStates.canceled]: {
            type: 'final',
            onEntry: "enterCanceled",
            onExit: "exitCanceled",
        },
        [FormStates.error]: {
            on: {
                [FormEvents.SUBMIT]: [FormStates.submitting],
            },
            onEntry: "enterError",
            onExit: "exitError",

        },
    },
   
});


