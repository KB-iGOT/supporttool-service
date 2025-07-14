import React, { useContext, useEffect, useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import CardActions from "@mui/material/CardActions";
import Button from "@mui/material/Button";
import { Grid2, LinearProgress } from "@mui/material";
import { dashboardService } from "../../services/dashboard.service";
import { Module } from "../../types/modules";
import { useNavigate } from "react-router-dom";
import { appContextType } from "../../types";
import { AppContext } from "../../Context/AppContext";

export const Home = () => {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<{modules: Module[]; adminModules: Module[]}>({
    modules: [],
    adminModules: [],
  });
  const {userRoles} =  useContext(
      AppContext,
    ) as appContextType;

  const navigate = useNavigate();

    const fetchDashboardModules = async () => {
      setLoading(true);
      try {
        const data = await dashboardService.getModules();
        (data.status === 200) ?
        setList({
          modules: data.modules,
          adminModules: data.adminModules,
        }): 
        setList({
          modules: [],
          adminModules: [],
          });
      } catch (error) {
        console.error("Error fetching modules:", error);
      }
      setLoading(false);
    };


    useEffect(() => {
      fetchDashboardModules();
    },
    []);
  return (
    loading ? (
      <LinearProgress />
    ) : (
      <>
      <Grid2
        container
        rowSpacing={{ xs: 1, sm: 2, md: 3 }}
        columnSpacing={{ xs: 1, sm: 2, md: 3 }}
      >
        {list.modules.map((element, index) => (
          <Grid2 key={index} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <Card sx={{ minWidth: 275 }}>
              <CardContent>
                <Typography variant="h6" component="div">
                  {element.name}
                </Typography>
                {/* <Typography variant="body2">{element.description}</Typography> */}
              </CardContent>
              <CardActions>
                <Button size="small" onClick={()=>navigate(element.url,{ state: element })}>
                  Go to {element.name}
                </Button>
              </CardActions>
            </Card>
          </Grid2>
        ))}
      </Grid2>
      {list.adminModules.length > 0 && (
        <>
          <Typography variant="h5" component="h5" sx={{ marginTop: "2rem" }}>
            Admin Configurations
          </Typography>
          <Grid2
            container
            rowSpacing={{ xs: 1, sm: 2, md: 3 }}
            columnSpacing={{ xs: 1, sm: 2, md: 3 }}
          >
            {list.adminModules.map((element, index) => (
              <Grid2 key={index} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <Card sx={{ minWidth: 275 }}>
                  <CardContent>
                    <Typography variant="h6" component="div">
                      {element.name}
                    </Typography>
                    {/* <Typography variant="body2">{element.description}</Typography> */}
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={()=>navigate(element.url,{ state: element })}>
                      Go to {element.name}
                    </Button>
                  </CardActions>
                </Card>
              </Grid2>
            ))}
          </Grid2>
        </>
      )}
    </>
    )
  );
};
