import { Outlet } from "react-router-dom";

export const NonLoggedInPage = ()=>{
    return (
        <div>
        <Outlet />
        </div>
    );
}