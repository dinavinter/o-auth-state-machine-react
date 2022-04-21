import {screenSetService} from "./services/screen-service";
import {machineService} from "./services/machine-service";
import {createMachine, MachineConfig} from "xstate";
import {AnyMachine} from "./request";
import {screenMachineMachine} from "./screenSetMachine";

const common_services = {
    ['screen-set']: screenSetService,
    ['machine-service']: machineService((context, event) => screenMachineMachine(context)),
};

const common_actions = {
    logEventData: {
        type: 'xstate.log',
        label: 'events',
        expr: (context: any, event: any) => event
    }
};

export const activityMachine = (config: MachineConfig<any, any, any>): AnyMachine => createMachine(config).withConfig({
    services: common_services,
    actions: common_actions
});
