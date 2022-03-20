import * as React from 'react';
import JSONTree from 'react-json-view';
// import dynamic from "next/dynamic";

// const ReactJson = dynamic(
//     () => import ('react-json-view'),
//     { loading: () => <p>Loading ...</p>, ssr: false }
// )

const ReactJson = JSONTree;


export function JsonView({data}) {


    if (!data)
        return <div></div>
    return (
        <div>
            <ReactJson collapsed={false} theme={"bright:inverted"} src={data}/>
            {/*{window && <JSONTree data={data} theme="bright" shouldExpandNode={shouldExpandNode} />}*/}
        </div>
    );
}


export const JsonCard = ({data, title}) => {

    return (
        <JsonView data={data} />
    );
}

export default JsonView;
  
  
