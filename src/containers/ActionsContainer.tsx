import React, {useEffect} from "react";
import {AnyEventObject, AnyState, Interpreter, PayloadSender, StateLike, StateNode, TransitionDefinition} from "xstate";
import {
    Button,
    List,
    ListItem,
    ListItemText,
    makeStyles,
    Paper,
    Typography,
    AppBar,
    Box,
    responsiveFontSizes, createTheme, ThemeProvider
} from "@material-ui/core";
import {AuthService} from "../machines/authMachine";
import {useActor} from "@xstate/react";
import {EventObject, Sender} from "xstate/lib/types";

const useStyles = makeStyles((theme) => ({
    paper: {
        minHeight: "90vh",
        padding: theme.spacing(2),
        display: "flex",
        overflow: "auto",
        flexDirection: "row",
    },

    typography: {
        h5: {
            font: 'mono',
            fontStyle:'bold',
            fontWeight: 'bold'
        }
    },
}));

export interface Props {
    authService: AuthService;
}

const EventsContainer: React.FC<Props> = ({authService}) => {
    const classes = useStyles();
    const [authState] = useActor(authService);

    const sendEvent = authService.send;
    let theme = createTheme({
        typography: {
            h5: {
              font: 'mono',
                fontStyle:'bold',
                fontWeight: 'bold' 
            }
        },
    });
    theme = responsiveFontSizes(theme);

    return (
        // <div className="bg-white max-w-7xl mx-auto px-4 sm:px-6">
        <AppBar color="transparent" variant={"outlined"}>
            <Box sx={{display: 'flex', alignItems: 'center', textAlign: 'center'}}>
                {/*<div*/}
                {/*    className="flex justify-between items-center border-b-2 border-gray-100 py-6 md:justify-start md:space-x-10">*/}
                <div>
                    <a href="#">
                        <span className="sr-only">Workflow</span>
                        <img
                            className="h-8 w-auto sm:h-10"
                            src="https://tailwindui.com/img/logos/workflow-mark-indigo-600.svg"
                            alt=""
                        />

                    </a>

                </div>
                <ThemeProvider theme={theme}>

                    {authService.machine.events
                        .filter((event) => event && !event.startsWith('xstate.') && !event.endsWith('invocation[0]'))
                        .map((event) => {
                            return (
                                <Event state={authState} send={sendEvent} type={event}/>
                            );
                        })}

                </ThemeProvider>
                {/*</div>*/}
            </Box>
        </AppBar>


    );
};

export const Event = (props: { type: string, state: AnyState, send: PayloadSender<any> }) => {
    // const {flyJson} = useFlyPane(); 
    const classes = useStyles();

    const {state, send, type} = props;
    const defaultEvent = state.meta?.eventPayloads?.[type] || {};
    // const eventData = {
    //     ...defaultEvent,
    //     ...event,
    //     type: props.children,
    // };


    return (
        <Button
            onClick={() => {
                // flyJson(eventData, eventData.Type);
                send({
                    ...defaultEvent,
                    // ...event,
                    type: type,
                });
            }}
            // To override prose
            style={{margin: 2}}
        >     
      <Typography variant={"h5"}  className={`font-mono inline-flex flex-wrap font-bold text-sm`}>
        {type.split('.').map((a, index, array) => (
            <span
                key={index}
                className={`transition-colors py-1 ${index === 0 && 'pl-2'} ${
                    index === array.length - 1 && 'pr-2'
                } ${
                    state.nextEvents.includes(type)
                        ? `bg-yellow-100 text-yellow-800`
                        : 'bg-gray-100 text-gray-600'
                }`}
            >
          {a}
                {index !== array.length - 1 && '.'}
          </span>
        ))}
      </Typography>
        </Button>


    );
};

export default EventsContainer;
