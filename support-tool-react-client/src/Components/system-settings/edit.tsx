import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import { systemSettingsService } from "../../services/system-settings.service";
import { Editor } from "./editor";

export const Edit = () => {
    const { id } = useParams();
    const [input, setInput] = React.useState<string>('');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_configData, setConfigData] = React.useState<any>({});

    const getConfigData = async () => {
        let response = await systemSettingsService.getConfig(id);
        if (response.responseCode === 'OK') {
            setConfigData(response.result.response);
            setInput(response.result.response.value);
        }
    }

    const handleChange = (data: any) => {
        setInput(data);
    }

    useMemo(()=>{
        getConfigData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[id]);
    
    return (
       <Editor input={input} onChange={handleChange} />
    )
}