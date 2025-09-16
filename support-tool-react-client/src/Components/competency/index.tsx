import * as React from 'react';
import { Box, Tabs, Tab } from "@mui/material";
import { CompetencyThemeList } from "./CompetencyTheme";
import { CompetencySubThemeList } from "./CompetencySubTheme";

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

export const Competency = () => {
    const [value, setValue] = React.useState(0);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} onChange={handleChange} aria-label="competency tabs">
                    <Tab label="Themes" {...a11yProps(0)} />
                    <Tab label="Sub-Themes" {...a11yProps(1)} />
                </Tabs>
            </Box>
            <CustomTabPanel value={value} index={0}>
                <CompetencyThemeList />
            </CustomTabPanel>
            <CustomTabPanel value={value} index={1}>
                <CompetencySubThemeList />
            </CustomTabPanel>
        </Box>
    );
}