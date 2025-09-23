import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  CardActions,
  Button,
  Grid,
  Box,
  LinearProgress,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Module } from "../../types";
import { dashboardService } from "../../services/dashboard.service";

export const BulkFeaturesList = () => {
  const [featureModules, setFeatureModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubModules = async () => {
      try {
        setLoading(true);
        setError(null);
        const subModules = await dashboardService.getSubModules("bulk-upload");
        setFeatureModules(subModules);
      } catch (err: any) {
        setError(err.message || "Failed to load bulk upload features.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubModules();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Bulk Upload Features
      </Typography>
      <Grid
        container
        spacing={3}
        rowSpacing={{ xs: 1, sm: 2, md: 3 }}
        columnSpacing={{ xs: 1, sm: 2, md: 3 }}
      >
        {loading && <Grid item xs={12}><LinearProgress /></Grid>}
        {error && <Grid item xs={12}><Alert severity="error">{error}</Alert></Grid>}
        {!loading && !error && featureModules.length === 0 && (
            <Grid item xs={12}><Alert severity="info">No bulk upload features available.</Alert></Grid>
        )}
        {!loading && !error && featureModules.map((element) => (
          <Grid item key={element.id} xs={12} sm={6} md={4} lg={3}>
            <Card sx={{ minWidth: 275, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <CardContent>
                <Typography variant="h6" component="div">
                  {element.name}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" onClick={() => navigate(element.url, { state: element })}>
                  Go to {element.name}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};