import React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import CardActions from "@mui/material/CardActions";
import Button from "@mui/material/Button";
import { Grid2 } from "@mui/material";
import CONSTANTS from "../../Config/Constants";

export const Home = () => {
  return (
    <>
      <Grid2
        container
        rowSpacing={{ xs: 1, sm: 2, md: 3 }}
        columnSpacing={{ xs: 1, sm: 2, md: 3 }}
      >
        {CONSTANTS.DASHBOARDELEMENTS.map((element, index) => (
          <Grid2 key={index} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <Card sx={{ minWidth: 275 }}>
              <CardContent>
                <Typography variant="h6" component="div">
                  {element.title}
                </Typography>
                <Typography variant="body2">{element.description}</Typography>
              </CardContent>
              <CardActions>
                <Button size="small" href={element.link}>
                  Go to {element.title}
                </Button>
              </CardActions>
            </Card>
          </Grid2>
        ))}
      </Grid2>
      <Typography variant="h5" component="h5" sx={{ marginTop: "2rem" }}>
        Admin Configurations
      </Typography>
      <Grid2
        container
        rowSpacing={{ xs: 1, sm: 2, md: 3 }}
        columnSpacing={{ xs: 1, sm: 2, md: 3 }}
      >
        {CONSTANTS.ADMINELEMENTS.map((element, index) => (
          <Grid2 key={index} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <Card sx={{ minWidth: 275 }}>
              <CardContent>
                <Typography variant="h6" component="div">
                  {element.title}
                </Typography>
                <Typography variant="body2">{element.description}</Typography>
              </CardContent>
              <CardActions>
                <Button size="small" href={element.link}>
                  Go to {element.title}
                </Button>
              </CardActions>
            </Card>
          </Grid2>
        ))}
      </Grid2>
    </>
  );
};
