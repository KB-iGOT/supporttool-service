import React, { useContext, useEffect, useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import CardActions from "@mui/material/CardActions";
import Button from "@mui/material/Button";
import { Grid2, LinearProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { appContextType } from "../../types";
import { AppContext } from "../../Context/AppContext";

export const Home = () => {
  const { modules, loading, fetchModules } = useContext(AppContext) as appContextType;

  const navigate = useNavigate();

  useEffect(() => {
    // fetchModules is memoized by useCallback, so this is safe.
    fetchModules();
  }, [fetchModules]);
  
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
        {modules.user.map((element, index) => (
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
      {modules.admin.length > 0 && (
        <>
          <Typography variant="h5" component="h5" sx={{ marginTop: "2rem" }}>
            Admin Configurations
          </Typography>
          <Grid2
            container
            rowSpacing={{ xs: 1, sm: 2, md: 3 }}
            columnSpacing={{ xs: 1, sm: 2, md: 3 }}
          >
            {modules.admin.map((element, index) => (
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
