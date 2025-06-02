import { Button, Card, CardActions, CardContent, Grid2, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

export const ModuleCards = () => {
    const navigate = useNavigate();
    const modules = [
        { name: "News Letter", url: "/non-logged-in-page/news" },
        { name: "Photo Gallery", url: "/non-logged-in-page/gallery" },
        { name: "Careers", url: "/non-logged-in-page/career" },
        { name: "Tenders", url: "/non-logged-in-page/tender" },
        { name: "Notifications", url: "/non-logged-in-page/notification" }
    ];
    return (
        
      <Grid2
      container
      rowSpacing={{ xs: 1, sm: 2, md: 3 }}
      columnSpacing={{ xs: 1, sm: 2, md: 3 }}
    >
      {modules.map((element, index) => (
        <Grid2 key={index} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Card sx={{ minWidth: 275 }}>
            <CardContent>
              <Typography variant="h6" component="div">
                {element.name}
              </Typography>
              {/* <Typography variant="body2">{element.description}</Typography> */}
            </CardContent>
            <CardActions>
              <Button size="small" onClick={()=>navigate(element.url)}>
                Go to {element.name}
              </Button>
            </CardActions>
          </Card>
        </Grid2>
      ))}
    </Grid2>
    );
    }